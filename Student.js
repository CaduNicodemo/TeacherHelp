const mongoose = require('mongoose');

const StudentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String
  },
  phone: {
    type: String
  },
  groups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'group'
  }],
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('student', StudentSchema);