var express = require("express");
var router = express.Router();
var PostModel = require("../model/post");
const HTMLtoDOCX = require("html-to-docx");
const sanitizeHtml = require("sanitize-html");
const archiver = require("archiver");
var StudentModel = require("../model/student");
var SpecializedModel = require("../model/specialized");

router.get("/", async function (req, res, next) {
  const totalStudents = await StudentModel.countDocuments();
  const totalStudentsPending = await StudentModel.countDocuments({
    isPending: true,
  });
  const totalPosts = await PostModel.countDocuments();
  const totalPostsPending = await PostModel.countDocuments({ isPending: true });
  const totalPostsApproved = await PostModel.countDocuments({ isPending: false });
  console.log(totalPosts,totalPostsPending,totalPostsApproved);


  const specializations = await SpecializedModel.find({});

  const totalPostSpecialized = await Promise.all(
    specializations.map(async (specialized) => {

      const students = await StudentModel.find({
        specializedID: specialized._id,
      });
      const totalPosts = await Promise.all(
        students.map(async (student) => {
          return PostModel.countDocuments({ email: student.email });
        })
      );

      const totalPostsForSpecialized = totalPosts.reduce(
        (acc, val) => acc + val,
        0
      );
      console.log(totalPostsForSpecialized);


      //check//
      const percent= ((100/totalPosts)* totalPostsForSpecialized);
      //

      return {
        //check//
        specializedID: specialized._id,
        specializedName1: specialized.specializedName,
        //

        totalPosts: totalPostsForSpecialized,

        //check//
        percent: percent,
        //
      };
    })
  );

  console.log(totalPostSpecialized);




  res.render("manager/home", {
    layout: "manager_layout",
    manager: req.session.email,
    totalStudents: totalStudents,
    totalStudentsPending: totalStudentsPending,
    totalPosts: totalPosts,
    totalPostsPending: totalPostsPending,
    totalPostsApproved:totalPostsApproved,
    totalPostSpecialized: totalPostSpecialized,

    
  });
});

router.get("/post", async function (req, res, next) {
  const post = await PostModel.find({
    isPending: false,
  }).lean();

  res.render("manager/post", {
    layout: "manager_layout",
    manager: req.session.email,
    data: post,
  });
});



module.exports = router;
