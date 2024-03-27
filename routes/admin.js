var express = require("express");
var router = express.Router();
var RolesModel = require("../model/roles");
var ManagerModel = require("../model/manager");
var CoordinatorModel = require("../model/coordinator");
var SpecializedModel = require("../model/specialized");

router.get("/home", function (req, res, next) {
  res.render("admin/home"); 
});


router.get("/register-role", async (req, res) => {
  const specialized = await SpecializedModel.find({});
  res.render("admin/register-role", {
    layout: "layout",
    data: specialized,
  });
});

router.post("/register-role", async (req, res) => {
  try {
    const controlRegistration = req.body;
    var roleType = controlRegistration.role;
    var specializedID = controlRegistration.specializedName;
    var coordinatorRole = await RolesModel.findOne({ roleName: "coordinator" });
    var managerRole = await RolesModel.findOne({ roleName: "coordinator" });
    let user = {
      name: controlRegistration.name,
      email: controlRegistration.email,
      password: controlRegistration.password
    };
    if (roleType === 'coordinator') {
      if (!specializedID) {
        return res.status(400).send("Specialized ID is required for coordinators.");
      }
      user.roleID = coordinatorRole._id;
      user.specializedID = specializedID;
      await CoordinatorModel.create(user);
    } else if (roleType === 'manager') {
      user.roleID = managerRole._id;
      await ManagerModel.create(user);
    } else {
      return res.status(400).send("Invalid role provided.");
    }
    res.redirect("/admin/home");
  } catch (err) {
    res.send(err);
  }
});
module.exports = router;
