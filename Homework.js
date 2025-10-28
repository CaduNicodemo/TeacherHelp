const mongoose = require('mongoose');

const HomeworkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'group',
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  submissions: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student'
      },
      completed: {
        type: Boolean,
        default: false
      },
      submissionDate: {
        type: Date
      },
      notes: {
        type: String
      }
    }
  ],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'teacher',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('homework', HomeworkSchema);