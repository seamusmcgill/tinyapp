const express = require("express");
const { redirect } = require("express/lib/response");
const app = express();
const cookieParser = require('cookie-parser');
app.use(cookieParser());
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "",
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "",
  },
};

const users = {};

const generateRandomString = () => {
  // Create a string with all alphanumeric characters and an empty string
  const characters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomString = "";
  for (let i = 0; i < 6; i++) {
    // Generate a random number between 0 and the number of alphanumeric characters
    let randomNumber = Math.floor(Math.random() * characters.length);
    randomString += characters[randomNumber];
  }
  return randomString;
};

// Helper function to find an email in the users object
const findUserEmail = (email) => {
  for (const user in users) {
    if (email === users[user].email) {
      return user;
    }
  }
  return false;
};

// Redirect from / to URLs page
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// Render the front page and the form to shorten new URLs
app.get("/urls", (req, res) => {
  const templateVars = { urls: urlDatabase, user: users[req.cookies["user_id"]] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  if (!templateVars.user) {
    res.redirect("/login");
  }
  res.render("urls_new", templateVars);
});

// On form submission
app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    return res.status(403).send("Only logged in users can create a shortened URL.");
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
    userID: req.cookies["user_id"],
  };
  console.log(urlDatabase);
  res.redirect(`/urls/${shortURL}`);
});

// Render the page for the individual shortened URL with its longURL counterpart
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL : urlDatabase[req.params.shortURL].longURL, user: users[req.cookies["user_id"]] };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL", (req, res) => {
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
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

// Redirect the shortURL to the page the longURL refers to
app.get("/u/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL : urlDatabase[req.params.shortURL].longURL};
  res.redirect(templateVars.longURL);
});

// Render the registration page
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("register_user", templateVars);
});

// Add a user to the database, create cookie for their ID, redirect to homepage
app.post("/register", (req, res) => {
  // If no email or password were entered or email has already been registered send a 400 error
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Enter email and password");
  }
  if (findUserEmail(req.body.email)) {
    return res.status(400).send("Email already in user database");
  }
  let userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: req.body.password,
  };
  res.cookie("user_id", userID);
  res.redirect("/urls");
});

// Render login page
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render("login", templateVars);
});

// Check login information, update cookie and redirect to urls homepage
app.post("/login", (req, res) => {
  // If no email or password were entered or email has already been registered send a 400 error
  if (!req.body.email || !req.body.password) {
    return res.status(400).send("Enter email and password");
  }
  // Check if entered email and password are valid
  if (!findUserEmail(req.body.email)) {
    return res.status(403).send("Email not found in user database");
  }
  let userID = findUserEmail(req.body.email);
  if (req.body.password !== users[userID].password) {
    return res.status(403).send("Incorrect password");
  }
  // Set cookie to user ID that matches email and password and redirect to URLs
  res.cookie("user_id", userID);
  res.redirect("/urls");
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});