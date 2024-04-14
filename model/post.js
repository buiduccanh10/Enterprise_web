var mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  description: String,
  dateCreate: Date,
  isPending: Boolean,
  isView: Boolean,
  message:String,
  imagePath: String,
  docPath: String,
  email: String,
});

const Post = mongoose.model("Post", postSchema, "post");
module.exports = Post;
