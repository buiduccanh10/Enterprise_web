var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("home", { title: "Express" });
});

router.get("/postCreate", function (req, res, next) {
  res.render("postCreate", { title: "postCreate" });
});

router.get("/report", function (req, res, next) {
  res.render("report", { title: "Report page" });
});
module.exports = router;
