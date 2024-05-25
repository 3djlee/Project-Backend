import { port, url } from './config.json';
import request from 'sync-request-curl';
import {
  userRegister,
  quizCreate,
  requestQuizCreate,
  requestUserRegister,
  requestQuizList
} from './testInterfaces';
import { tokenizing, encoding, decoding } from './other';
const SERVER_URL = `${url}:${port}`;
beforeEach(() => {
  request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: 200 });
});

afterAll(() => {
  request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: 200 });
});

describe('clear', () => {
  let userToken: string;

  beforeAll(() => {
    // Create some users and quizzes before clearing
    userRegister.forEach(user => {
      const registeredUser = requestUserRegister(user).body;
      if (!userToken) {
        userToken = registeredUser.token;
      }
    });

    quizCreate.forEach(quiz => {
      requestQuizCreate(quiz);
    });
  });

  test('Clear all details (users, quizzes)', () => {
    const response = request('DELETE', `${url}:${port}/v1/clear`);
    expect(response.statusCode).toBe(200);

    // Test the behavior after clearing
    const quizListResponse = requestQuizList(userToken);
    expect(quizListResponse.statusCode).not.toBe(200);
    expect(quizListResponse.body).toMatchObject({});

    const userDetailsResponse = requestQuizList(userToken);
    expect(userDetailsResponse.statusCode).not.toBe(200);
    expect(userDetailsResponse.body).toMatchObject({});
  });
});

describe('tokenizing, encoding, decoding', () => {
  test('Tokenizing', () => {
    const userID = requestUserRegister(userRegister[0]).body;

    expect(tokenizing(userID.authUserId)).toStrictEqual({
      sessionId: expect.any(Number), userId: userID.authUserId,
    });
    const userID2 = requestUserRegister(userRegister[0]).body;
    expect(tokenizing(userID2.authUserId)).toStrictEqual({
      sessionId: expect.any(Number), userId: userID.authUserId,
    });
  });

  test('Encoding', () => {
    const userID = requestUserRegister(userRegister[0]).body;

    expect({ token: encoding(tokenizing(userID.authUserId)) }).toStrictEqual({
      token: expect.any(String)
    });

    const userID2 = requestUserRegister(userRegister[0]).body;

    expect({ token: encoding(tokenizing(userID2.authUserId)) }).toStrictEqual({
      token: expect.any(String)
    });
  });

  test('Decoding', () => {
    const userID = 12345678;
    const theToken = encoding(tokenizing(userID));
    expect({ token: theToken }).toStrictEqual({
      token: expect.any(String)
    });

    console.log(decoding(theToken));

    expect(decoding(theToken)).toStrictEqual({
      sessionId: expect.any(Number), userId: userID,
    });

    const userID2 = 123456789;
    const theToken2 = encoding(tokenizing(userID2));
    expect({ token: theToken2 }).toStrictEqual({
      token: expect.any(String)
    });
    expect(decoding(theToken2)).toStrictEqual({
      sessionId: expect.any(Number), userId: userID2,
    });
  });
});
