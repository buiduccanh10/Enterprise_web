var express = require("express");
var router = express.Router();
var PostModel = require("../model/post");
var ReportModel = require("../model/report");
var SpecializedModel = require("../model/specialized");
const StudentModel = require("../model/student");
var DeadlineModel = require("../model/deadline");

router.get("/", async function (req, res, next) {
  const post = await PostModel.find({ isPending: false }).lean();
  const specialized = await SpecializedModel.find({});
  const deadline = await DeadlineModel.findOne({}).lean();
  const user = await StudentModel.findOne({ email: req.session.email }).lean();

  res.render("home/home", {
    layout: "layout",
    data: post,
    specialized: specialized,
    student: user.name,
    deadline: deadline
  });
});

router.get("/readPost/:id", async (req, res) => {
  const postId = req.params.id;
  const post = await PostModel.find({ _id: postId }).lean();
  const deadline = await DeadlineModel.findOne({}).lean();

  const postData = await Promise.all(
    post.map(async (post) => {
      const report = await ReportModel.find({
        postID: post._id,
        isPending: false,
      }).lean();
      return { ...post, report: report };
    })
  );
  res.render("home/readPost", {
    layout: "layout",
    post: postData,
    student: req.session.email,
    deadline: deadline,
  });
});

router.get("/specializedPost/:id", async function (req, res, next) {
  const specialized = await SpecializedModel.find({}).lean();
  const student = await StudentModel.find({ specializedID: req.params.id });
  const studentEmail = student.map((student) => student.email);
  const deadline = await DeadlineModel.findOne({}).lean();

  const post = await PostModel.find({
    isPending: false,
    email: studentEmail,
  }).lean();

  res.render("home/specializedPost", {
    layout: "layout",
    data: post,
    specialized: specialized,
    student: req.session.email,
    deadline: deadline,
  });
});

module.exports = router;
