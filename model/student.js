var mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  isPending: Boolean,
  dateCreate: Date,
  roleID: String,
  specializedID: String,
});

const Student = mongoose.model("Student", studentSchema, "student");
module.exports = Student;
