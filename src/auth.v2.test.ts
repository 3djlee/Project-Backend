import request from 'sync-request-curl';
// import express, { json, Request, Response } from 'express';
import { port, url } from './config.json';
import HTTPError from 'http-errors';

import {
  userRegister,
  requestUserRegister,
  requestUserLogin,
  requestUserLogoutv2,
  requestUserDetailsv2,
  requestUserDetailsUpdatev2,
  requestUserPasswordv2,
  // requestUserLogout
} from './testInterfaces';
import { IncomingHttpHeaders } from 'http';
// import { ErrorObject } from './dataStore';

const SERVER_URL = `${url}:${port}`;

beforeEach(() => {
  request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: 200 });
});

afterAll(() => {
  request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: 200 });
});

// HELPER FUNCTIONS XXXXXXXXXXXXXXXXXXXXXXXXXX

// v2 tests //////////////////////////////////

describe('Logout functionv2', () => {
  let theToken: { token :string};
  let theToken2: { token: string };

  beforeEach(() => {
    const user1 = request('POST', `${SERVER_URL}/v1/admin/auth/register`,
      {
        json: {
          email: userRegister[0].email,
          password: userRegister[0].password,
          nameFirst: userRegister[0].nameLast,
          nameLast: userRegister[0].nameFirst
        }
      });
    theToken = JSON.parse(user1.body.toString());

    const user2 = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: userRegister[1].email,
        password: userRegister[1].password,
        nameFirst: userRegister[1].nameLast,
        nameLast: userRegister[1].nameFirst
      }
    });
    theToken2 = JSON.parse(user2.body.toString());
  });

  test("error: ('invalid $authUserId')", () => {
    expect(() => requestUserLogoutv2({})).toThrow(HTTPError[401]);
  });

  test("valid ID: ('valid $authUserId')", () => {
    expect(requestUserLogoutv2(theToken)).toStrictEqual({});
    // expect(requestUserDetailsv2(token1).statusCode).toBe(200);
    expect(requestUserLogoutv2(theToken2)).toStrictEqual({});
  });
});

describe('Password functionv2', () => {
  let theToken: { token :string};
  let theToken2: { token: string };

  beforeEach(() => {
    theToken = requestUserRegister(userRegister[0]).body;
    theToken2 = requestUserRegister(userRegister[1]).body;
  });

  test("error: ('invalid $authUserId')", () => {
    expect(() => requestUserPasswordv2({}, userRegister[0].password, 'xxx87skdjfh')).toThrow(HTTPError[401]);
  });

  test("error: ('incorrect oldPassword')", () => {
    expect(() => requestUserPasswordv2(theToken, 'xxxkjasbdfkqjb', 'xxx87skdjfh')).toThrow(HTTPError[400]);
    expect(() => requestUserPasswordv2(theToken2, 'xxxkjasbdfkqjb', 'xxx87skdjfh')).toThrow(HTTPError[400]);
  });

  test("error: ('same old and new Passwords')", () => {
    expect(() => requestUserPasswordv2(theToken, userRegister[0].password, userRegister[0].password)).toThrow(HTTPError[400]);
    expect(() => requestUserPasswordv2(theToken2, userRegister[1].password, userRegister[1].password)).toThrow(HTTPError[400]);
  });

  test("error: ('new Password < 8 characters')", () => {
    expect(() => requestUserPasswordv2(theToken, userRegister[0].password, '12c3456')).toThrow(HTTPError[400]);
    expect(() => requestUserPasswordv2(theToken2, userRegister[1].password, '1z')).toThrow(HTTPError[400]);
  });

  test("error: ('doesn't contain at least 1 number and 1 letter')", () => {
    expect(() => requestUserPasswordv2(theToken, userRegister[0].password, 'thisispassword')).toThrow(HTTPError[400]);
    expect(() => requestUserPasswordv2(theToken2, userRegister[1].password, '12345568923354')).toThrow(HTTPError[400]);
  });

  test("valid ID: ('valid $authUserId')", () => {
    expect(requestUserPasswordv2(theToken, userRegister[0].password, 'xxx87skdjfh')).toStrictEqual({});
    // expect(requestUserDetailsv2(token1).statusCode).toBe(200);
    expect(requestUserPasswordv2(theToken2, userRegister[1].password, 'xxx87skdjfh')).toStrictEqual({});
  });
});

