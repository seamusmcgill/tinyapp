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

const methodOverride = require("method-override");
app.use(methodOverride("_method"));

const { getUserByEmail, generateRandomString, getUserURLs, addNewUser, authenticateUser } = require("./helpers");

// Initialize URL database, users object and visit log
const urlDatabase = {};
const users = {};
const visitLog = {};

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
  const user = users[req.session["user_id"]];
  // Only allow logged in users to access the URLs page
  if (!user) {
    return res.status(403).send("403 FORBIDDEN - Log in to view shortened URLs.");
  }

  const urls = getUserURLs(user.id, urlDatabase);
  const templateVars = { urls, user };
  res.render("urls_index", templateVars);
});

// Render the page to create a new short URL
app.get("/urls/new", (req, res) => {
  const user = users[req.session["user_id"]];
  // Redirect anonymous users to the login page
  if (!user) {
    res.redirect("/login");
  }

  const templateVars = { user};
  res.render("urls_new", templateVars);
});

// On form submission
app.post("/urls", (req, res) => {
  const user = users[req.session["user_id"]];
  // Prevent anonymous users from sending post requests for new URLs
  if (!user) {
    return res.status(403).send("403 FORBIDDEN - Only logged in users can create a shortened URL.");
  }
  
  // Correct the input if user doesn't enter http://
  let longURL = req.body.longURL;
  if (!longURL.includes("://")) {
    longURL = `http://${longURL}`;
  }

  // Add a randomized short URL to the URL database then redirect to its shortURL page
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL,
    userID: user.id,
  };

  // Initialize empty array for visit log to track who uses the shortURL
  visitLog[shortURL] = [];

  res.redirect(`/urls/${shortURL}`);
});

// Render the page for the individual shortened URL with its longURL counterpart
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.session["user_id"]];
  // Don't allow anonymous users to access the shortURL page or users to access short URLs that aren't theirs
  if (!user) {
    return res.status(403).send("403 FORBIDDEN - Must be logged in to access short URL page.");
  }

  const userURLs = getUserURLs(user.id, urlDatabase);
  const shortURL = req.params.shortURL;

  // Check if short URL exists
  if (!urlDatabase[shortURL]) {
    return res.status(400).send("400 BAD REQUEST - Short URL does not exist.");
  }

  // Ensure the logged in user has access to the shortURL
  if (!Object.keys(userURLs).includes(shortURL)) {
    return res.status(403).send("403 FORBIDDEN - You can only edit short URLs that you have made.");
  }

  const views = req.session[`${shortURL}views`];
  const visitors = req.session[`${shortURL}visitors`];
  const visits = visitLog[shortURL];

  const templateVars = { shortURL, longURL : urlDatabase[shortURL].longURL, user, views, visitors, visits };
  res.render("urls_show", templateVars);
});

// Update the long URL for an associated short URL
app.put("/urls/:shortURL", (req, res) => {
  const user = users[req.session["user_id"]];
  // Don't allow anonymous users to edit shortURLs
  if (!user) {
    return res.status(403).send("403 FORBIDDEN - Must be logged in to edit short URLs.");
  }

  const userURLs = getUserURLs(user.id, urlDatabase);
  const shortURL = req.params.shortURL;

  // Ensure the logged in user has access to the shortURL
  if (!Object.keys(userURLs).includes(shortURL)) {
    return res.status(403).send("403 FORBIDDEN - You can only edit short URLs that you have made.");
  }

  // Correct the input if user doesn't enter http://
  let newLongURL = req.body.updatedLongURL;
  if (!newLongURL.includes("://")) {
    newLongURL = `http://${newLongURL}`;
  }

  // Update the database with new lnog URL and redirect to URLs page
  urlDatabase[shortURL].longURL = newLongURL;

  res.redirect("/urls");
});

// Delete shortened URL from homepage
app.delete("/urls/:shortURL", (req, res) => {
  const user = users[req.session["user_id"]];

  // Don't allow anonymous users to delete shortURLs
  if (!user) {
    return res.status(403).send("403 FORBIDDEN - Must be logged in to delete short URLs.");
  }

  const userURLs = getUserURLs(user.id, urlDatabase);
  const shortURL = req.params.shortURL;

  // Ensure the logged in user has access to the shortURL
  if (!Object.keys(userURLs).includes(shortURL)) {
    return res.status(403).send("403 FORBIDDEN - You can only delete short URLs that you have made.");
  }

  // Delete the URL from database and redirect to the URLs page
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Redirect the shortURL to the page the longURL refers to
app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;

  // Send error if invalid shortURL
  if (!urlDatabase[shortURL]) {
    return res.status(404).send("404 NOT FOUND - Invalid short URL");
  }

  // Create a variable for the visit time and store it in a string
  let visitTime = new Date();
  visitTime = `${visitTime.getFullYear()}-${(visitTime.getMonth()) + 1}-${visitTime.getDay()} ${visitTime.getHours()}:${visitTime.getMinutes()}:${visitTime.getSeconds()}`;
  
  // Check if a visitor ID has been created - if not generate a random string
  if (!req.session["visitor_id"]) {
    req.session["visitor_id"] = generateRandomString();
  }

  let visitorID = req.session["visitor_id"];
  
  // Add the visit to the log
  visitLog[shortURL].push(`Visitor ${visitorID} visited the shortURL at ${visitTime}`);
  
  // Update the view count and unique visitors for the short URL
  if (req.session[`${shortURL}views`]) {
    req.session[`${shortURL}views`]++;
  } else {
    req.session[`${shortURL}views`] = 1;
    req.session[`${shortURL}visitors`] = (req.session[`${shortURL}visitors`] || 0) + 1;
  }

  // Redirect to the longURL page
  const longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

// Render the registration page
app.get("/register", (req, res) => {
  const user = users[req.session["user_id"]];

  // Redirect logged in user to URLs page
  if (user) {
    res.redirect("/urls");
  }

  const templateVars = { user };
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
    return res.redirect("/urls");
  }
  // Return error if in database
  res.status(400).send("400 BAD REQUEST - Email already in user database.");

});

// Render login page
app.get("/login", (req, res) => {
  const user = users[req.session["user_id"]];

  // Redirect logged in user to URLs page
  if (user) {
    res.redirect("/urls");
  }

  const templateVars = { user };
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
    req.session["user_id"] = user;
    return res.redirect("/urls");
  }

  // Return an error if any information is invalid
  res.status(401).send("401 UNAUTHORIZED - Invalid login credentials.");

});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/login");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});