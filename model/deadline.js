var mongoose = require("mongoose");

const deadlineSchema = new mongoose.Schema({
    deadLine: Date,
});

const Deadline = mongoose.model("Deadline", deadlineSchema, "deadline");
module.exports = Deadline;
