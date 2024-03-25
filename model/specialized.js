var mongoose = require("mongoose");

const specializedSchema = new mongoose.Schema({
  specializedName: String,
});

const Specialized = mongoose.model(
  "Specialized",
  specializedSchema,
  "specialized"
);
module.exports = Specialized;
