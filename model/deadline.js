var mongoose = require("mongoose");

const deadlineSchema = new mongoose.Schema({
    firstDeadLine: Date,
    finalDeadLine:Date,
});

const Deadline = mongoose.model("Deadline", deadlineSchema, "deadline");
module.exports = Deadline;
