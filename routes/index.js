var express = require("express");
var router = express.Router();
const { checkStudentSession } = require("../middlewares/auth");
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();
const fs = require("fs");
const path = require("path");
var PostModel = require("../model/post");
var SpecializedModel = require("../model/specialized");

/* GET home page. */
router.get("/", async function (req, res, next) {
  const post = await PostModel.find({});
  const specialized = await SpecializedModel.find({});
  res.render("home", {
    layout: "layout",
    data: post,
    specialized: specialized,
  });
});

router.get("/postCreate", checkStudentSession, function (req, res, next) {
  res.render("postCreate", { layout: "layout" });
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

router.post("/post", async (req, res) => {
  const { title, content } = req.body;

  var post = {
    title: title,
    body: content,
    dateCreate: Date.now(),
    isPending: true,
    email: req.session.email,
  };
  await PostModel.create(post);
});

router.get("/report", checkStudentSession, function (req, res, next) {
  res.render("report", { layout: "layout" });
});
router.get("/feedback", checkStudentSession, function (req, res, next) {
  res.render("feedback", { layout: "layout" });
});

module.exports = router;
