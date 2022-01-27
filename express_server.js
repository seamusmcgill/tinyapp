const express = require("express");
const { redirect } = require("express/lib/response");
const app = express();
const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: "session",
  keys: ["8169d4b6-3344-4722-88fb-6665251da559", "d255d683-bc02-44ff-b7bd-af7728b7f437"],
  secret: "wLeHbL"
}));
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const bcrypt = require("bcryptjs");

const { getUserByEmail, generateRandomString, getUserURLs, addNewUser } = require("./helpers");

// Helper function to authenticate the user trying to log in
const authenticateUser = (email, password, database) => {

  const user = getUserByEmail(email, database);

  // Check if the entered password matches the password in the database
  if (user && bcrypt.compareSync(password, database[user].password)) {
    return user;
  }

  return false;
};

// Initialize URL database and users object
const urlDatabase = {};
const users = {};

// Redirect from / to login/URLs page depending on if user logged in
app.get("/", (req, res) => {
  const user = users[req.session["user_id"]];

  if (!user) {
    return res.redirect("/login");
  }

  res.redirect("/urls");
});

// Render the front page and the form to shorten new URLs
app.get("/urls", (req, res) => {
  // Check if a cookie exists or if the one that does matches a user in the database
  if (!users[req.session["user_id"]]) {
    return res.status(403).send("403 FORBIDDEN - Log in to view shortened URLs.");
  }
  let userID = req.session["user_id"];
  const templateVars = { urls: getUserURLs(userID, urlDatabase), user: users[userID] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session["user_id"]] };
  if (!templateVars.user) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

// On form submission
app.post("/urls", (req, res) => {
  if (!users[req.session["user_id"]]) {
    return res.status(403).send("403 FORBIDDEN - Only logged in users can create a shortened URL.");
  }
  // Create a random short URL and add it to the URL database then redirect to its shortURL page
  let shortURL = generateRandomString();
  // Correct the input if user doesn't enter http://
  let longURL = req.body.longURL;
  if (!longURL.includes("://")) {
    longURL = `http://${longURL}`;
  }
  urlDatabase[shortURL] = {
    longURL,
    userID: req.session["user_id"],
  };
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

// Render the page for the individual shortened URL with its longURL counterpart
app.get("/urls/:shortURL", (req, res) => {
  // Don't allow anonymous users to access the shortURL page or users to access short URLs that aren't theirs
  if (!users[req.session["user_id"]]) {
    return res.status(403).send("403 FORBIDDEN - Must be logged in to access short URL page.");
  }
  let userURLs = getUserURLs(req.session["user_id"], urlDatabase);
  if (!Object.keys(userURLs).includes(req.params.shortURL)) {
    return res.status(403).send("403 FORBIDDEN - You can only edit short URLs that you have made.");
  }
  const templateVars = { shortURL: req.params.shortURL, longURL : urlDatabase[req.params.shortURL].longURL, user: users[req.session["user_id"]] };
  res.render("urls_show", templateVars);
});

// Send longURL edit information
app.post("/urls/:shortURL", (req, res) => {
  // Don't allow anonymous users to edit shortURLs or users to edit short URLs that aren't theirs
  if (!users[req.session["user_id"]]) {
    return res.status(403).send("403 FORBIDDEN - Must be logged in to edit short URLs.");
  }
  let userURLs = getUserURLs(req.session["user_id"], urlDatabase);
  if (!Object.keys(userURLs).includes(req.params.shortURL)) {
    return res.status(403).send("403 FORBIDDEN - You can only edit short URLs that you have made.");
  }
  // Correct the input if user doesn't enter http://
  let newLongURL = req.body.updatedLongURL;
  if (!newLongURL.includes("://")) {
    newLongURL = `http://${newLongURL}`;
  }
  // Update the database with new lnog URL and redirect to URLs page
  urlDatabase[req.params.shortURL].longURL = newLongURL;
  res.redirect("/urls");
});

// Delete shortened URL from homepage
app.post("/urls/:shortURL/delete", (req, res) => {
  // Don't allow anonymous users to edit shortURLs or users to edit short URLs that aren't theirs
  if (!users[req.session["user_id"]]) {
    return res.status(403).send("403 FORBIDDEN - Must be logged in to delete short URLs.");
  }
  let userURLs = getUserURLs(req.session["user_id"], urlDatabase);
  if (!Object.keys(userURLs).includes(req.params.shortURL)) {
    return res.status(403).send("403 FORBIDDEN - You can only delete short URLs that you have made.");
  }
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Redirect the shortURL to the page the longURL refers to
app.get("/u/:shortURL", (req, res) => {
  // Send error if invalid shortURL
  if (!urlDatabase[req.params.shortURL]) {
    return res.status(404).send("404 NOT FOUND - Invalid short URL");
  }
  const templateVars = { shortURL: req.params.shortURL, longURL : urlDatabase[req.params.shortURL].longURL};
  res.redirect(templateVars.longURL);
});

// Render the registration page
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session["user_id"]] };
  res.render("register_user", templateVars);
});

// Add a user to the database, create cookie for their ID, redirect to homepage
app.post("/register", (req, res) => {

  const email = req.body.email;
  const password = req.body.password;

  // If no email or password were entered or email has already been registered send a 400 error
  if (!email || !password) {
    return res.status(400).send("400 BAD REQUEST - Enter email and password.");
  }

  // Check if the user is in the database before adding them
  const user = getUserByEmail(email, users);

  if (!user) {
    // Add new user to database and create their session cookie
    const userID = addNewUser(email, password, users);
  
    req.session["user_id"] = userID;
    res.redirect("/urls");
  }
  // Return error if in database
  return res.status(400).send("400 BAD REQUEST - Email already in user database.");

});

// Render login page
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session["user_id"]] };
  res.render("login", templateVars);
});

// Check login information, update cookie and redirect to urls homepage
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // If no email or password were entered send a 400 error
  if (!email || !password) {
    return res.status(400).send("400 BAD REQUEST - Enter email and password");
  }

  // Check if the user has entered valid credentials
  const user = authenticateUser(email, password, users);

  if (user) {
    // Set cookie to user ID that matches email and password and redirect to URLs
    req.session["user_id"] = users[user].id;
    res.redirect("/urls");
  }

  // Return an error if any information is invalid
  return res.status(401).send("401 UNAUTHORIZED - Invalid login credentials.");

});

app.post("/logout", (req, res) => {
  req.session["user_id"] = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});