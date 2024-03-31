var express = require("express");
var router = express.Router();
var PostModel = require("../model/post");
var SpecializedModel = require("../model/specialized");
var CoordinatorModel = require("../model/coordinator");
var StudentModel = require("../model/student");
var ReportModel = require("../model/report");

router.get("/coordinator", async function (req, res, next) {
  res.render("coordinator/postPending", {
    layout: "coordinator_layout",
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

  res.render("coordinator/postPending", {
    layout: "coordinator_layout",
    data: post,
    coordinator: req.session.email,
  });
});

router.get("/postPending/approvePost/:id", async (req, res) => {
  const postId = req.params.id;
  await PostModel.findByIdAndUpdate(
    postId,
    { isPending: false },
    { new: true }
  );
  res.redirect("/coordinator/postPending");
});

router.get("/postPending/deletePost/:id", async (req, res) => {
  const postId = req.params.id;
  await PostModel.findByIdAndDelete(postId);
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

router.get("/reportPending", async function (req, res, next) {
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

  const report = await ReportModel.find({
    email: { $in: students.map((student) => student.email) },
    isPending: true,
  }).lean();

  const reportData = await Promise.all(
    report.map(async (report) => {
      const post = await PostModel.findById(report.postID).lean();
      return { ...report, post: post };
    })
  );

  res.render("coordinator/reportPending", {
    layout: "coordinator_layout",
    data: reportData,
    coordinator: req.session.email,
  });
});

router.get("/reportApproved", async function (req, res, next) {
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

  const report = await ReportModel.find({
    email: { $in: students.map((student) => student.email) },
    isPending: false,
  }).lean();

  const reportData = await Promise.all(
    report.map(async (report) => {
      const post = await PostModel.findById(report.postID).lean();
      return { ...report, post: post };
    })
  );

  res.render("coordinator/reportApproved", {
    layout: "coordinator_layout",
    data: reportData,
    coordinator: req.session.email,
  });
});

router.get("/reportPending/approveReport/:id", async (req, res) => {
  const reportId = req.params.id;
  const comment = req.query.comment;
  console.log(req.query.comment);

  await ReportModel.findByIdAndUpdate(
    reportId,
    { isPending: false, comment: comment },
    { new: true }
  );
  res.redirect("/coordinator/reportPending");
});

module.exports = router;
