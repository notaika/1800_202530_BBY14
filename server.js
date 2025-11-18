// Load .env variables
require("dotenv").config();

// REQUIRES
const express = require("express");
const app = express();
app.use(express.json());

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

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
// Login page
app.get("/login", (req, res) => {
  res.render("login", { firebaseConfig: firebaseConfig });
});

// Signup page
app.get("/signup", (req, res) => {
  res.render("signup", { firebaseConfig: firebaseConfig });
});

// Home Page
app.get("/", (req, res) => {
  // This renders views/index.ejs
  res.render("index", {
    active: "home",
    firebaseConfig: firebaseConfig,
  });
});

app.get("/main", (req, res) => {
  res.render("main", { active: "home", firebaseConfig: firebaseConfig });
});

// Browse Page
app.get("/browse", (req, res) => {
  res.render("browse", {
    active: "browse",
    firebaseConfig: firebaseConfig,
  });
});

// Create recipe page
app.get("/create", (req, res) => {
  res.render("create", { active: "create", firebaseConfig: firebaseConfig });
});

// Saved recipes page
app.get("/recipe", (req, res) => {
  res.render("recipe", {
    active: "recipe",
    firebaseConfig: firebaseConfig,
  });
});

// Profile page
app.get("/profile", (req, res) => {
  let profilePosts = loadProfileFeed();
  res.render("profile", {
    posts: profilePosts,
    active: "profile",
    firebaseConfig: firebaseConfig,
  });
});

// Full recipe page
app.get("/recipeDetails", (req, res) => {
  res.render("recipeDetails", {
    firebaseConfig: firebaseConfig
  })
})

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
