var mongoose = require("mongoose");

const rolesSchema = new mongoose.Schema({
  roleName: String,
});

const Role = mongoose.model("Role", rolesSchema, "roles");
module.exports = Role;
