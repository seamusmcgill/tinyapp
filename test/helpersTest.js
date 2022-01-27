const { assert } = require('chai');

const { getUserByEmail, generateRandomString } = require('../helpers.js');

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

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
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