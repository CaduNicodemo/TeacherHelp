const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  group: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'group',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  records: [
    {
      student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'student',
        required: true
      },
      present: {
        type: Boolean,
        default: false
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
  }
});

module.exports = mongoose.model('attendance', AttendanceSchema);