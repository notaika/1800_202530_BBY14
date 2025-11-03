// Load .env variables
require("dotenv").config();

// REQUIRES
const express = require("express");
// sessions for login and auth
const session = require("express-session");
const app = express();
app.use(express.json());
// to support URL-encoded bodies - for the login form to send data back
app.use(express.urlencoded({ extended: true }));

// import helpers from server-helpers.js
const {
  loadRecipes,
  loadProfileFeed,
  shuffle,
} = require("./server-helpers.js");

// import helpers from auth-helpers.js
const { findUserByEmail, loadUsers, saveUsers } = require("./auth-helpers.js");


// Sessions (cookie-based) - so that we can keep users logged in and store their info

app.use(session({
  secret: process.env.SESSION_SECRET || "dev-secret-potluck",
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 1000 * 60 * 60, // 1 hour
  }
}));

// Serve files and assets
app.use("/js", express.static("./public/js"));
app.use("/css", express.static("./public/css"));
app.use("/assets", express.static("./public/assets"));
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// auth middleware - to protect routes that need login by checking for req.session.user which we set at login
function requireAuth(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

// views for EJS
app.set("views", "./views");
app.set("view engine", "ejs");

// login route - just checks if user exists in our "DB" (JSON file) and password matches
app.get("/login", (req, res) => {
  // If already logged in, go home
  if (req.session.user) return res.redirect("/");
  res.render("login", { active: null, error: null });
});

// handles login form submission - checks user and password, sets session
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  const user = findUserByEmail(email || "");
  // Check user exists and password matches
  if (!user || user.password !== password) {
    // Simple error message for now
    return res.status(401).render("login", { active: null, error: "Invalid email or password." });
  }

  // Store user info in session and redirect to home
  req.session.user = { id: user.id, email: user.email, displayName: user.displayName };
  res.redirect("/");
});

// logout route - destroys express session and redirects to login
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

// super simple register flow - pls change when setting up firebase!
app.get("/signup", (req, res) => {
  res.render("signup", { active: null, error: null });
});

// handles signup form submission - adds user to our "DB" (JSON file)
app.post("/signup", (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password || !displayName) {
    return res.status(400).render("signup", { active: null, error: "All fields required." });
  }
  const users = loadUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).render("signup", { active: null, error: "Email is already registered." });
  }
  const newUser = {
    id: "u" + (users.length + 1),
    email,
    displayName,
    password
  };
  users.push(newUser);
  saveUsers(users);
  res.redirect("/login");
});

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
  console.log("running at http://localhost:" + port);
});
