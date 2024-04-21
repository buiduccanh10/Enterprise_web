var express = require("express");
var router = express.Router();
var PostModel = require("../model/post");
var SpecializedModel = require("../model/specialized");
var CoordinatorModel = require("../model/coordinator");
var StudentModel = require("../model/student");
var DeadlineModel = require("../model/deadline");
const fs = require("fs");
const path = require("path");
const iconv = require('iconv-lite');

router.get("/", async function (req, res, next) {
  res.render("coordinator/postPending", {
    layout: "coordinator_layout",
    coordinator: req.session.email,
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

  res.render("manager/readPost", {
    layout: "coordinator_layout",
    coordinator: req.session.email,
    post: post,
    images: imagesWithUrls,
    docxs: docxsWithUrls,
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

  const postWithComment = post.map((postItem) => {
    const empty = postItem.comment === "";
    return { post: postItem, empty: empty };
  });
  

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
      res.render("coordinator/postPending", {
      layout: "coordinator_layout",
      post: post,
      deadline: deadline,
      images: imagesWithUrls,
      docxs: docxsWithUrls,
      student: user.name,
      messages: extractedData,
      boolean: boolean
    });
  } else {
    res.render("coordinator/postPending", {
      layout: "coordinator_layout",
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




/*
  res.render("coordinator/postPending", {
    layout: "coordinator_layout",
    data: postWithComment,
    coordinator: req.session.email,
  });
*/









});

router.post("/postPending/message/:id", async (req, res) => {
  const postId = req.params.id;
  const message = req.body.message;
  const time = new Date().toLocaleString();

  const myPost = await PostModel.findById(postId);
  const deadline = await DeadlineModel.findOne({}).lean();

  if (myPost) {
    myPost.message += `${req.session.email}\n${time}\n${message}\n\n`;
    await myPost.save();
  }

  res.redirect("/coordinator/postPending");
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

router.get("/postApproved/showPost/:id", async (req, res) => {
  const postId = req.params.id;
  await PostModel.findByIdAndUpdate(
    postId,
    { isView: true },
    { new: true }
  ).lean();
  res.redirect("/coordinator/postApproved");
});

router.get("/postApproved/unShowPost/:id", async (req, res) => {
  const postId = req.params.id;
  await PostModel.findByIdAndUpdate(
    postId,
    { isView: false },
    { new: true }
  ).lean();
  res.redirect("/coordinator/postApproved");
});

router.get("/postApproved/deletePost/:id", async (req, res) => {
  const postId = req.params.id;
  await PostModel.findByIdAndDelete(postId).lean();

  const findFolder = path.join(
    __dirname,
    "../public/uploads/",
    postId.toString()
  );

  fs.rmdir(findFolder, { recursive: true }, (err) => {
    if (err) {
      console.error(`Error removing folder ${findFolder}: ${err}`);
    } else {
      console.log(`Folder ${findFolder} successfully removed.`);
    }
  });

  res.redirect("/coordinator/postApproved");
});

module.exports = router;
