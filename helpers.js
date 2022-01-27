// Helper function to find an email in the users object
const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (email === database[user].email) {
      return user;
    }
  }
  return undefined;
};

module.exports = { getUserByEmail };