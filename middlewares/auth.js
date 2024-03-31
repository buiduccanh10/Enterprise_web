var AdminModel = require("../model/admin");
var RolesModel = require("../model/roles");
var StudentModel = require("../model/student");
var ManagerModel = require("../model/manager");
var CoordinatorModel = require("../model/coordinator");
//check login only
const checkLoginSession = (req, res, next) => {
  if (req.session.email) {
    next();
  } else {
    res.redirect("/auth/login");
  }
};

const checkAdminSession = async (req, res, next) => {
  var admin = await AdminModel.findOne({ email: req.session.email });
  if (admin) {
    var role = await RolesModel.findById(admin.roleID);
    if (req.session.email && role && role.roleName == "admin") {
      next();
    }
  } else {
    res.redirect("/auth/login");
    return;
  }
};

const checkStudentSession = async (req, res, next) => {
  var student = await StudentModel.findOne({ email: req.session.email });
  if (student) {
    var role = await RolesModel.findById(student.roleID);
    if (req.session.email && role && role.roleName == "student") {
      next();
    }
  } else {
    res.redirect("/auth/login");
    return;
  }
};

const checkCoordinatorSession = async (req, res, next) => {
  var coordinator = await CoordinatorModel.findOne({ email: req.session.email });
  if (coordinator) {
    var role = await RolesModel.findById(coordinator.roleID);
    if (req.session.email && role && role.roleName == "coordinator") {
      next();
    }
  } else {
    res.redirect("/auth/login");
    return;
  }
};

const checkManagerSession = async (req, res, next) => {
  var manager = await ManagerModel.findOne({ email: req.session.email });
  if (manager) {
    var role = await RolesModel.findById(manager.roleID);
    if (req.session.email && role && role.roleName == "manager") {
      next();
    }
  } else {
    res.redirect("/auth/login");
    return;
  }
};

const checkMultipleSession = (allowedRoles) => (req, res, next) => {
  if (req.session.email && allowedRoles.includes(req.session.role)) {
    next();
  } else {
    res.redirect("/auth/login");
  }
};

module.exports = {
  checkLoginSession,
  checkAdminSession,
  checkStudentSession,
  checkCoordinatorSession,
  checkManagerSession,
  checkMultipleSession,
};
