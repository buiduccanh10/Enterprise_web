var express = require("express");
var router = express.Router();
var PostModel = require("../model/post");
var SpecializedModel = require("../model/specialized");
var CoordinatorModel = require("../model/coordinator");
var StudentModel = require("../model/student");
var ReportModel = require("../model/report");
var DeadlineModel = require("../model/deadline");

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

router.get("/postApproved/deletePost/:id", async (req, res) => {
  const postId = req.params.id;
  await PostModel.findByIdAndDelete(postId).lean();
  res.redirect("/coordinator/postApproved");
});

router.get("/reportPending", async function (req, res, next) {
    const coordinator = await CoordinatorModel.findOne({
      email: req.session.email,
    }).lean();

    const pendingReports = await ReportModel.find({ isPending: true }).lean();

    const reportsWithDetails = await Promise.all(pendingReports.map(async (report) => {
      const post = await PostModel.findById(report.postID).lean();
      if (!post) return null;

      const student = await StudentModel.findOne({ email: post.email }).lean();
      if (!student || String(student.specializedID) !== String(coordinator.specializedID)) {
        return null; 
      }

      return { ...report, post };
    }));

    const filteredReports = reportsWithDetails.filter(report => report !== null);

    if (filteredReports.length === 0) {
      return res.status(404).send("No pending reports found for this specialized area");
    }

    res.render("coordinator/reportPending", {
      layout: "coordinator_layout",
      data: filteredReports,
      coordinator: req.session.email,
    });
});

router.get("/reportPending/sendCommentReport/:id", async (req, res) => {
  const reportId = req.params.id;
  const comment = req.query.comment;
  const deadline = await DeadlineModel.findOne({}).lean();

  if (deadline && new Date() <= new Date(deadline.finalDeadLine)) {
    await ReportModel.findByIdAndUpdate(
      reportId,
      { comment: comment },
      { new: true }
    ).lean();
    res.redirect("/coordinator/reportPending");
  } else {
    res.redirect("/coordinator/reportPending");
  }
});

router.get("/reportPending/approveReport/:id", async (req, res) => {
  const reportId = req.params.id;

  await ReportModel.findByIdAndUpdate(
    reportId,
    { isPending: false },
    { new: true }
  ).lean();
  res.redirect("/coordinator/reportPending");
});

router.get("/reportPending/deleteReport/:id", async (req, res) => {
  const reportId = req.params.id;

  await ReportModel.findByIdAndDelete(reportId).lean();
  res.redirect("/coordinator/reportPending");
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

router.get("/reportApproved/unApproveReport/:id", async (req, res) => {
  const reportId = req.params.id;

  await ReportModel.findByIdAndUpdate(
    reportId,
    { isPending: true, comment: null },
    { new: true }
  ).lean();
  res.redirect("/coordinator/reportApproved");
});

router.get("/reportApproved/deleteReport/:id", async (req, res) => {
  const reportId = req.params.id;

  await ReportModel.findByIdAndDelete(reportId).lean();
  res.redirect("/coordinator/reportApproved");
});

module.exports = router;
