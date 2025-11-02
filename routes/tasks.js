// routes/tasks.js
const express = require('express');
const router = express.Router();
const Task = require('../models/task');
const User = require('../models/user');

// Helper to format responses
function sendResponse(res, status, message, data) {
  res.status(status).json({ message, data });
}

// -------------------------
// GET /api/tasks
// -------------------------
router.get('/', async (req, res) => {
  try {
    let query = Task.find();

    if (req.query.where) query = query.find(JSON.parse(req.query.where));
    if (req.query.sort) query = query.sort(JSON.parse(req.query.sort));
    if (req.query.select) query = query.select(JSON.parse(req.query.select));
    if (req.query.skip) query = query.skip(parseInt(req.query.skip));
    if (req.query.limit) query = query.limit(parseInt(req.query.limit));

    if (req.query.count === 'true') {
      const count = await query.countDocuments();
      return sendResponse(res, 200, 'OK', count);
    }

    const tasks = await query.exec();
    sendResponse(res, 200, 'OK', tasks);
  } catch (err) {
    sendResponse(res, 400, 'Bad Request', err.message);
  }
});

// -------------------------
// POST /api/tasks
// -------------------------
router.post('/', async (req, res) => {
  try {
    const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body;

    if (!name || !deadline) {
      return sendResponse(res, 400, 'Name and deadline are required', {});
    }

    const task = new Task({
      name,
      description: description || '',
      deadline,
      completed: completed || false,
      assignedUser: assignedUser || '',
      assignedUserName: assignedUserName || 'unassigned'
    });

    await task.save();

    if (assignedUser) {
      const user = await User.findById(assignedUser);
      if (user) {
        user.pendingTasks.push(task._id.toString());
        await user.save();
      }
    }

    sendResponse(res, 201, 'Task created', task);
  } catch (err) {
    sendResponse(res, 400, 'Bad Request', err.message);
  }
});

// -------------------------
// GET /api/tasks/:id
// -------------------------
router.get('/:id', async (req, res) => {
  try {
    let query = Task.findById(req.params.id);
    if (req.query.select) query = query.select(JSON.parse(req.query.select));

    const task = await query.exec();
    if (!task) return sendResponse(res, 404, 'Task not found', {});
    sendResponse(res, 200, 'OK', task);
  } catch (err) {
    sendResponse(res, 400, 'Bad Request', err.message);
  }
});

// -------------------------
// PUT /api/tasks/:id
// -------------------------
router.put('/:id', async (req, res) => {
  try {
    const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body;

    if (!name || !deadline) {
      return sendResponse(res, 400, 'Name and deadline are required', {});
    }

    const oldTask = await Task.findById(req.params.id);
    if (!oldTask) return sendResponse(res, 404, 'Task not found', {});

    if (oldTask.assignedUser) {
      const oldUser = await User.findById(oldTask.assignedUser);
      if (oldUser) {
        oldUser.pendingTasks = oldUser.pendingTasks.filter(tid => tid !== oldTask._id.toString());
        await oldUser.save();
      }
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description: description || '',
        deadline,
        completed: completed || false,
        assignedUser: assignedUser || '',
        assignedUserName: assignedUserName || 'unassigned'
      },
      { new: true, runValidators: true }
    );

    if (assignedUser) {
      const newUser = await User.findById(assignedUser);
      if (newUser && !newUser.pendingTasks.includes(updatedTask._id.toString())) {
        newUser.pendingTasks.push(updatedTask._id.toString());
        await newUser.save();
      }
    }

    sendResponse(res, 200, 'Task updated', updatedTask);
  } catch (err) {
    sendResponse(res, 400, 'Bad Request', err.message);
  }
});

// -------------------------
// DELETE /api/tasks/:id
// -------------------------
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return sendResponse(res, 404, 'Task not found', {});

    if (task.assignedUser) {
      const user = await User.findById(task.assignedUser);
      if (user) {
        user.pendingTasks = user.pendingTasks.filter(tid => tid !== task._id.toString());
        await user.save();
      }
    }

    return res.status(204).send();
  } catch (err) {
    sendResponse(res, 400, 'Bad Request', err.message);
  }
});

module.exports = router;
