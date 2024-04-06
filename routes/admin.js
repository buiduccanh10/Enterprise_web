var express = require("express");
var router = express.Router();
var RolesModel = require("../model/roles");
var ManagerModel = require("../model/manager");
var CoordinatorModel = require("../model/coordinator");
var SpecializedModel = require("../model/specialized");
var StudentModel = require("../model/student");
var DeadlineModel = require("../model/deadline");
var PostModel = require("../model/post");
router.get("/home", async function (req, res, next) {
  const deadline = await DeadlineModel.findOne({}).lean();
  const totalStudents = await StudentModel.countDocuments();
  const totalPosts = await PostModel.countDocuments();
  res.render("admin/home", {
    layout: "admin_layout",
    admin: req.session.email,
    deadline: deadline,
    totalStudents: totalStudents,
    totalPosts: totalPosts,
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
        ).lean();
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
        ).lean();
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
        ).lean();
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
  ).lean();
  res.redirect("/admin/studentPending");
});

router.get("/editStudent/:id", async (req, res) => {
  const studentId = req.params.id;
  const editStudent = await StudentModel.findById(studentId).lean();
  const specialized = await SpecializedModel.find({}).lean();

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
  await StudentModel.findByIdAndUpdate(studentId, data).lean();

  res.redirect("/admin/studentAccount");
});

router.get("/editManager/:id", async (req, res) => {
  const managerId = req.params.id;
  const editManager = await ManagerModel.findById(managerId).lean();

  res.render("admin/editManager", {
    layout: "admin_layout",
    editManager: editManager,
    admin: req.session.email,
  });
});

router.post("/editManager/:id", async (req, res) => {
  const managerId = req.params.id;
  const data = req.body;
  await ManagerModel.findByIdAndUpdate(managerId, data).lean();

  res.redirect("/admin/managerAccount");
});

router.get("/editCoordinator/:id", async (req, res) => {
  const coordinatorId = req.params.id;
  const editCoordinator = await CoordinatorModel.findById(coordinatorId).lean();
  const specialized = await SpecializedModel.find({}).lean();
  const editspecialized = await SpecializedModel.findById(
    editCoordinator.specializedID
  ).lean();

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
  await CoordinatorModel.findByIdAndUpdate(coordinatorId, data).lean();

  res.redirect("/admin/coordinatorAccount");
});

router.get("/deleteStudent/:id", async (req, res) => {
  const studentId = req.params.id;
  await StudentModel.findByIdAndDelete(studentId).lean();

  res.redirect("/admin/studentAccount");
});

router.get("/deleteManager/:id", async (req, res) => {
  const managerId = req.params.id;
  await ManagerModel.findByIdAndDelete(managerId).lean();

  res.redirect("/admin/managerAccount");
});

router.get("/deleteCoordinator/:id", async (req, res) => {
  const coordinatorId = req.params.id;
  await CoordinatorModel.findByIdAndDelete(coordinatorId).lean();

  res.redirect("/admin/coordinatorAccount");
});

router.get("/register-role", async (req, res) => {
  const specialized = await SpecializedModel.find({}).lean();
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
    var coordinatorRole = await RolesModel.findOne({
      roleName: "coordinator",
    }).lean();
    var managerRole = await RolesModel.findOne({ roleName: "manager" }).lean();
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

router.post("/deadline", async (req, res) => {
  const firstDeadlineDate = new Date(req.body.deadline);

  const finalDeadlineDate = new Date(
    firstDeadlineDate.getTime() + 14 * 24 * 60 * 60 * 1000
    // 14 days in milliseconds
  );

  const existingDeadline = await DeadlineModel.findOne({}).lean();

  if (existingDeadline) {
    await DeadlineModel.updateOne(
      {},
      { firstDeadLine: firstDeadlineDate, finalDeadLine: finalDeadlineDate }
    );
  } else {
    await DeadlineModel.create({
      firstDeadLine: firstDeadlineDate,
      finalDeadLine: finalDeadlineDate,
    });
  }

  res.redirect("/admin/home");
});
module.exports = router;
