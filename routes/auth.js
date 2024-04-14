var express = require("express");
var router = express.Router();
var AdminModel = require("../model/admin");
var RolesModel = require("../model/roles");
var SpecializedModel = require("../model/specialized");
var StudentModel = require("../model/student");
var GuestModel = require("../model/guest");
var ManagerModel = require("../model/manager");
var CoordinatorModel = require("../model/coordinator");
const Guest = require("../model/guest");

router.get("/login", function (req, res, next) {
  res.render("auth/login", { layout: "auth_layout" });
});

router.post("/login", async (req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  try {
    var admin = await AdminModel.findOne({
      email: email,
      password: password,
    }).lean();
    if (admin) {
      var role = await RolesModel.findById(admin.roleID).lean();
      if (role && role.roleName == "admin") {
        req.session.email = admin.email;
        return res.redirect("/admin/home");
      }
    }

    var coordinator = await CoordinatorModel.findOne({
      email: email,
      password: password,
    }).lean();
    if (coordinator) {
      var role = await RolesModel.findById(coordinator.roleID).lean();
      if (role && role.roleName == "coordinator") {
        req.session.email = coordinator.email;
        return res.redirect("/coordinator/postPending");
      }
    }

    var manager = await ManagerModel.findOne({
      email: email,
      password: password,
    }).lean();
    if (manager) {
      var role = await RolesModel.findById(manager.roleID).lean();
      if (role && role.roleName == "manager") {
        req.session.email = manager.email;
        return res.redirect("/manager");
      }
    }

    var student = await StudentModel.findOne({
      email: email,
      password: password,
    }).lean();
    if (student && student.isPending == false) {
      var role = await RolesModel.findById(student.roleID).lean();
      if (role && role.roleName == "student") {
        req.session.email = student.email;
        return res.redirect("/student");
      }
    }

    var guest = await GuestModel.findOne({
      email: email,
      password: password,
    }).lean();
    if (guest) {
      var role = await RolesModel.findById(guest.roleID).lean();
      if (role && role.roleName == "guest") {
        req.session.email = guest.email;
        return res.redirect("/");
      }
    }

    res.redirect("/auth/login");
  } catch (err) {
    res.redirect("/auth/login");
  }
});

router.get("/register", async (req, res) => {
  const specialized = await SpecializedModel.find({}).lean();
  res.render("auth/register", {
    layout: "auth_layout",
    data: specialized,
  });
});

router.post("/register", async (req, res) => {
  try {
    var userRegistration = req.body;
    var specializedID = userRegistration.specializedName;
    var studentRole = await RolesModel.findOne({ roleName: "student" }).lean();

    const existingStudent = await StudentModel.findOne({
      email: userRegistration.email,
    });
    if (existingStudent) {
      console.log("Duplicate user");
      return res.redirect("/auth/register");
    }

    var user = {
      name: userRegistration.name,
      email: userRegistration.email,
      password: userRegistration.password,
      isPending: true,
      dateCreate: new Date(),
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
  req.session = null;
  res.redirect("/auth/login");
});

module.exports = router;
