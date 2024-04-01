var express = require("express");
var router = express.Router();
var PostModel = require("../model/post");
var SpecializedModel = require("../model/specialized");
const StudentModel = require("../model/student");

router.get("/", async function (req, res, next) {
  const post = await PostModel.find({ isPending: false });
  const specialized = await SpecializedModel.find({});

  res.render("home/home", {
    layout: "layout",
    data: post,
    specialized: specialized,
    student: req.session.email,
  });
});

router.get("/specializedPost/:id", async function (req, res, next) {
  const specialized = await SpecializedModel.find({});
  const student = await StudentModel.find({ specializedID: req.params.id });
  const studentEmail = student.map((student) => student.email);

  const post = await PostModel.find({
    isPending: false,
    email: studentEmail,
  });

  res.render("home/specializedPost", {
    layout: "layout",
    data: post,
    specialized: specialized,
    student: req.session.email,
  });
});

module.exports = router;
