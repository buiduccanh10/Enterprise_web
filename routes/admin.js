var express = require("express");
var router = express.Router();
var RolesModel = require("../model/roles");
var ManagerModel = require("../model/manager");
var CoordinatorModel = require("../model/coordinator");
var SpecializedModel = require("../model/specialized");
var StudentModel = require("../model/student");

router.get("/home", function (req, res, next) {
  res.render("admin/home", {
    layout: "admin_layout",
    admin: req.session.email,
  });
});

router.get("/managerAccount", async (req, res) => {
  const manager = await ManagerModel.find({}).lean();
  res.render("admin/managerAccount", {
    layout: "admin_layout",
    data: manager,
    admin: req.session.email,
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
      admin: req.session.email,
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
      admin: req.session.email,
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
      admin: req.session.email,
    });
  }
});

router.get("/studentPending/approve/:id", async (req, res) => {
  const studentId = req.params.id;
  await StudentModel.findByIdAndUpdate(
    studentId,
    { isPending: false },
    { new: true }
  );
  res.redirect("/admin/studentPending");
});

router.get("/editStudent/:id", async (req, res) => {
  const studentId = req.params.id;
  const editStudent = await StudentModel.findById(studentId);
  const specialized = await SpecializedModel.find({});

  res.render("admin/editStudent", {
    layout: "admin_layout",
    editStudent: editStudent,
    specialized: specialized,
    admin: req.session.email,
  });
});

router.post("/editStudent/:id", async (req, res) => {
  const studentId = req.params.id;
  const data = req.body;
  await StudentModel.findByIdAndUpdate(studentId, data);

  res.redirect("/admin/studentAccount");
});

router.get("/editManager/:id", async (req, res) => {
  const managerId = req.params.id;
  const editManager = await ManagerModel.findById(managerId);

  res.render("admin/editManager", {
    layout: "admin_layout",
    editManager: editManager,
    admin: req.session.email,
  });
});

router.post("/editManager/:id", async (req, res) => {
  const managerId = req.params.id;
  const data = req.body;
  await ManagerModel.findByIdAndUpdate(managerId, data);

  res.redirect("/admin/managerAccount");
});

router.get("/editCoordinator/:id", async (req, res) => {
  const coordinatorId = req.params.id;
  const editCoordinator = await CoordinatorModel.findById(coordinatorId);
  const specialized = await SpecializedModel.find({});
  const editspecialized = await SpecializedModel.findById(
    editCoordinator.specializedID
  );

  res.render("admin/editCoordinator", {
    layout: "admin_layout",
    editCoordinator: editCoordinator,
    specialized: specialized,
    editspecialized: editspecialized,
    admin: req.session.email,
  });
});

router.post("/editCoordinator/:id", async (req, res) => {
  const coordinatorId = req.params.id;
  const data = req.body;
  await CoordinatorModel.findByIdAndUpdate(coordinatorId, data);

  res.redirect("/admin/coordinatorAccount");
});

router.get("/deleteStudent/:id", async (req, res) => {
  const studentId = req.params.id;
  await StudentModel.findByIdAndDelete(studentId);

  res.redirect("/admin/studentAccount");
});

router.get("/deleteManager/:id", async (req, res) => {
  const managerId = req.params.id;
  await ManagerModel.findByIdAndDelete(managerId);

  res.redirect("/admin/managerAccount");
});

router.get("/deleteCoordinator/:id", async (req, res) => {
  const coordinatorId = req.params.id;
  await CoordinatorModel.findByIdAndDelete(coordinatorId);

  res.redirect("/admin/coordinatorAccount");
});

router.get("/register-role", async (req, res) => {
  const specialized = await SpecializedModel.find({});
  res.render("admin/register-role", {
    layout: "admin_layout",
    data: specialized,
    admin: req.session.email,
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
