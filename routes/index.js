var express = require("express");
var router = express.Router();
var PostModel = require("../model/post");
var RoleModel = require("../model/roles");
const GuestModel = require("../model/guest");
const StudentModel = require("../model/student");
var DeadlineModel = require("../model/deadline");
const path = require("path");
const fs = require("fs");
const mammoth = require("mammoth");
const moment = require('moment');
const iconv = require('iconv-lite');
const { checkLoginSession } = require("../middlewares/auth");

router.get("/", checkLoginSession, async function (req, res, next) {
  const post = await PostModel.find({ isView: true }).lean();
  const deadline = await DeadlineModel.findOne({}).lean();
  const user = await GuestModel.findOne({ email: req.session.email }).lean();

  if (!user) {
    return res.redirect("/auth/login");
  }

  const matchedPosts = (
    await Promise.all(
      post.map(async (post) => {
        const student = await StudentModel.findOne({
          email: post.email,
        }).lean();
        return student && student.specializedID === user.specializedID
          ? post
          : null;
      })
    )
  ).filter((post) => post !== null);

  const role = await RoleModel.findOne({ roleName: "guest" });

  const isGuest = role._id.toString() === user.roleID;

  res.render("home/home", {
    layout: "layout",
    data: matchedPosts,
    student: req.session.email,
    deadline: deadline,
    isGuest: isGuest,
  });
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

const decodeFileName = (fileName) => {
  try {
    return iconv.decode(Buffer.from(fileName, 'binary'), 'utf-8');
  } catch (error) {
    console.error('Error decoding file name:', error);
    return fileName; // return the original file name if decoding fails
  }
};
const getDocxFiles = (directory) => {
  try {
    return fs.readdirSync(directory)
      .filter((file) => docxExtension.test(file))
      .map((file) => decodeFileName(file));
  } catch (error) {
    console.error(error.message);
    return [];
  }
};

router.get("/readPost/:id", async (req, res) => {
  const postId = req.params.id;
  const post = await PostModel.findById(postId).lean();

  let isGuest = false;
  let studentName = null;

  // Check if the user is logged in
  if (req.session.email) {
    const guestUser = await GuestModel.findOne({ email: req.session.email }).lean();
    if (guestUser) {
      const role = await RoleModel.findOne({ roleName: "guest" });
      isGuest = role && role._id.toString() === guestUser.roleID;
      studentName = guestUser.name;
    } else {
      // If user is not found in GuestModel, check StudentModel
      const studentUser = await StudentModel.findOne({ email: req.session.email }).lean();
      if (studentUser) {
        // If user is found in StudentModel, they are a student
        isGuest = false;
        studentName = studentUser.name;
      }
    }
  }

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
  res.render("home/readPost", {
    layout: "layout",
    post: post,
    isGuest: isGuest,
    images: imagesWithUrls,
    docxs: docxsWithUrls,
    student: studentName,
    deadline: deadline,
  });
});


// router.get("/specializedPost/:id", async function (req, res, next) {
//   const specialized = await SpecializedModel.find({}).lean();
//   const student = await StudentModel.find({ specializedID: req.params.id });
//   const studentEmail = student.map((student) => student.email);
//   const deadline = await DeadlineModel.findOne({}).lean();

//   const post = await PostModel.find({
//     isPending: false,
//     email: studentEmail,
//   }).lean();

//   res.render("home/specializedPost", {
//     layout: "layout",
//     data: post,
//     specialized: specialized,
//     student: req.session.email,
//     deadline: deadline,
//   });
// });

module.exports = router;
