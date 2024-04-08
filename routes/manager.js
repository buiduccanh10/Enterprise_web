var express = require("express");
var router = express.Router();
var PostModel = require("../model/post");
var ReportModel = require("../model/report");
const HTMLtoDOCX = require("html-to-docx");
const sanitizeHtml = require("sanitize-html");
const archiver = require("archiver");
var StudentModel = require("../model/student");

router.get("/", async function (req, res, next) {
  const totalStudents = await StudentModel.countDocuments();
  const totalStudentsPending = await StudentModel.countDocuments({
    isPending: true,
  });
  const totalPosts = await PostModel.countDocuments();
  const totalPostsPending = await PostModel.countDocuments({ isPending: true });
  const totalReports = await ReportModel.countDocuments();
  const totalReportsPending = await ReportModel.countDocuments({
    isPending: true,
  });

  res.render("manager/home", {
    layout: "manager_layout",
    manager: req.session.email,
    totalStudents: totalStudents,
    totalStudentsPending: totalStudentsPending,
    totalPosts: totalPosts,
    totalPostsPending: totalPostsPending,
    totalReports: totalReports,
    totalReportsPending: totalReportsPending,
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

router.get("/report", async function (req, res, next) {
  const report = await ReportModel.find({
    isPending: false,
  }).lean();

  const reportData = await Promise.all(
    report.map(async (report) => {
      const post = await PostModel.findById(report.postID).lean();
      return { ...report, post: post };
    })
  );

  res.render("manager/report", {
    layout: "manager_layout",
    manager: req.session.email,
    data: reportData,
  });
});

router.get("/downloadAllReport", async (req, res) => {
  try {
    const posts = await PostModel.find({ isPending: false }).lean();

    const zipFileName = "all_reports.zip";
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Sets the compression level
    });

    // Set headers
    res.setHeader("Content-Type", "application/zip");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${zipFileName}"`
    );

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(res); // Pipe the archive directly to the response stream

    for (const post of posts) {
      const reports = await ReportModel.find({
        postID: post._id,
        isPending: false,
      }).lean();

      if (reports.length > 0) {
        const htmlString = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Report</title>
        </head>
        <body>
          <div class="post">
            <div class="titlepost">
              <h1 class="namepost">${post.title}</h1>
              <h3 class="datepost">${post.dateCreate}</h3>
            </div>
            <div class="authorpost">
              <h3>${post.email}</h3>
            </div>
            <div class="report-content">
              ${reports
                .map(
                  (report) => `
                    <div class="report-item">
                      <h5>${report.email}:</h5>
                      <h7>${report.content}</h7>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        </body>
        </html>
      `;

        const docxBuffer = await HTMLtoDOCX(htmlString);
        archive.append(docxBuffer, { name: `${post.title}_reports.docx` });
      }
    }

    archive.finalize(); // Finalize the archive to send it to the response stream
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/readPost/:id", async (req, res) => {
  const postId = req.params.id;
  const post = await PostModel.find({ _id: postId }).lean();

  const postData = await Promise.all(
    post.map(async (post) => {
      const report = await ReportModel.find({
        postID: post._id,
        isPending: false,
      }).lean();
      return { ...post, report: report };
    })
  );
  res.render("manager/readPost", {
    layout: "manager_layout",
    post: postData,
    manager: req.session.email,
  });
});

router.get("/readPost/:id/downloadReport", async (req, res) => {
  const post = await PostModel.findById(req.params.id).lean();
  const report = await ReportModel.find({
    postID: post._id,
    isPending: false,
  }).lean();

  if (post) {
    const htmlString = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Report</title>
  </head>
  <body>
    <div class="post">
          <div class="titlepost">
            <h1 class="namepost">${post.title}</h1>
            <h3 class="datepost">${post.dateCreate}</h3>
          </div>
          <div class="authorpost">
            <h3>${post.email}</h3>
          </div>
          <div class="report-content" >
          ${report
            .map(
              (reportItem) => `
          <div class="report-item">
            <h5>${reportItem.email}:</h5>
            <h7>${reportItem.content}</h7>
          </div>
        `
            )
            .join("")}
        </div>
        </div>
  </body>
  </html>
    `;

    if (htmlString) {
      const fileBuffer = await HTMLtoDOCX(htmlString);

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${post.title}.docx"`
      );
      res.send(fileBuffer);
    }
  }
});

router.get("/readPost/:id/downloadPost", async (req, res) => {
  try {
    const postId = req.params.id;
    const post = await PostModel.findById(postId).lean();
    const report = await ReportModel.find({
      postID: postId,
      isPending: false,
    }).lean();

    if (!post) {
      return res.status(404).send("Post not found");
    }

    const sanitizedBody = sanitizeHtml(post.body, {
      allowedTags: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "p",
        "a",
        "ul",
        "ol",
        "li",
        "b",
        "i",
        "strong",
        "em",
        "strike",
        "code",
        "hr",
        "br",
        "div",
        "img",
      ],
      allowedAttributes: {
        a: ["href", "name", "target"],
        img: ["src", "alt", "style"],
      },
    });

    const htmlString = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Newspaper</title>
      </head>
      <body>
        <div class="post">
          <div class="titlepost">
            <h1 class="namepost">${post.title}</h1>
            <h3 class="datepost">${post.dateCreate}</h3>
          </div>
          <div class="authorpost">
            <h3>${post.email}</h3>
          </div>
          <div class="content">
            ${sanitizedBody}
          </div>
          <div class="report-content">
            ${report
              .map(
                (reportItem) => `
                  <div class="report-item">
                    <h5>${reportItem.email}:</h5>
                    <h7>${reportItem.content}</h7>
                  </div>
                `
              )
              .join("")}
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(htmlString);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

module.exports = router;
