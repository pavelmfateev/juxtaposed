const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  dateAdded: {
    type: Date,
    default: Date.now,
  },
  albumName: String,
  artistName: String,
  release_date: Date,
  albumUri: String,
  tracks:[String],
  grades: [{
    _id: false,
    category: { type: String, maxLength: 50 },
    parameters: [{
      _id: false,
      name: { type: String, maxLength: 50 },
      grade: { type: Number, required: true },
    }],
    categoryTotal: Number
  }],
  total: Number,
  comment: { type: String, maxLength: 100 }
});

module.exports = mongoose.model("Review", reviewSchema);
