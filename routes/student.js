var express = require("express");
var router = express.Router();
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();
const fs = require("fs");
const path = require("path");
var PostModel = require("../model/post");
var StudentModel = require("../model/student");
var CoordinatorModel = require("../model/coordinator");
var ReportModel = require("../model/report");
var SpecializedModel = require("../model/specialized");
var DeadlineModel = require("../model/deadline");
const nodemailer = require("nodemailer");

router.get("/", async function (req, res, next) {
  const post = await PostModel.find({ isPending: false }).lean();
  const specialized = await SpecializedModel.find({}).lean();
  const deadline = await DeadlineModel.findOne({}).lean();
  const user = await StudentModel.findOne({ email: req.session.email }).lean();

  res.render("home/home", {
    layout: "layout",
    data: post,
    specialized: specialized,
    student: user.name,
    deadline: deadline,
  });
});

router.get("/postCreate", async function (req, res, next) {
  const deadline = await DeadlineModel.findOne({}).lean();
  const user = await StudentModel.findOne({ email: req.session.email }).lean();
  if (deadline && new Date() <= new Date(deadline.firstDeadLine)) {
    //Logic code to let the hbs get that deadline is valid
    const message = "Post submittion deadline is valid, please follow the rules ⚔";
    res.render("student/postCreate", {
      layout: "layout",
      student: user.name,
      deadline: deadline,
      message: message
    });
  } else {   
    const message = "The submittion is closed, please visit post posted. Thank you 🎈";
    res.render("student/postCreate", {
      layout: "layout",
      student: user.name,
      deadline: deadline,
      message: message
    });
  }
});

router.post("/upload", multipartMiddleware, (req, res) => {
  try {
    let fileName = Date.now() + req.files.upload.name;
    fs.readFile(req.files.upload.path, function (err, data) {
      const newPath = path.join(__dirname, "../public/uploads/", fileName);
      fs.writeFile(newPath, data, function (err) {
        if (err) console.log({ err: err });
        else {
          console.log(req.files.upload.originalFilename);

          let url = "/uploads/" + fileName;
          let msg = "Upload successfully";
          let funcNum = req.query.CKEditorFuncNum;
          console.log({ url, msg, funcNum });

          const script =
            "<script>window.parent.CKEDITOR.tools.callFunction('" +
            funcNum +
            "','" +
            url +
            "','" +
            msg +
            "');</script>";

          res.status(201).send(script);
        }
      });
    });
  } catch (error) {
    console.log(error.message);
  }
});

router.post("/post", async function (req, res) {
  const { title, content } = req.body;
  const deadline = await DeadlineModel.findOne({}).lean();

  const student = await StudentModel.findOne({
    email: req.session.email,
  }).lean();
  const coordinator = await CoordinatorModel.findOne({
    specializedID: student.specializedID,
  }).lean();

  if (student.specializedID == coordinator.specializedID) {
    let transporter = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.example.com",
      port: 587,
      secure: false,
      auth: {
        user: "buiduccanh10@gmail.com",
        pass: "aqeh djpx fsqv xpxp",
      },
    });

    let mailOptions = {
      from: '"Coordinator system notification" <buiduccanh10@gmail.com>', // Sender address
      to: coordinator.email,
      subject: "You have new post pending!!!",
      text: "New post pending",
      html: content,
    };

    if (deadline && new Date() <= new Date(deadline.firstDeadLine)) {
      var post = {
        title: title,
        body: content,
        dateCreate: Date.now(),
        isPending: true,
        email: req.session.email,
      };
      await PostModel.create(post);

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return console.log(error);
        }
      });

      res.redirect("/student/myPost");
    } else {
      res.redirect("/student");
    }
  }
});

router.get("/report/:id", async function (req, res, next) {
  const post = await PostModel.findById(req.params.id);
  const deadline = await DeadlineModel.findOne({}).lean();

  if (post.email !== req.session.email) {
    res.render("student/report", {
      layout: "layout",
      post: post,
      student: req.session.email,
      deadline: deadline,
    });
  } else {
    res.redirect("/student");
  }
});

router.post("/report/:id", async function (req, res, next) {
  const contentrp = req.body.reporttext;

  const deadline = await DeadlineModel.findOne({}).lean();

  if (deadline && new Date() <= new Date(deadline.firstDeadLine)) {
    const report = {
      content: contentrp,
      comment: null,
      dateCreate: new Date(),
      isPending: true,
      email: req.session.email,
      postID: req.params.id,
    };

    await ReportModel.create(report);

    res.redirect("/student");
  } else {
    res.redirect("/student");
  }
});

router.get("/editReport/:id", async function (req, res, next) {
  const report = await ReportModel.findById(req.params.id).lean();
  const post = await PostModel.findById(report.postID).lean();

  res.render("student/editReport", {
    layout: "layout",
    post: post,
    report: report,
    student: req.session.email,
  });
});

router.post("/editReport/:id", async function (req, res, next) {
  const contentrp = req.body.reporttext;
  const reportId = req.params.id;

  const deadline = await DeadlineModel.findOne({}).lean();

  if (deadline && new Date() <= new Date(deadline.finalDeadLine)) {
    await ReportModel.findByIdAndUpdate(
      reportId,
      { content: contentrp, dateCreate: new Date() },
      { new: true }
    ).lean();

    res.redirect("/student/reportedPost");
  } else {
    res.redirect("/student");
  }
});

router.get("/reportedPost", async function (req, res, next) {
  const report = await ReportModel.find({ email: req.session.email }).lean();
  const deadline = await DeadlineModel.findOne({}).lean();

  if (report) {
    const reportWithPost = await Promise.all(
      report.map(async (report) => {
        const post = await PostModel.findById(report.postID).lean();
        return { ...report, post: post };
      })
    );
    res.render("student/reportedPost", {
      layout: "layout",
      report: reportWithPost,
      student: req.session.email,
      deadline: deadline,
    });
  }
});

router.get("/deleteReport/:id", async function (req, res, next) {
  await ReportModel.findByIdAndDelete(req.params.id).lean();
  res.redirect("/student/reportedPost");
});

router.get("/myPost", async function (req, res, next) {
  const myPost = await PostModel.find({ email: req.session.email }).lean();
  const deadline = await DeadlineModel.findOne({}).lean();

  res.render("student/myPost", {
    layout: "layout",
    post: myPost,
    student: req.session.email,
    deadline: deadline,
  });
});

module.exports = router;
