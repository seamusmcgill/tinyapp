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

module.exports = { getUserByEmail, generateRandomString, getUserURLs };