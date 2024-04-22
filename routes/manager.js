var express = require("express");
var router = express.Router();
var PostModel = require("../model/post");
const archiver = require("archiver");
var StudentModel = require("../model/student");
var SpecializedModel = require("../model/specialized");
var DeadlineModel = require("../model/deadline");
const path = require("path");
const fs = require("fs");
const iconv = require('iconv-lite');

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

  const deadline = await DeadlineModel.findOne({}).lean();
  const deadNow =  new Date();
  if(deadNow <= deadline.finalDeadLine){
    const boolean = true;
    res.render("manager/post", {
      layout: "manager_layout",
      manager: req.session.email,
      data: post,
      deadNow: deadNow,
      deadline:deadline.finalDeadLine,
      boolean: boolean,
    });    
  }
  else{
    const boolean = false;
    res.render("manager/post", {
      layout: "manager_layout",
      manager: req.session.email,
      data: post,
      deadNow: deadNow,
      deadline:deadline.finalDeadLine,
      boolean: boolean,
    });
  }

/*
if (deadline && new Date() <= new Date(deadline.finalDeadLine)) {
    const boolean = true;
    res.render("manager/post", {
      layout: "manager_layout",
      manager: req.session.email,
      data: post,
      deadline: deadline,
      boolean: boolean,
    });
} else {
  const boolean = false;
  res.render("manager/post", {
    layout: "manager_layout",
    manager: req.session.email,
    data: post,
    deadline:deadline,
    boolean: boolean,
  });
}

*/
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
  const deadNow =  new Date();
  if(deadNow <= deadline.finalDeadLine){
    const boolean = true;
    res.render("manager/readPost", {
      layout: "manager_layout",
      manager: req.session.email,
      post: post,
      images: imagesWithUrls,
      docxs: docxsWithUrls,
      deadNow: deadNow,
      deadline:deadline.finalDeadLine,
      boolean: boolean,
    });
  }
  else{
    const boolean = false;
    res.render("manager/readPost", {
      layout: "manager_layout",
      manager: req.session.email,
      post: post,
      images: imagesWithUrls,
      docxs: docxsWithUrls,
      deadNow: deadNow,
      deadline:deadline.finalDeadLine,
      boolean: boolean,
    });
  }
});

router.post("/readPost/downloadPost/:id", async (req, res) => {
  const postId = req.params.id;
  const post = await PostModel.findById(postId);
  const folderPath = path.join(__dirname, "../public/uploads/", postId);

  const zipFileName = post.description + ".zip";
  const zipFilePath = path.join(__dirname, "../public/", zipFileName);
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver("zip", {
    zlib: { level: 9 }, // set compression level
  });

  archive.pipe(output);

  archive.directory(folderPath, post.description);

  output.on("close", () => {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${zipFileName}"`
    );

    res.sendFile(zipFilePath, (err) => {
      if (err) {
        console.error("Error sending zip file:", err);
        res.status(500).send("Internal Server Error");
      }

      fs.unlinkSync(zipFilePath);
    });
  });

  archive.finalize();
});

router.post("/downloadAllPosts", async (req, res) => {
  const post = await PostModel.find({ isPending: false }).lean();
  const zipFileName = `all_post_${new Date().getDate()}` + ".zip";
  const zipFilePath = path.join(__dirname, "../public/", zipFileName);
  const output = fs.createWriteStream(zipFilePath);
  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  archive.pipe(output);

  for (let item of post) {
    const folderPath = path.join(
      __dirname,
      "../public/uploads/",
      item._id.toString()
    );
    if (fs.existsSync(folderPath)) {
      archive.directory(folderPath, item.description);
    }
  }

  output.on("close", () => {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${zipFileName}"`
    );

    res.sendFile(zipFilePath, (err) => {
      if (err) {
        console.error("Error sending zip file:", err);
        res.status(500).send("Internal Server Error");
      }

      fs.unlinkSync(zipFilePath);
    });
  });
  archive.finalize();
});

module.exports = router;