describe('adminUserDetailsv2', () => {
  let token1: IncomingHttpHeaders;

  beforeEach(() => {
    token1 = requestUserRegister({
      email: 'user1@email.com',
      password: 'password1',
      nameFirst: 'NameOne',
      nameLast: 'nameTwo'
    }).body;
  });

  test("error: ('invalid $authUserId')", () => {
    expect(() => requestUserDetailsv2({})).toThrow(HTTPError[401]);
  });

  test.only("valid ID: ('valid $authUserId')", () => {
    // expect(requestUserDetailsv2(token1).statusCode).toBe(200);
    expect(requestUserDetailsv2(token1)).toStrictEqual({
      user:
        {
          userId: expect.any(Number),
          name: 'NameOne nameTwo',
          email: 'user1@email.com',
          numSuccessfulLogins: 1,
          numFailedPasswordsSinceLastLogin: 0,
        }
    });
  });
  test('2 Successful Logins', () => {
    requestUserLogin({ email: 'user1@email.com', password: 'password1' });
    expect(requestUserDetailsv2(token1)).toStrictEqual({
      user:
        {
          userId: expect.any(Number),
          name: 'NameOne nameTwo',
          email: 'user1@email.com',
          numSuccessfulLogins: 2,
          numFailedPasswordsSinceLastLogin: 0,
        }
    });
  });
  test('1 UnSuccessful Login', () => {
    requestUserLogin({ email: 'user1@email.com', password: 'password' });
    // expect(requestUserDetailsv2(token1).statusCode).toBe(200);
    expect(requestUserDetailsv2(token1)).toStrictEqual({
      user:
        {
          userId: expect.any(Number),
          name: 'NameOne nameTwo',
          email: 'user1@email.com',
          numSuccessfulLogins: 1,
          numFailedPasswordsSinceLastLogin: 1,
        }
    });
  });
});

describe('adminUserDetailsUpdatev2', () => {
  let token1: { token: string };

  beforeEach(() => {
    request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: 200 });
    token1 = requestUserRegister(userRegister[0]).body;
  });

  test("error: ('invalid $authUserId')", () => {
    expect(() => requestUserDetailsUpdatev2({ token: '' }, 'harry@hotmail.com', 'Harry', 'Potter')).toThrow(HTTPError[401]);
    expect(() => requestUserDetailsUpdatev2({ token: '1111' }, 'harry@hotmail.com', 'Harry', 'Potter')).toThrow(HTTPError[401]);
  });

  test('invalid email', () => {
    expect(() => requestUserDetailsUpdatev2(token1, 'harry@hotmail', 'Harry', 'Potter')).toThrow(HTTPError[400]);
    expect(() => requestUserDetailsUpdatev2(token1, 'harry.hotmail.com', 'Harry', 'Potter')).toThrow(HTTPError[400]);
  });

  test('email already exists', () => {
    const token2 = requestUserRegister(userRegister[1]).body;
    expect(() => requestUserDetailsUpdatev2(token2, userRegister[0].email, 'Harry', 'Potter')).toThrow(HTTPError[400]);
  });

  test.each([
    { nameFirst: 'H@rry', nameLast: 'Potter' },
    { nameFirst: 'Harry', nameLast: 'Po!ter' },
    { nameFirst: 'H', nameLast: 'Potter' },
    { nameFirst: 'Harry', nameLast: 'P' },
    { nameFirst: 'Haaaaaaaaaarrrrrryyyy', nameLast: 'Potter' },
    { nameFirst: 'H@rry', nameLast: 'Pooootttttttteeeeerrr' },
  ])('ERROR: nameFirst: %p or nameLast: %p is < 2 or > 20 || is invalid', ({ nameFirst, nameLast }) => {
    expect(() => requestUserDetailsUpdatev2(token1, 'harry@hotmail.com', nameFirst, nameLast)).toThrow(HTTPError[400]);
  });

  test('SUCCESS', () => {
    expect(requestUserDetailsUpdatev2(token1, 'har@hotmail.com', 'Ha', 'Po')).toStrictEqual({});
    expect(requestUserDetailsv2(token1)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'Ha Po',
        email: 'har@hotmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      }
    });
  });
});
