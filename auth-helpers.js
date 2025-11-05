// auth-helpers.js
const fs = require("fs");
const path = require("path");

// Path to our "users table"
const usersPath = path.join(__dirname, "data", "users.json");

// Read the users JSON
function loadUsers() {
  return JSON.parse(fs.readFileSync(usersPath, "utf-8"));
}

// Write back to JSON - temporary, no DB yet
function saveUsers(users) {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

// Find a user by email
function findUserByEmail(email) {
  return loadUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
}

module.exports = { loadUsers, saveUsers, findUserByEmail };
