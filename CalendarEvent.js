const mongoose = require('mongoose');

const CalendarEventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'group'
  }],
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

module.exports = mongoose.model('calendarEvent', CalendarEventSchema);