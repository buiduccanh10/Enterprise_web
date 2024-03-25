var mongoose = require("mongoose");

const adminSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  roleID: String,
});

const Admin = mongoose.model("Admin", adminSchema, "admin");
module.exports = Admin;
