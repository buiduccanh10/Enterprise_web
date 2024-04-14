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

const getDocxFiles = (directory) => {
  try {
    return fs.readdirSync(directory).filter((file) => docxExtension.test(file));
  } catch (error) {
    console.error(error.message);
    return [];
  }
};

router.get("/readPost/:id", async (req, res) => {
  const postId = req.params.id;
  const post = await PostModel.findById(postId).lean();

  // const imagesDirectory = path.join(__dirname, '..', 'public', 'uploads', postId, 'images');
  // const docxDirectory = path.join(__dirname, '..', 'public', 'uploads', postId, 'docx');

  const imageFiles = getImageFiles(post.imagePath);
  const docxFiles = getDocxFiles(post.docPath);

  // Tạo danh sách file với địa chỉ URL đầy đủ
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
    images: imagesWithUrls,
    docxs: docxsWithUrls,
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
