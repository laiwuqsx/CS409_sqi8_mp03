// Load required packages
var mongoose = require('mongoose');

// Define our user schema
var UserSchema = new mongoose.Schema({
    name: {
      type: String,
      required: [true, 'User name is required']
    },
    email: {
      type: String,
      required: [true, 'User email is required'],
      unique: true,
      trim: true
    },
    pendingTasks: {
      type: [String],
      default: []
    },
    dateCreated: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false,
    toJSON: {
      transform: (_, ret) => {
        return ret;
      }
    }
  }
);

UserSchema.index({ email: 1 }, { unique: true });

// Export the Mongoose model
module.exports = mongoose.model('User', UserSchema);
