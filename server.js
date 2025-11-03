// Load .env variables
require("dotenv").config();

// REQUIRES
const express = require("express");
const app = express();
app.use(express.json());

// import helpers from server-helpers.js
const {
  loadRecipes,
  loadProfileFeed,
  shuffle,
} = require("./server-helpers.js");

// Serve files and assets
app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/assets", express.static("./public/assets"));

// views for EJS
app.set("views", "./views");
app.set("view engine", "ejs");

// PAGE ROUTES
// Home Page
app.get("/", (req, res) => {
  let recipes = shuffle(loadRecipes());
  // This renders views/index.ejs
  res.render("index", { recipes, active: "home" });
});

app.get("/main", (req, res) => {
  let recipes = shuffle(loadRecipes());
  // This renders views/index.ejs
  res.render("main");
});

// Browse Page
app.get("/browse", (req, res) => {
  let recipes = shuffle(loadRecipes());
  res.render("browse", { recipes, active: "browse" });
});

// Create recipe page
app.get("/create", (req, res) => {
  res.render("create", { active: "create" });
});

// Recipe page
app.get("/recipe", (req, res) => {
  let recipes = shuffle(loadRecipes());
  res.render("recipe", { recipes, active: "recipe" });
});

// Profile page
app.get("/profile", (req, res) => {
  let profilePosts = loadProfileFeed();
  res.render("profile", { posts: profilePosts, active: "profile" });
});

// Error for page not found (from your class example)
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
