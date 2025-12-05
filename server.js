// Server: Express + EJS routing
// - Serves static assets under /js, /css, /assets
// - Injects Firebase config from environment into views
// - Defines page routes without altering layout/markup expectations
//
// Note: This file focuses on clarity and small comments only; behavior unchanged.
//       Keep views named as-is and avoid restructuring templates.

// Load .env variables
require("dotenv").config();

// REQUIRES
const express = require("express");
const app = express();
// Parse JSON bodies for any API-style endpoints
app.use(express.json());

// Firebase config is passed to client templates for initialization
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

// Static file hosting for front-end assets
app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/assets", express.static("./public/assets"));

// EJS view engine configuration
app.set("views", "./views");
app.set("view engine", "ejs");

// PAGE ROUTES
// Landing
app.get("/", (req, res) => {
  res.render("landing", {
    firebaseConfig: firebaseConfig,
  });
});

// Auth: Login
app.get("/login", (req, res) => {
  res.render("login", { firebaseConfig: firebaseConfig });
});

// Auth: Signup
app.get("/signup", (req, res) => {
  res.render("signup", { firebaseConfig: firebaseConfig });
});

// Home
app.get("/home", (req, res) => {
  // This renders views/index.ejs
  res.render("index", {
    active: "home",
    firebaseConfig: firebaseConfig,
  });
});

// Alternate main entry (kept for compatibility)
app.get("/main", (req, res) => {
  res.render("main", { active: "home", firebaseConfig: firebaseConfig });
});

// Communities
app.get("/communities", (req, res) => {
  res.render("communities", {
    active: "community",
    firebaseConfig: firebaseConfig,
  });
});

// Communities: create
app.get("/communities/create", (req, res) => {
  res.render("create-community", {
    active: "community",
    firebaseConfig: firebaseConfig,
  });
});

// Communities: detail
app.get("/communities/:id", (req, res) => {
  res.render("community", {
    active: "community",
    firebaseConfig: firebaseConfig,
  });
});

// Recipes: create
app.get("/create", (req, res) => {
  res.render("create", { active: "create", firebaseConfig: firebaseConfig });
});

// Recipes: single (short route)
app.get("/recipe", (req, res) => {
  res.render("recipe", {
    firebaseConfig: firebaseConfig,
  });
});

// Profile (current user)
app.get("/profile", (req, res) => {
  res.render("profile", {
    active: "profile",
    firebaseConfig: firebaseConfig,
  });
});

// Recipes: full details page
app.get("/recipeDetails", (req, res) => {
  res.render("recipeDetails", {
    firebaseConfig: firebaseConfig,
  });
});

// Profile: edit
app.get("/profile/edit", (req, res) => {
  res.render("edit-profile", {
    active: "profile",
    firebaseConfig: firebaseConfig,
  });
});

// Recipes: edit
app.get("/editRecipe", (req, res) => {
  res.render("editRecipe", {
    firebaseConfig: firebaseConfig,
  });
});

// Error for page not found
app.use(function (req, res, next) {
  res
    .status(404)
    .send(
      "<html><head><title>Page not found!</title></head><body><p>Nothing here.</p></body></html>"
    );
});

// Run server; default port 8000
const port = process.env.PORT || 8000;
app.listen(port, function () {
  console.log("Listening on port " + port + "!");
});
