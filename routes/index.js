var express = require("express");
var router = express.Router();
const { checkStudentSession } = require("../middlewares/auth");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("home", { layout: "layout" });
});

router.get("/postCreate", checkStudentSession, function (req, res, next) {
  res.render("postCreate", { layout: "layout" });
});

router.get("/report", checkStudentSession, function (req, res, next) {
  res.render("report", { layout: "layout" });
});
router.get("/feedback", checkStudentSession, function (req, res, next) {
  res.render("feedback", { layout: "layout" });
});

module.exports = router;
