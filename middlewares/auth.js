var AdminModel = require("../model/admin");
var RolesModel = require("../model/roles");
var StudentModel = require("../model/student");
//check login only
const checkLoginSession = (req, res, next) => {
  if (req.session.email) {
    next();
  } else {
    res.redirect("/auth/login");
  }
};

//check single role
const checkSingleSession = async (req, res, next) => {
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

//check multiple roles
const checkMultipleSession = (allowedRoles) => (req, res, next) => {
  if (req.session.email && allowedRoles.includes(req.session.role)) {
    next();
  } else {
    res.redirect("/auth/login");
  }
};

module.exports = {
  checkLoginSession,
  checkSingleSession,
  checkStudentSession,
  checkMultipleSession,
};
