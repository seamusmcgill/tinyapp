const { assert } = require('chai');

const { getUserByEmail, generateRandomString, getUserURLs, addNewUser, authenticateUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

const testURLs = {
  "Fsyqvq" : {
    longURL: "http://www.theringer.com",
    userID: "userRandomID",
  },
  "0HNTDg" : {
    longURL: "http://www.facebook.com",
    userID: "userRandomID",
  },
  "2Hn45s" : {
    longURL: "http://www.twitter.com",
    userID: "user3RandomID",
  },
};

describe("getUserByEmail", () => {
  it("should return a user with valid email", function() {
    const user = getUserByEmail("user@example.com", testUsers);
    const expectedUserID = "userRandomID";
    // Write your assert statement here
    assert.equal(user, expectedUserID);
  });

  it("should return undefined for an invalid email", () => {
    const user = getUserByEmail("hello@world.com", testUsers);
    assert.equal(user, undefined);
  });
});

describe("generateRandomString", () => {
  it('should return a different random value every time', function() {
    const randomString1 = generateRandomString();
    const randomString2 = generateRandomString();
    assert.notEqual(randomString1, randomString2);
  });

  it("should return a string of six characters", () => {
    const randomString = generateRandomString();
    assert.equal(randomString.length, 6);
  });
});

describe("getUserURLs", () => {
  it('should return only the URLs that the user owns', () => {
    const userURLs = getUserURLs("userRandomID", testURLs);
    const expectedURLs = ["Fsyqvq", "0HNTDg"];
    assert.deepEqual(Object.keys(userURLs), expectedURLs);
  });

  it("should return an empty object if the user owns no URLs", () => {
    const userURLs = getUserURLs("user2RandomID", testURLs);
    assert.deepEqual(userURLs, {});
  });
});

describe("addNewUser", () => {
  it("should add a user to the database", () => {
    const newUser = addNewUser("guy@bro.com", "suhdude", testUsers);
    const newUserFound = testUsers[newUser] ? true : false;
    assert.equal(newUserFound, true);
  });

  it("should return a six character ID", () => {
    const newUser = addNewUser("guy@bro.com", "suhdude", testUsers);
    const newUserID = testUsers[newUser].id;
    assert.equal(newUserID.length, 6);
  });

  it("should not store the user's password as plaintext", () => {
    const newUser = addNewUser("guy@bro.com", "suhdude", testUsers);
    const storedPassword = testUsers[newUser].password;
    assert.notEqual("suhdude", storedPassword);
  });
});

describe("authenticateUser", () => {
  it("should return the correct six character user ID on successful login", () => {
    const newUser = getUserByEmail("guy@bro.com", testUsers);
    const userLoginID = authenticateUser("guy@bro.com", "suhdude", testUsers);
    assert.equal(newUser, userLoginID);
  });

  it("should return false if an invalid email is entered", () => {
    const userLoginAttempt = authenticateUser("guy@dude.com", "suhdude", testUsers);
    assert.equal(userLoginAttempt, false);
  });

  it("should return false if an invalid password is entered", () => {
    const userLoginAttempt = authenticateUser("guy@dude.com", "suhman", testUsers);
    assert.equal(userLoginAttempt, false);
  });
});