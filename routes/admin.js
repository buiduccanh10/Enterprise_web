var express = require("express");
var router = express.Router();
var RolesModel = require("../model/roles");
var ManagerModel = require("../model/manager");
var CoordinatorModel = require("../model/coordinator");
var SpecializedModel = require("../model/specialized");
var StudentModel = require("../model/student");

router.get("/home", function (req, res, next) {
  res.render("admin/home", { layout: "admin_layout" });
});

router.get("/managerAccount", async (req, res) => {
  const manager = await ManagerModel.find({}).lean();
    res.render("admin/managerAccount", {
      layout: "admin_layout",
      data: manager,
    });
});

router.get("/coordinatorAccount", async (req, res) => {
  const coordinator = await CoordinatorModel.find({}).lean();
  if (coordinator) {
    const coordinatorWithSpecialized = await Promise.all(
      coordinator.map(async (coordinator) => {
        const specialized = await SpecializedModel.findById(
          coordinator.specializedID
        );
        return { ...coordinator, specialized: specialized };
      })
    );
    res.render("admin/coordinatorAccount", {
      layout: "admin_layout",
      data: coordinatorWithSpecialized,
    });
  }
});

router.get("/studentAccount", async (req, res) => {
  const student = await StudentModel.find({}).lean();
  if (student) {
    const studentsWithSpecialized = await Promise.all(
      student.map(async (student) => {
        const specialized = await SpecializedModel.findById(
          student.specializedID
        );
        return { ...student, specialized: specialized };
      })
    );
    res.render("admin/studentAccount", {
      layout: "admin_layout",
      data: studentsWithSpecialized,
    });
  }
});

router.get("/studentPending", async (req, res) => {
  const student = await StudentModel.find({ isPending: true }).lean();
  if (student) {
    const studentsWithSpecialized = await Promise.all(
      student.map(async (student) => {
        const specialized = await SpecializedModel.findById(
          student.specializedID
        );
        return { ...student, specialized: specialized };
      })
    );
    res.render("admin/studentPending", {
      layout: "admin_layout",
      data: studentsWithSpecialized,
    });
  }
});

router.post("/studentPending/:id", async (req, res) => {
  const studentId = req.params.id;

  try {
    const updatedStudent = await StudentModel.findByIdAndUpdate(
      studentId,
      { isPending: false },
      { new: true }
    );
    res.redirect("/admin/studentPending"); 
  } catch (error) {
    console.error("Error updating student:", error);
    res.status(500).send("Error updating student.");
  }
});

router.get("/register-role", async (req, res) => {
  const specialized = await SpecializedModel.find({});
  res.render("admin/register-role", {
    layout: "admin_layout",
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
      password: controlRegistration.password,
    };
    if (roleType === "coordinator") {
      if (!specializedID) {
        return res
          .status(400)
          .send("Specialized ID is required for coordinators.");
      }
      user.roleID = coordinatorRole._id;
      user.specializedID = specializedID;
      await CoordinatorModel.create(user);
    } else if (roleType === "manager") {
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
