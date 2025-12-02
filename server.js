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

// Serve files and assets
app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/assets", express.static("./public/assets"));

// views for EJS
app.set("views", "./views");
app.set("view engine", "ejs");

// PAGE ROUTES
// Landing Page
app.get("/", (req, res) => {
  res.render("landing", {
    firebaseConfig: firebaseConfig,
  });
});

// Login page
app.get("/login", (req, res) => {
  res.render("login", { firebaseConfig: firebaseConfig });
});

// Signup page
app.get("/signup", (req, res) => {
  res.render("signup", { firebaseConfig: firebaseConfig });
});

// Home Page
app.get("/home", (req, res) => {
  // This renders views/index.ejs
  res.render("index", {
    active: "home",
    firebaseConfig: firebaseConfig,
  });
});

app.get("/main", (req, res) => {
  res.render("main", { active: "home", firebaseConfig: firebaseConfig });
});

// Community Pages
app.get("/communities", (req, res) => {
  res.render("communities", {
    active: "community",
    firebaseConfig: firebaseConfig,
  });
});

// create a community
app.get("/communities/create", (req, res) => {
  res.render("create-community", {
    active: "community",
    firebaseConfig: firebaseConfig,
  });
});

// view a community
app.get("/communities/:id", (req, res) => {
  res.render("community", {
    active: "community",
    firebaseConfig: firebaseConfig,
  });
});

// Create recipe page
app.get("/create", (req, res) => {
  res.render("create", { active: "create", firebaseConfig: firebaseConfig });
});

// Favourites page
app.get("/recipe", (req, res) => {
  res.render("recipe", {
    active: "recipe",
    firebaseConfig: firebaseConfig,
  });
});

// Profile Page (current user)
app.get("/profile", (req, res) => {
  res.render("profile", {
    active: "profile",
    firebaseConfig: firebaseConfig,
  });
});

// Full recipe page
app.get("/recipeDetails", (req, res) => {
  res.render("recipeDetails", {
    firebaseConfig: firebaseConfig,
  });
});

// Edit Profile Information Page
app.get("/profile/edit", (req, res) => {
  res.render("edit-profile", {
    active: "profile",
    firebaseConfig: firebaseConfig,
  });
});

//Edit recipe page
app.get("/editRecipe", (req, res) => {
  res.render("editRecipe", {
    firebaseConfig: firebaseConfig,
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
