var mongoose = require("mongoose");

const guestSchema = new mongoose.Schema({
  email: String,
  password: String,
  name: String,
  dateCreate: Date,
  roleID: String,
  specializedID: String,
});

const Guest = mongoose.model("Guest", guestSchema, "guest");
module.exports = Guest;
