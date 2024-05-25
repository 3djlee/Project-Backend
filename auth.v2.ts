import {
  ErrorObject,
  getData,
  setData,
  // QuizBrief,
  // Token,
  User,
} from './dataStore';

import validator from 'validator';
import { decodeUserId, tokenValid } from './other';
import HTTPError from 'http-errors';
import createHttpError from 'http-errors';

// const bcrypt = require('bcrypt');
// const saltRounds = 10;

/**
 * generate hash of plaintext password and save it to user
 * @param password
 * @return hash - string
 */
/*
export const encryptPassword = (password: string) => {
  let hashed: string;
  bcrypt.hash(password, saltRounds, function(err: string, hash: string) {
    if (err) {
      // comment here
    }
    console.log('HAS NOW');
    console.log(hash);
    hashed = hash;
  });

  return hashed;
};

// Return true / false if encrypt password exists as hash
export const checkPassword = (password: any, hash: any) => {
  return bcrypt.compareSync(password, hash);
};
*/

/// ////////////// v2 route //////////////////

/**
 * function to log out an existing registered user, based on a valid token
 *
 * @param {string} token
 * @returns { }
 */

export function adminAuthLogoutv2(authUserId: number) : Record<string, never> | Error {
  const theUser = findUser(authUserId);
  if (theUser === undefined) {
    throw HTTPError(401, 'AuthUserId is not a valid user');
  }
  // NOTE: EDIT THIS
  const store = getData();
  const tokenArray = store.tokens;
  const index = findUserIndex(authUserId);

  if (index < 0) {
    throw HTTPError(401, 'token is not found in datastore');
  }

  tokenArray.splice(index, 1);
  store.tokens = tokenArray;
  setData(store);
  return {};
}

/**
 * Update User Password by inputting oldPassword and newPassword. requires token
 *
 * @param {string} token
 * @param {string} oldPassword
 * @param {string} newPassword
 * @returns { Record<string, never> }
 */

export const adminUserPasswordUpdatev2 = (token: string, oldPassword: string, newPassword: string): Record<string, never> => {
  const userId = decodeUserId(token);
  if (userId === undefined) {
    throw createHttpError(401, 'Invalid Token');
  }

  const data = getData();
  const user = data.users.find((u) => u.userId === userId);
  const containsNumber = /\d/;
  const containsLetter = /[a-zA-Z]/;
  if (!containsLetter.test(newPassword) || !containsNumber.test(newPassword)) {
    throw createHttpError(400, 'your password must contain at least one number and one letter');
  } else if (user.password !== oldPassword) {
    throw createHttpError(400, 'Old password is not the correct old password');
  } else if (user.password === newPassword) {
    throw createHttpError(400, 'Old Password and New Password match exactly');
  } else if (user.passwords.indexOf(newPassword) !== -1) {
    throw createHttpError(400, 'New Password has already been used before by this user');
  } else if (newPassword.length < 8) {
    throw createHttpError(400, 'New Password is < 8 length');
  }

  user.passwords.push(oldPassword);
  user.password = newPassword;

  setData(data);
  return {};
};

/**
 * function to log out an existing registered user, based on a valid token
 *
 * @param {string} token
 * @returns { }
 */

export function adminAuthLogout(token: string) : Record<string, never> | Error {
  if (!tokenValid(token)) {
    throw HTTPError(401, 'token is empty or invalid');
  }
  // NOTE: EDIT THIS
  const store = getData();
  const tokenArray = store.tokens;
  const index = tokenArray.findIndex((storedToken: string) => storedToken === token);

  if (index < 0) {
    throw HTTPError(401, 'token is not found in datastore');
  }

  tokenArray.splice(index, 1);
  store.tokens = tokenArray;
  setData(store);
  return {};
}

/**
 * Returns the user information, based on given userID, route v2
 */
export function adminUserDetailsv2(authUserId: number): {
user?: {userId: number, name: string, email: string,
    numSuccessfulLogins: number, numFailedPasswordsSinceLastLogin: number,},
} {
  const theUser = getData().users.find((u) => u.userId === authUserId);
  if (theUser === undefined) {
    throw HTTPError(401, 'AuthUserId is not a valid user');
  }

  return {
    user: {
      userId: theUser.userId,
      name: theUser.nameFirst + ' ' + theUser.nameLast,
      email: theUser.email,
      numSuccessfulLogins: theUser.numSuccessfulLogins,
      numFailedPasswordsSinceLastLogin:
        theUser.numFailedPasswordsSinceLastLogin,
    },
  };
}

/**
 * Update the details of a logged in admin user, route v2
 */
export function adminUserDetailsUpdatev2(authUserId: number, userEmail: string,
  userNameFirst: string, userNameLast: string): Record<string, never> | ErrorObject {
  const data = getData();
  const theUser = findUser(authUserId);
  let theIndex;
  if (theUser !== undefined) {
    theIndex = findUserIndex(authUserId);
  }

  const isEmailNew = data.users.find((theUser: User) => theUser.email === userEmail);
  if (isEmailNew !== undefined) {
    throw HTTPError(400, 'Email is currently used by another user');
  } else if (validator.isEmail(userEmail) !== true) {
    throw HTTPError(400, 'Email is invalid');
  } else if (isNameValid(userNameFirst) === 1) {
    throw HTTPError(400, 'First name contains invalid characters');
  } else if (isNameValid(userNameFirst) === 2) {
    throw HTTPError(400, 'First name needs to be within a range of 2 to 20');
  } else if (isNameValid(userNameLast) === 1) {
    throw HTTPError(400, 'Last name contains invalid characters');
  } else if (isNameValid(userNameLast) === 2) {
    throw HTTPError(400, 'Last name needs to be within a range of 2 to 20');
  } else if (theUser === undefined) {
    throw HTTPError(401, 'AuthUserId is not a valid user');
  }

  data.users[theIndex].email = userEmail;
  data.users[theIndex].nameFirst = userNameFirst;
  data.users[theIndex].nameLast = userNameLast;
  setData(data);
  return {};
}

/**
 * Check if name is valid. Returns 0 if all is good.
 * If it constains invalid characters, return 1
 * If the lenght is not correct, returns 2.
 */
function isNameValid (name: string): number {
  const allowedCharacters = /^[a-zA-Z\s\-']+$/;

  if (!allowedCharacters.test(name)) {
    return 1;
  }
  if (name.length < 2 || name.length > 20) {
    return 2;
  }

  return 0;
}

/**
 * Returns the user object, given a user Id, or undefined if it doesn't exist
 */
function findUser(authUserId: number): User {
  const data = getData();
  const theUser =
    data.users.find((theUserId: User) => theUserId.userId === authUserId);
  return theUser;
}

/**
 * Returns the user index in dataStore.users
 */
function findUserIndex(authUserId: number): number {
  const data = getData();
  const theIndex =
    data.users.findIndex((theUserId: User) => theUserId.userId === authUserId);
  return theIndex;
}
