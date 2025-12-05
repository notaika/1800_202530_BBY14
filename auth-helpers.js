// auth-helpers.js
// Responsibilities:
//  - Lightweight helpers to read/write a local JSON "users table"
//  - Provide a simple lookup utility by email
// Notes:
//  - Intended for development/demo only; no persistence guarantees
//  - JSON format is expected to be an array of user objects
const fs = require("fs");
const path = require("path");

// Path to our "users table" (JSON file under /data)
const usersPath = path.join(__dirname, "data", "users.json");

// Read the users JSON (returns an array)
function loadUsers() {
  try {
    const raw = fs.readFileSync(usersPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    // Fail-safe: if file is missing or invalid, return an empty list
    console.error("auth-helpers: loadUsers failed:", err?.message || err);
    return [];
  }
}

// Write back to JSON (optional utility)
function saveUsers(users) {
  try {
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("auth-helpers: saveUsers failed:", err?.message || err);
  }
}

// Find a user by email (case-insensitive match)
function findUserByEmail(email) {
  const target = String(email || "").toLowerCase();
  return loadUsers().find(u => String(u?.email || "").toLowerCase() === target);
}

module.exports = { loadUsers, saveUsers, findUserByEmail };
