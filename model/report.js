var mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  content: String,
  comment: String,
  dateCreate: Date,
  isPending: Boolean,
  email: String,
  postID: String,
});

const Report = mongoose.model("Report", reportSchema, "report");
module.exports = Report;
