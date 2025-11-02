// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');

// Helper to format responses
function sendResponse(res, status, message, data) {
  res.status(status).json({ message, data });
}

// -------------------------
// GET /api/users
// -------------------------
router.get('/', async (req, res) => {
  try {
    let query = User.find();

    // Parse JSON query params if present
    if (req.query.where) query = query.find(JSON.parse(req.query.where));
    if (req.query.sort) query = query.sort(JSON.parse(req.query.sort));
    if (req.query.select) query = query.select(JSON.parse(req.query.select));
    if (req.query.skip) query = query.skip(parseInt(req.query.skip));
    if (req.query.limit) query = query.limit(parseInt(req.query.limit));

    // Count mode
    if (req.query.count === 'true') {
      const count = await query.countDocuments();
      return sendResponse(res, 200, 'OK', count);
    }

    const users = await query.exec();
    sendResponse(res, 200, 'OK', users);
  } catch (err) {
    sendResponse(res, 400, 'Bad Request', err.message);
  }
});

// -------------------------
// POST /api/users
// -------------------------
router.post('/', async (req, res) => {
  try {
    const { name, email, pendingTasks } = req.body;

    if (!name || !email) {
      return sendResponse(res, 400, 'Name and email are required', {});
    }

    const user = new User({
      name,
      email,
      pendingTasks: pendingTasks || []
    });

    await user.save();
    sendResponse(res, 201, 'User created', user);
  } catch (err) {
    // Duplicate email, validation, etc.
    if (err.code === 11000) {
      sendResponse(res, 400, 'Email already exists', {});
    } else {
      sendResponse(res, 500, 'Server error', err.message);
    }
  }
});

// -------------------------
// GET /api/users/:id
// -------------------------
router.get('/:id', async (req, res) => {
  try {
    let query = User.findById(req.params.id);

    // handle ?select
    if (req.query.select) query = query.select(JSON.parse(req.query.select));

    const user = await query.exec();
    if (!user) return sendResponse(res, 404, 'User not found', {});
    sendResponse(res, 200, 'OK', user);
  } catch (err) {
    sendResponse(res, 400, 'Bad Request', err.message);
  }
});

// -------------------------
// PUT /api/users/:id
// -------------------------
router.put('/:id', async (req, res) => {
  try {
    const { name, email, pendingTasks } = req.body;

    if (!name || !email) {
      return sendResponse(res, 400, 'Name and email are required', {});
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, pendingTasks: pendingTasks || [] },
      { new: true, runValidators: true }
    );

    if (!user) return sendResponse(res, 404, 'User not found', {});
    sendResponse(res, 200, 'User updated', user);
  } catch (err) {
    sendResponse(res, 400, 'Bad Request', err.message);
  }
});

// -------------------------
// DELETE /api/users/:id
// -------------------------
router.delete('/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return sendResponse(res, 404, 'User not found', {});
    sendResponse(res, 200, 'User deleted', user);
  } catch (err) {
    sendResponse(res, 400, 'Bad Request', err.message);
  }
});

module.exports = router;
