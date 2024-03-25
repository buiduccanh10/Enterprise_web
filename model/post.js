var mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  title: String,
  body: String,
  dateCreate: Date,
  isPending: Boolean,
  email: String,
});

const Post = mongoose.model("Post", postSchema, "post");
module.exports = Post;
