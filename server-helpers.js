// Server-side helper functions.
const fs = require("fs");
const path = require("path"); // <-- Added back

// Paths
const recipesPath = path.join(__dirname, "data", "recipes.json");
const profileFeedPath = path.join(__dirname, "data", "profile-feed.json");

// Helper functions for our data loading
// load recipes - I think this is Mayvee's
function loadRecipes() {
  return JSON.parse(fs.readFileSync(recipesPath, "utf-8"));
}

// Loads the profile data
function loadProfileFeed() {
  return JSON.parse(fs.readFileSync(profileFeedPath, "utf-8"));
}

// randomly shuffles recipes
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
// export
module.exports = {
  loadRecipes,
  loadProfileFeed,
  shuffle,
};
