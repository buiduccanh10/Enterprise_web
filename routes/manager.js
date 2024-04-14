var express = require("express");
var router = express.Router();
var PostModel = require("../model/post");
const archiver = require("archiver");
var StudentModel = require("../model/student");
var SpecializedModel = require("../model/specialized");
const path = require("path");
const fs = require("fs");

router.get("/", async function (req, res, next) {
  const totalStudents = await StudentModel.countDocuments();
  const totalStudentsPending = await StudentModel.countDocuments({
    isPending: true,
  });
  const totalPosts = await PostModel.countDocuments();
  const totalPostsPending = await PostModel.countDocuments({ isPending: true });
  const totalPostsApproved = await PostModel.countDocuments({
    isPending: false,
  });
  console.log(totalPosts, totalPostsPending, totalPostsApproved);

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
      const percent = (100 / totalPosts) * totalPostsForSpecialized;
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
    totalPostsApproved: totalPostsApproved,
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

  const imagesWithUrls = imageFiles.map(
    (file) => `/uploads/${postId}/images/${file}`
  );
  const docxsWithUrls = docxFiles.map(
    (file) => `/uploads/${postId}/docx/${file}`
  );

  res.render("manager/readPost", {
    layout: "manager_layout",
    manager: req.session.email,
    post: post,
    images: imagesWithUrls,
    docxs: docxsWithUrls,
  });
});

router.post("/readPost/downloadPost/:id", async (req, res) => {
  const postId = req.params.id;
  const post = await PostModel.findById(postId);
  const folderPath = path.join(__dirname, "../public/uploads/", postId);

  const zipFileName = post.description.trim() + ".zip";
  const zipFilePath = path.join(__dirname, "../public/", zipFileName);
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver("zip", {
    zlib: { level: 9 }, // set compression level
  });

  archive.pipe(output);

  // Append all files from the folder to the archive
  archive.directory(folderPath, postId);

  // Listen for the 'close' event of the output stream
  output.on("close", () => {
    // Set the Content-Disposition header to force download as a zip file
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${zipFileName}"`
    );

    // Send the zip file as a response
    res.sendFile(zipFilePath, (err) => {
      if (err) {
        console.error("Error sending zip file:", err);
        res.status(500).send("Internal Server Error");
      }

      // Delete the temporary zip file after sending
      fs.unlinkSync(zipFilePath);
    });
  });

  // Finalize the archive and close the output stream
  archive.finalize();
});

module.exports = router;
