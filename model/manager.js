var mongoose = require("mongoose");

const managerSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  roleID: String,
});

const Manager = mongoose.model("Manager", managerSchema, "manager");
module.exports = Manager;
