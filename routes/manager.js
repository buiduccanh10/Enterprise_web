var express = require("express");
var router = express.Router();
var PostModel = require("../model/post");
var ReportModel = require("../model/report");

router.get("/", async function (req, res, next) {
  res.render("manager/home", {
    layout: "manager_layout",
    manager: req.session.email,
  });
});

router.get("/home", async function (req, res, next) {
  const post = await PostModel.find({
    isPending: false,
  }).lean();

  res.render("manager/home", {
    layout: "manager_layout",
    manager: req.session.email,
    data: post,
  });
});

router.get("/readPost/:id", async (req, res) => {
  const postId = req.params.id;
  const post = await PostModel.find({ _id: postId }).lean();

  const postData = await Promise.all(
    post.map(async (post) => {
      const report = await ReportModel.find({ postID: post._id }).lean();
      return { ...post, report: report };
    })
  );
  res.render("manager/readPost", {
    layout: "manager_layout",
    post: postData,
    manager: req.session.email,
  });
});

router.get("/readPost/downloadPost/:id", async (req, res) => {
    console.log(req.params.id);
  });

module.exports = router;
