const bcrypt = require("bcryptjs");

// Helper function to find an email in the users object
const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (email === database[user].email) {
      return user;
    }
  }
  return undefined;
};

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

// Return an object containing the URLs from the database that belong to the user
const getUserURLs = (id, database) => {
  let userURLs = {};
  for (const url in database) {
    if (id === database[url].userID) {
      userURLs[url] = database[url];
    }
  }
  return userURLs;
};

// Helper function for adding new user
const addNewUser = (email, password, database) => {
  // Generate a random ID and use it as the user key in the database
  let userID = generateRandomString();

  // Add the user object into the database and return the ID
  database[userID] = {
    id: userID,
    email,
    password: bcrypt.hashSync(password, 10),
  };

  return userID;
};

// Helper function to authenticate the user trying to log in
const authenticateUser = (email, password, database) => {

  const user = getUserByEmail(email, database);

  // Check if the entered password matches the password in the database
  if (user && bcrypt.compareSync(password, database[user].password)) {
    return user;
  }

  return false;
};


module.exports = { getUserByEmail, generateRandomString, getUserURLs, addNewUser, authenticateUser };