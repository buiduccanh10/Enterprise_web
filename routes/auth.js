var express = require("express");
var router = express.Router();
var AdminModel = require("../model/admin");
var RolesModel = require("../model/roles");
var SpecializedModel = require("../model/specialized");
var StudentModel = require("../model/student");

router.get("/login", function (req, res, next) {
  res.render("auth/login", { layout: "auth_layout" });
});

router.post("/login", async (req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  try {
    var admin = await AdminModel.findOne({ email: email, password: password });
    if (admin) {
      var role = await RolesModel.findById(admin.roleID);
      if (role && role.roleName == "admin") {
        req.session.email = admin.email;
        return res.redirect("/admin/home");
      }
    }

    var student = await StudentModel.findOne({
      email: email,
      password: password,
    });
    if (
      student
      // && student.isPending == false
    ) {
      var role = await RolesModel.findById(student.roleID);
      if (role && role.roleName == "student") {
        req.session.email = student.email;
        return res.redirect("/");
      }
    }

    res.redirect("/auth/login");
  } catch (err) {
    res.redirect("/auth/login");
  }
});

router.get("/register", async (req, res) => {
  const specialized = await SpecializedModel.find({});
  res.render("auth/register", {
    layout: "auth_layout",
    data: specialized,
  });
});

router.post("/register", async (req, res) => {
  try {
    var userRegistration = req.body;
    const currentDate = new Date();
    const localDateTime = new Date(currentDate.getTime() + 7 * 60 * 60 * 1000);
    var specializedID = userRegistration.specializedName;
    var studentRole = await RolesModel.findOne({ roleName: "student" });

    if (!studentRole) {
      return res.status(400).send("Student role not found.");
    }

    var user = {
      name: userRegistration.name,
      email: userRegistration.email,
      password: userRegistration.password,
      isPending: true,
      dateCreate: localDateTime,
      roleID: studentRole._id,
      specializedID: specializedID,
    };
    await StudentModel.create(user);
    res.redirect("/auth/login");
  } catch (err) {
    res.send(err);
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/auth/login");
});

module.exports = router;
