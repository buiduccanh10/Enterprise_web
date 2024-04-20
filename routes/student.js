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
const moment = require('moment');

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

        await savedPost.updateOne({
          imagePath: `../public/uploads/${savedPost._id.toString()}/images`,
          docPath: `../public/uploads/${savedPost._id.toString()}/docx`,
        });

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
      fs.writeFileSync(destFilePath, file.buffer);
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

router.post("/readPost/message/:id", async function (req, res, next) {
  const postId = req.params.id;
  const message = req.body.message;
  const time = new Date().toLocaleString();

  const myPost = await PostModel.findById(postId);
  const deadline = await DeadlineModel.findOne({}).lean();

  if (myPost) {
    myPost.message += `${req.session.email}\n${time}\n${message}\n\n`;
    await myPost.save();
  }
  res.redirect(`/student/readPost/${postId}`);
});

router.post("/readPost/deleteFile", async function (req, res, next) {
  const postId = req.body.postId;
  const fileUrl = req.body.fileUrl;

  const filePath = path.join(__dirname, "../public", fileUrl);

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);

    res.redirect(`/student/readPost/${postId}`);
  } else {
    console.error(`File ${filePath} does not exist.`);
    res.sendStatus(404);
  }
});
const imagesExtensions = /.(png|jpg|jpeg)$/i;
const docxExtension = /.docx$/i;

const getImageFiles = (directory) => {
  try {
    return fs
      .readdirSync(directory)
      .filter((file) => imagesExtensions.test(file));
  } catch (error) {
    console.error(error.message);
    return [];
  }
};

const getDocxFiles = (directory) => {
  try {
    return fs.readdirSync(directory).filter((file) => docxExtension.test(file));
  } catch (error) {
    console.error(error.message);
    return [];
  }
};
router.get("/readPost/:id", async function (req, res, next) {
  const postId = req.params.id;
  const post = await PostModel.findById(postId).lean();
  
  const imagesDirectory = path.join(__dirname, post.imagePath);
  const docxDirectory = path.join(__dirname, post.docPath);
  
  const imageFiles = getImageFiles(imagesDirectory);
  const docxFiles = getDocxFiles(docxDirectory);

  const imagesWithUrls = imageFiles.map(
    (file) => `/uploads/${postId}/images/${file}`
  );
  const docxsWithUrls = docxFiles.map(
    (file) => `/uploads/${postId}/docx/${file}`
  );

  const deadline = await DeadlineModel.findOne({}).lean();
  const user = await StudentModel.findOne({ email: req.session.email }).lean();
  try {
    const post = await PostModel.findById(postId).lean();
    if (!post) {
      return res.status(404).send("Post not found");
    }
    const messages = post.message.split("\n\n");
    const extractedData = messages.map(message => {
      const lines = message.split("\n").filter(line => line.trim() !== "");
      if (lines.length < 3) {
        console.error("Invalid message format:", message);
        return null;
      }
      const email = lines[0].trim(); 
      const datetime = lines[1].trim(); 
      const comment = lines.slice(2).join("\n").trim(); 

      const timeDifference = moment().diff(moment(datetime), 'hours');
      let timeAgo;
      if (timeDifference < 24) {
        timeAgo = moment(datetime).fromNow(); // Less than a day
      } else {
        timeAgo = moment(datetime).fromNow(true); // More than a day
      }
      
      return { email, datetime: timeAgo, comment };
    }).filter(data => data !== null); 
    if (deadline && new Date() <= new Date(deadline.finalDeadLine)) {
      const boolean = true;
      res.render("student/readPost", {
      layout: "layout",
      post: post,
      deadline: deadline,
      images: imagesWithUrls,
      docxs: docxsWithUrls,
      student: user.name,
      messages: extractedData,
      boolean: boolean
    });
  } else {
    res.render("student/readPost", {
      layout: "layout",
      post: post,
      deadline: deadline,
      images: imagesWithUrls,
      docxs: docxsWithUrls,
      student: user.name,
      messages: extractedData,
    });
  }
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/readPost/updatePost/:id", async function (req, res, next) {
  const deadline = await DeadlineModel.findOne({}).lean();
  const user = await StudentModel.findOne({ email: req.session.email }).lean();

  const post = await PostModel.findById(req.params.id);

  if (deadline && new Date() <= new Date(deadline.finalDeadLine)) {
    const boolean = true;
    
    const message = "";
    res.render("student/updatePost", {
    post: post,
    layout: "layout",
    student: user.name,
    boolean: boolean,
    message: message,
    deadline: deadline,
  });
  } else {
    const message =
      "Out of update because the final deadline is over, please visit homepage 🎈";
    res.render("student/updatePost", {
      post: post,
      layout: "layout",
      student: user.name,
      message: message,
      deadline: deadline,
    });
  }
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

    if (deadline && new Date() <= new Date(deadline.finalDeadLine)) {
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

      res.redirect(`/student/readPost/${postId}`);
    } else {
      res.redirect(`/student/readPost/${postId}`);
    }
  }
);

module.exports = router;
