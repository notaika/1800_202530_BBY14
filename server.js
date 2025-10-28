// server.js
// This file starts and runs our Node.js/Express server

// Import required libraries
import express from 'express';                // Web server framework
import expressLayouts from 'express-ejs-layouts'; // Allows a main layout file for EJS pages
import path from 'path';                      // Helps build correct file paths
import { fileURLToPath } from 'url';          // Converts ES module URL → file system path
import fs from 'fs';                          // File system (read/write files)

// Convert module path into standard file paths
const __filename = fileURLToPath(import.meta.url); // Full path to this file (server.js)
const __dirname = path.dirname(__filename);        // Folder that contains this file

// Create our Express app
const app = express();
const PORT = process.env.PORT || 3000;        // Use production port OR default 3000

// ------------------------------------------
// Enable EJS Layouts (like a master page)
// ------------------------------------------
app.use(expressLayouts);
app.set('layout', 'layout');                  // layout.ejs is our main template

// ------------------------------------------
// Serve static assets (CSS, JS, images)
// Files inside "/public" become available as "/public/..."
// ------------------------------------------
app.use('/public', express.static(path.join(__dirname, 'public')));

// ------------------------------------------
// Set up views (EJS templates)
// ------------------------------------------
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');               // We use .ejs files for pages

// ------------------------------------------
// "Fake database"
// Load recipe data from data/recipes.json
// Whenever we need recipes, we read from the file
// ------------------------------------------
const recipesPath = path.join(__dirname, 'data', 'recipes.json');

function loadRecipes() {
  return JSON.parse(fs.readFileSync(recipesPath, 'utf-8'));
}

// ------------------------------------------
// Simple API endpoint (fake database)
// GET /api/recipes → sends JSON array of all recipes
// ------------------------------------------
app.get('/api/recipes', (req, res) => {
  res.json(loadRecipes());
});

// ------------------------------------------
// Helper: Shuffle recipes randomly
// Used so every refresh shows a different order
// ------------------------------------------
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ------------------------------------------
// PAGE ROUTES (User-facing pages)
// Each page passes:
//  - recipes (if needed)
//  - active (for highlighting bottom nav item)
// ------------------------------------------

// Home Page (shows feed)
app.get("/", (req, res) => {
  let recipes = shuffle(loadRecipes());
  res.render("index", { recipes, active: "home" });
});

// Browse Page (1 recipe card per row)
app.get("/browse", (req, res) => {
  let recipes = shuffle(loadRecipes());
  res.render("browse", { recipes, active: "browse" });
});

// Create recipe page (future)
app.get('/create', (req, res) => {
  res.render('create', { active: 'create' });
});

// Recipe page (single recipe info in future)
app.get('/recipe', (req, res) => {
  let recipes = shuffle(loadRecipes());
  res.render('recipe', { recipes, active: 'recipe' });
});

// Profile page (future)
app.get('/profile', (req, res) => {
  res.render('profile', { active: 'profile' });
});

// ------------------------------------------
// Start server and show address in terminal
// ------------------------------------------
app.listen(PORT, () => {
  console.log(`PotLuck app running at http://localhost:${PORT}`);
});
