var express = require("express");
var router = express.Router();
const multipart = require("connect-multiparty");
const multipartMiddleware = multipart();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
var PostModel = require("../model/post");
var RoleModel = require("../model/roles");
var StudentModel = require("../model/student");
var CoordinatorModel = require("../model/coordinator");
var SpecializedModel = require("../model/specialized");
var DeadlineModel = require("../model/deadline");
const nodemailer = require("nodemailer");

router.get("/", async function (req, res, next) {
  const post = await PostModel.find({ isView: true }).lean();
  const specialized = await SpecializedModel.find({}).lean();
  const deadline = await DeadlineModel.findOne({}).lean();
  const user = await StudentModel.findOne({ email: req.session.email }).lean();

  const role = await RoleModel.findOne({ roleName: "guest" });

  const isGuest = role._id.toString() === user.roleID;

  res.render("home/home", {
    layout: "layout",
    data: post,
    specialized: specialized,
    student: user.name,
    deadline: deadline,
    isGuest: isGuest,
  });
});

router.get("/postCreate", async function (req, res, next) {
  const deadline = await DeadlineModel.findOne({}).lean();
  const user = await StudentModel.findOne({ email: req.session.email }).lean();
  if (deadline && new Date() <= new Date(deadline.firstDeadLine)) {
    //Logic code to let the hbs get that deadline is valid
    const boolean = true
    const message =
      'Post submittion deadline is valid, please follow the terms ⚔';
    res.render("student/postCreate", {
      layout: "layout",
      student: user.name,
      deadline: deadline,
      message: message,
      boolean: boolean
    });
  } else {
    const message =
      "The submittion is closed, please visit post posted. Thank you 🎈";
    res.render("student/postCreate", {
      layout: "layout",
      student: user.name,
      deadline: deadline,
      message: message,
    });
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  "/upload",
  upload.fields([
    { name: "docs", maxCount: 10 },
    { name: "images", maxCount: 10 },
  ]),
  async (req, res) => {
    const description = req.body.description;
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
        html: description,
      };

      if (deadline && new Date() <= new Date(deadline.firstDeadLine)) {
        const newPost = new PostModel({
          description: description,
          isPending: true,
          isView: false,
          email: req.session.email,
          dateCreate: Date.now(),
          message: "",
          imagePath: "",
          docPath: "",
        });

        const savedPost = await newPost.save();
        const postFolderPath = path.join(
          __dirname,
          "../public/uploads/",
          savedPost._id.toString()
        );
        const docxPath = path.join(postFolderPath, "docx");
        const imagesPath = path.join(postFolderPath, "images");

        createFolder(docxPath);
        createFolder(imagesPath);

        await savedPost.updateOne({ imagePath: imagesPath, docPath: docxPath });

        await saveFilesFromMemory(req.files.docs, docxPath);
        await saveFilesFromMemory(req.files.images, imagesPath);

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
  }
);

async function saveFilesFromMemory(files, destPath) {
  if (files) {
    files.forEach((file) => {
      const destFilePath = path.join(destPath, file.originalname);
      fs.writeFileSync(destFilePath, file.buffer); // Ghi file từ buffer vào đường dẫn đích
    });
  }
}

function createFolder(folderPath) {
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
}

router.get("/myPost", async function (req, res, next) {
  const myPost = await PostModel.find({ email: req.session.email }).lean();
  const deadline = await DeadlineModel.findOne({}).lean();
  const user = await StudentModel.findOne({ email: req.session.email }).lean();
  const postComment = myPost.map((post) => {
    const empty = post.comment === "";
    return { myPost: post, empty: empty };
  });

  res.render("student/myPost", {
    layout: "layout",
    post: postComment,
    student: user.name,
    deadline: deadline,
  });
});

router.post("/myPost/message/:id", async function (req, res, next) {
  const postId = req.params.id;
  const message = req.body.message;
  const time = new Date().toLocaleString();

  const myPost = await PostModel.findById(postId);
  const deadline = await DeadlineModel.findOne({}).lean();

  if (myPost) {
    myPost.message += `${req.session.email}\n${time}\n${message}\n\n`;
    await myPost.save();
  }

  res.redirect("/student/myPost");
});

router.post("/readPost/deleteFile", async function (req, res, next) {
  const postId = req.body.postId;
  const fileUrl = req.body.fileUrl;

  const filePath = path.join(__dirname, "../public", fileUrl);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);

    res.redirect(`/readPost/${postId}`);
  } else {
    console.error(`File ${filePath} does not exist.`);
    res.sendStatus(404);
  }
});

router.get("/readPost/updatePost/:id", async function (req, res, next) {
  const deadline = await DeadlineModel.findOne({}).lean();
  const user = await StudentModel.findOne({ email: req.session.email }).lean();

  const post = await PostModel.findById(req.params.id);

  res.render("student/updatePost", {
    post: post,
    layout: "layout",
    student: user.name,
    deadline: deadline,
  });
});

router.post(
  "/updatePost/:id",
  upload.fields([
    { name: "docs", maxCount: 10 },
    { name: "images", maxCount: 10 },
  ]),
  async (req, res) => {
    const postId = req.params.id;
    const description = req.body.description;
    const deadline = await DeadlineModel.findOne({}).lean();

    if (deadline && new Date() <= new Date(deadline.firstDeadLine)) {
      await PostModel.findByIdAndUpdate(postId, {
        description: description,
      });

      const postFolderPath = path.join(
        __dirname,
        "../public/uploads/",
        postId.toString()
      );

      const docxPath = path.join(postFolderPath, "docx");
      const imagesPath = path.join(postFolderPath, "images");

      await saveFilesFromMemory(req.files.docs, docxPath);
      await saveFilesFromMemory(req.files.images, imagesPath);

      res.redirect(`/readPost/${postId}`);
    } else {
      res.redirect("/student");
    }
  }
);

module.exports = router;
