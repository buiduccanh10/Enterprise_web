var mongoose = require("mongoose");

const coordinatorSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  roleID: String,
  specializedID: String,
});

const Coordinator = mongoose.model(
  "Coordinator",
  coordinatorSchema,
  "coordinator"
);
module.exports = Coordinator;