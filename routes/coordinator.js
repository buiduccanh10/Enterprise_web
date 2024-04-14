var express = require("express");
var router = express.Router();
var PostModel = require("../model/post");
var SpecializedModel = require("../model/specialized");
var CoordinatorModel = require("../model/coordinator");
var StudentModel = require("../model/student");
var DeadlineModel = require("../model/deadline");
const fs = require("fs");
const path = require("path");

router.get("/", async function (req, res, next) {
  res.render("coordinator/postPending", {
    layout: "coordinator_layout",
    coordinator: req.session.email,
  });
});

router.get("/readPost/:id", async (req, res) => {
  const postId = req.params.id;
  const post = await PostModel.find({ _id: postId }).lean();
  res.render("coordinator/readPost", {
    layout: "coordinator_layout",
    post: post,
    coordinator: req.session.email,
  });
});

router.get("/postPending", async function (req, res, next) {
  const coordinator = await CoordinatorModel.findOne({
    email: req.session.email,
  }).lean();

  if (!coordinator) {
    return res.status(404).send("Coordinator not found");
  }

  const specialized = await SpecializedModel.findById(
    coordinator.specializedID
  ).lean();

  if (!specialized) {
    return res.status(404).send("Specialized area not found");
  }

  const students = await StudentModel.find({
    specializedID: specialized._id,
  }).lean();

  if (students.length === 0) {
    return res
      .status(404)
      .send("No students found under this specialized area");
  }

  const post = await PostModel.find({
    email: { $in: students.map((student) => student.email) },
    isPending: true,
  }).lean();

  const postWithComment = post.map((postItem) => {
    const empty = postItem.comment === "";
    return { post: postItem, empty: empty };
  });

  res.render("coordinator/postPending", {
    layout: "coordinator_layout",
    data: postWithComment,
    coordinator: req.session.email,
  });
});

router.post("/postPending/message/:id", async (req, res) => {
  const postId = req.params.id;
  const message = req.body.message;
  const time = new Date().toLocaleString();

  const myPost = await PostModel.findById(postId);
  const deadline = await DeadlineModel.findOne({}).lean();

  if (myPost) {
    myPost.message += `${req.session.email}\n${time}\n${message}\n\n`;
    await myPost.save();
  }

  res.redirect("/coordinator/postPending");
});

router.get("/postPending/approvePost/:id", async (req, res) => {
  const postId = req.params.id;
  await PostModel.findByIdAndUpdate(
    postId,
    { isPending: false },
    { new: true }
  ).lean();
  res.redirect("/coordinator/postPending");
});

router.get("/postPending/deletePost/:id", async (req, res) => {
  const postId = req.params.id;
  await PostModel.findByIdAndDelete(postId).lean();
  res.redirect("/coordinator/postPending");
});

router.get("/postApproved", async function (req, res, next) {
  const coordinator = await CoordinatorModel.findOne({
    email: req.session.email,
  }).lean();

  if (!coordinator) {
    return res.status(404).send("Coordinator not found");
  }

  const specialized = await SpecializedModel.findById(
    coordinator.specializedID
  ).lean();

  if (!specialized) {
    return res.status(404).send("Specialized area not found");
  }

  const students = await StudentModel.find({
    specializedID: specialized._id,
  }).lean();

  if (students.length === 0) {
    return res
      .status(404)
      .send("No students found under this specialized area");
  }

  const post = await PostModel.find({
    email: { $in: students.map((student) => student.email) },
    isPending: false,
  }).lean();

  res.render("coordinator/postApproved", {
    layout: "coordinator_layout",
    data: post,
    coordinator: req.session.email,
  });
});

router.get("/postApproved/unApprovePost/:id", async (req, res) => {
  const postId = req.params.id;
  await PostModel.findByIdAndUpdate(
    postId,
    { isPending: true },
    { new: true }
  ).lean();
  res.redirect("/coordinator/postApproved");
});

router.get("/postApproved/showPost/:id", async (req, res) => {
  const postId = req.params.id;
  await PostModel.findByIdAndUpdate(
    postId,
    { isView: true },
    { new: true }
  ).lean();
  res.redirect("/coordinator/postApproved");
});

router.get("/postApproved/unShowPost/:id", async (req, res) => {
  const postId = req.params.id;
  await PostModel.findByIdAndUpdate(
    postId,
    { isView: false },
    { new: true }
  ).lean();
  res.redirect("/coordinator/postApproved");
});

router.get("/postApproved/deletePost/:id", async (req, res) => {
  const postId = req.params.id;
  await PostModel.findByIdAndDelete(postId).lean();

  const findFolder = path.join(
    __dirname,
    "../public/uploads/",
    postId.toString()
  );

  fs.rmdir(findFolder, { recursive: true }, (err) => {
    if (err) {
      console.error(`Error removing folder ${findFolder}: ${err}`);
    } else {
      console.log(`Folder ${findFolder} successfully removed.`);
    }
  });

  res.redirect("/coordinator/postApproved");
});

module.exports = router;
