import request from 'sync-request-curl';
import { port, url } from './config.json';
import {
  sleepSync,
  Action,
  userRegister,
  Answer,
  // answerSet,
  corQuestionCreate,
  quizCreate,
  // quizQuestions,
  QuizReturn,
  // UserReturn,
  requestSessionCreate,
  requestSessionStatus,
  requestSessionUpdate,
  requestQuestionCreate,
  // requestQuestionMove,
  requestUserRegister,
  // requestUserLogin,
  // requestUserRegister,
  requestPlayerJoin,
  // requestQuizSessions,
  requestQuizCreatev2,
  requestQuizInfov2,
  requestQuizListv2,
  requestQuizQuestionCreatev2,
  requestQuizQuestionEditv2,
  requestQuestionMovev2,
  requestQuizQuestionDuplicatev2,
  requestQuizQuestionDeletev2,
  // requestQuizThumbnailUpdate,
  requestQuizRemovev2,
  requestQuizRestorev2,
  requestQuizEmptyTrashv2,
  requestQuizzesInTrashv2,
  requestPlayerSendChat,
  requestChat,
  requestPlayerStatus,
  requestPlayerQuestionInfo,
  requestSessionFinalResults,
  requestResultsForQuestion,
  requestPlayerSubmitAnswer,
  requestSessionActivity,
  quizQuestions,
} from './testInterfaces';
import { Quiz, Session } from './dataStore';
import HTTPError from 'http-errors';
import { IncomingHttpHeaders } from 'http';

const SERVER_URL = `${url}:${port}`;

beforeEach(() => {
  request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: 200 });
});

afterAll(() => {
  request('DELETE', `${SERVER_URL}/v1/clear`, { timeout: 200 });
});

describe('adminQuizListv2 /v2/admin/quiz/list', () => {
  let user: IncomingHttpHeaders;
  let quiz: {quizId: number};
  let quiz1: {quizId: number};

  beforeEach(() => {
    user = requestUserRegister(userRegister[0]).body;
    quiz = requestQuizCreatev2(user, quizCreate[0].name, quizCreate[0].description);
    quiz1 = requestQuizCreatev2(user, quizCreate[1].name, quizCreate[1].description);
  });

  it('invalid tokenId', () => {
    // TODO authRegister, authLogout then use token
    expect(() => requestQuizListv2(undefined)).toThrow(HTTPError[401]);
  });

  it('Success', () => {
    const res = requestQuizListv2(user);
    expect(res).toStrictEqual({
      quizzes: [
        {
          quizId: quiz.quizId,
          name: quizCreate[0].name
        },
        {
          quizId: quiz1.quizId,
          name: quizCreate[1].name
        }
      ]
    });
  });
});

describe('adminQuizRemovev2', () => {
  let user1: {token: string};
  let user2 : {token: string};
  let quiz: {quizId: number};
  let session: {sessionId: number};
  const validTime = 5;

  beforeEach(() => {
    user1 = requestUserRegister(userRegister[0]).body;
    user2 = requestUserRegister(userRegister[1]).body;
    quiz = requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);
    expect(requestQuestionCreate(user1.token, corQuestionCreate[0], quiz.quizId).statusCode).toBe(200);
    session = requestSessionCreate(user1, quiz.quizId, validTime);
  });
  test('valid request', () => {
    requestSessionUpdate(user1, quiz.quizId, { action: Action.END }, session.sessionId);
    const response = requestQuizRemovev2(quiz.quizId, user1.token);
    expect(response).toStrictEqual({});
  });
  test('empty token', () => {
    requestSessionUpdate(user1, quiz.quizId, { action: Action.END }, session.sessionId);
    expect(() => {
      requestQuizRemovev2(quiz.quizId, '');
    }).toThrow(HTTPError[401]);
  });
  test('valid token but user does not own the quiz', () => {
    requestSessionUpdate(user1, quiz.quizId, { action: Action.NEXT_QUESTION }, session.sessionId);
    expect(() => {
      requestQuizRemovev2(quiz.quizId, user2.token);
    }).toThrow(HTTPError[403]);
  });
});

describe('adminQuizViewTrash tests', () => {
  let theToken: { token: string };

  beforeEach(() => {
    const user1 = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'john@yahoo.com',
        password: 'Passwor1',
        nameFirst: 'John',
        nameLast: 'Snow'
      }
    });
    theToken = JSON.parse(user1.body.toString());
  });

  test('Token is empty or invalid', () => {
    expect(() => {
      requestQuizzesInTrashv2('invalidString');
    }).toThrow(HTTPError[401]);
  });

  test.skip('Return the quiz correctly', () => {
    const response = requestQuizzesInTrashv2(theToken.token);
    expect(response.statusCode).toBe(200);
  });
});

describe.skip('adminQuizEmptyTrash tests', () => {
  let theToken: {token: string};
  let theToken2: {token: string};
  let quiz1: {quizId: number};
  let quiz2: {quizId: number};

  beforeEach(() => {
    const user1 = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: userRegister[0].email,
        password: userRegister[0].password,
        nameFirst: userRegister[0].nameLast,
        nameLast: userRegister[0].nameFirst,
      }
    });
    theToken = JSON.parse(user1.body.toString());

    const quizResponse1 = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
      json: {
        token: theToken.token,
        name: quizCreate[0].name,
        description: quizCreate[0].description,
      }
    });
    quiz1 = JSON.parse(quizResponse1.body.toString());

    const user2 = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: userRegister[1].email,
        password: userRegister[1].password,
        nameFirst: userRegister[1].nameLast,
        nameLast: userRegister[1].nameFirst,
      }
    });
    theToken2 = JSON.parse(user2.body.toString());

    const quizResponse2 = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
      json: {
        token: theToken2.token,
        name: quizCreate[1].name,
        description: quizCreate[1].description,
      }
    });
    quiz2 = JSON.parse(quizResponse2.body.toString());
  });
  test('Token is empty or invalid', () => {
    // Put the quizzes in the trash using the updated function
    requestQuizRemovev2(quiz1.quizId, theToken.token);
    requestQuizRemovev2(quiz2.quizId, theToken2.token);

    expect(() => {
      requestQuizEmptyTrashv2('', [quiz1.quizId]);
    }).toThrow(HTTPError[401]);
  });

  test('Quiz ID is not currently in trash', () => {
    expect(() => {
      requestQuizEmptyTrashv2(theToken2.token, [quiz2.quizId]);
    }).toThrow(HTTPError[400]);
  });

  test('User is not an owner of the quiz', () => {
    // Put both quizzes in the trash
    requestQuizRemovev2(quiz1.quizId, theToken.token);
    requestQuizRemovev2(quiz2.quizId, theToken2.token);

    expect(() => {
      requestQuizEmptyTrashv2(theToken2.token, [quiz1.quizId]);
    }).toThrow(HTTPError[403]);
  });

  test('Valid request', () => {
    // Put both quizzes in the trash
    requestQuizRemovev2(quiz1.quizId, theToken.token);
    requestQuizRemovev2(quiz2.quizId, theToken2.token);
    const response = requestQuizEmptyTrashv2(theToken.token, [quiz2.quizId]);
    expect(response.statusCode).toBe(200);
    expect(response).toStrictEqual({});
  });
});

describe('Create Session /v1/admin/quiz/:quizid/session/start', () => {
  let user1 : {token: string};
  let user2 : {token: string};
  let quiz: {quizId: number};
  const validTime = 5;

  beforeEach(() => {
    user1 = requestUserRegister(userRegister[0]).body;
    user2 = requestUserRegister(userRegister[1]).body;
    quiz = requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);
  });

  it('Invalid token', () => {
    expect(requestQuestionCreate(user1.token, corQuestionCreate[0], quiz.quizId).statusCode).toBe(200);
    expect(() => requestSessionCreate({ token: 'Invalid' }, quiz.quizId, validTime)).toThrow(HTTPError[401]);
    expect(() => requestSessionCreate(undefined, quiz.quizId, validTime)).toThrow(HTTPError[401]);
  });

  it('Valid token is provided but user is not the owner', () => {
    expect(requestQuestionCreate(user1.token, corQuestionCreate[0], quiz.quizId).statusCode).toBe(200);
    expect(() => requestSessionCreate(user2, quiz.quizId, validTime)).toThrow(HTTPError[403]);
  });

  it('autoStartNum is a number greater than 50', () => {
    expect(requestQuestionCreate(user1.token, corQuestionCreate[0], quiz.quizId).statusCode).toBe(200);
    expect(() => requestSessionCreate(user1, quiz.quizId, 51)).toThrow(HTTPError[400]);
  });

  it('A maximum of 10 sessions that are not in END state currently exist', () => {
    expect(requestQuestionCreate(user1.token, corQuestionCreate[0], quiz.quizId).statusCode).toBe(200);
    // loop 10 sessions
    for (let i = 0; i < 10; i++) {
      requestSessionCreate(user1, quiz.quizId, validTime);
    }
    expect(() => requestSessionCreate(user1, quiz.quizId, validTime)).toThrow(HTTPError[400]);
  });

  it('The quiz does not have any questions in it', () => {
    expect(() => requestSessionCreate(user1, quiz.quizId, validTime)).toThrow(HTTPError[400]);
  });

  it('Success', () => {
    expect(requestQuestionCreate(user1.token, corQuestionCreate[0], quiz.quizId).statusCode).toBe(200);
    const res = requestSessionCreate(user1, quiz.quizId, validTime);
    expect(res).toStrictEqual({ sessionId: expect.any(Number) });
  });
});

describe('Session State Edit /v1/admin/quiz/{quizid}/session/{sessionid}', () => {
  let user1: {token: string};
  let user2 : {token: string};
  let quiz: {quizId: number};
  let quiz2: {quizId: number};
  let session: {sessionId: number};
  const validTime = 5;

  beforeEach(() => {
    user1 = requestUserRegister(userRegister[0]).body;
    user2 = requestUserRegister(userRegister[1]).body;
    quiz = requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);
    quiz2 = requestQuizCreatev2(user1, quizCreate[1].name, quizCreate[1].description);
    expect(requestQuestionCreate(user1.token, corQuestionCreate[0], quiz.quizId).statusCode).toBe(200);
    session = requestSessionCreate(user1, quiz.quizId, validTime);
  });

  it('Invalid token', () => {
    expect(() => requestSessionUpdate({ token: 'invalid' }, quiz.quizId, { action: Action.NEXT_QUESTION }, session.sessionId)).toThrow(HTTPError[401]);
    expect(() => requestSessionUpdate(undefined, quiz.quizId, { action: Action.NEXT_QUESTION }, session.sessionId)).toThrow(HTTPError[401]);
  });

  it('Valid token is provided but user is not the owner', () => {
    expect(() => requestSessionUpdate(user2, quiz.quizId, { action: Action.NEXT_QUESTION }, session.sessionId)).toThrow(HTTPError[403]);
  });

  it('SessionId does not refer to active session in this quiz', () => {
    expect(() => requestSessionUpdate(user1, quiz2.quizId, { action: Action.NEXT_QUESTION }, session.sessionId)).toThrow(HTTPError[400]);
  });

  it('Action Provided is not a valid action enum', () => {
    expect(() => requestSessionUpdate(user1, quiz.quizId, { action: 'INVALID_ACTION' }, session.sessionId)).toThrow(HTTPError[400]);
  });

  it('Action enum cannot be applied in current state', () => {
    expect(() => requestSessionUpdate(user1, quiz.quizId, { action: Action.GO_TO_ANSWER }, session.sessionId)).toThrow(HTTPError[400]);
  });
  it('SUCCESS', () => {
    const res = requestSessionUpdate(user1, quiz.quizId, { action: Action.NEXT_QUESTION }, session.sessionId);
    expect(res).toStrictEqual({});
  });
});

describe('Player Join /v1/player/join', () => {
  let user1: {token: string};
  let quiz: {quizId: number};
  let session: {sessionId: number};
  const validTime = 5;

  beforeEach(() => {
    user1 = requestUserRegister(userRegister[0]).body;
    quiz = requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);

    expect(requestQuestionCreate(user1.token, corQuestionCreate[0], quiz.quizId).statusCode).toBe(200);
    session = requestSessionCreate(user1, quiz.quizId, validTime);
  });

  it('Name of user entered is not unique (compared to other users who have already joined', () => {
    requestPlayerJoin(userRegister[0].nameFirst + ' ' + userRegister[0].nameLast, session.sessionId);
    expect(() => requestPlayerJoin(userRegister[0].nameFirst + ' ' + userRegister[0].nameLast, session.sessionId)).toThrow(HTTPError[400]);
  });

  it('Session is not in LOBBY state', () => {
    requestSessionUpdate({ token: user1.token }, quiz.quizId, { action: Action.NEXT_QUESTION }, session.sessionId);
    expect(() => requestPlayerJoin(userRegister[0].nameFirst + ' ' + userRegister[0].nameLast, session.sessionId)).toThrow(HTTPError[400]);
  });

  it('Input player name is empty', () => {
    const res = requestPlayerJoin('', session.sessionId);

    // TODO: check if new player has the correct name format
    expect(res).toStrictEqual({ playerId: expect.any(Number) });
  });

  it('Success', () => {
    const res = requestPlayerJoin(userRegister[0].nameFirst + ' ' + userRegister[0].nameLast, session.sessionId);
    expect(res).toStrictEqual({ playerId: expect.any(Number) });
  });
});

describe('adminQuizInfo', () => {
  let theToken: IncomingHttpHeaders;
  let theQuiz: QuizReturn;

  beforeEach(() => {
    theToken = requestUserRegister(userRegister[0]).body;
    theQuiz = requestQuizCreatev2(theToken, quizCreate[0].name, quizCreate[0].description);
  });

  test.each([
    { token: '' },
    { token: '1234' }
  ])('ERROR: %p is invalid Token', ({ token }) => {
    expect(() => requestQuizInfov2({ token }, theQuiz.quizId)).toThrow(HTTPError[401]);
  });

  test('validToken but not user is not owner of Quiz', () => {
    const theToken2 = requestUserRegister(userRegister[1]).body;
    expect(() => requestQuizInfov2(theToken2, theQuiz.quizId)).toThrow(HTTPError[403]);
  });

  test("valid ID: ('$authUserId', 'quizId')", () => {
    const quizInfo = requestQuizInfov2(theToken, theQuiz.quizId);
    // expect(quizInfo.statusCode).toBe(200);
    expect(quizInfo).toStrictEqual(
      {
        quizId: theQuiz.quizId,
        name: quizCreate[0].name,
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: quizCreate[0].description,
        numQuestions: 0,
        thumbnailURL: '',
        questions: [],
        duration: 0,
        userId: expect.any(Number),
      }
    );
  });
});

describe('adminQuizQuestion Create /v2/admin/quiz/:quiz/question', () => {
  let theToken: IncomingHttpHeaders;
  let theQuiz: {quizId: number};
  let theToken2: IncomingHttpHeaders;

  beforeEach(() => {
    theToken = requestUserRegister(userRegister[0]).body;
    theQuiz = requestQuizCreatev2(theToken,
      quizCreate[0].name, quizCreate[0].description
    );

    theToken2 = requestUserRegister(userRegister[1]).body;
  });

  test('invalid token', () => {
    expect(() => requestQuizQuestionCreatev2({}, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 1,
          points: 1,
          answers:
          [{ answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false }]
        }
      }
    )).toThrow(HTTPError[401]);
  });

  test('invalid Quiz ID', () => {
    expect(() => requestQuizQuestionCreatev2(theToken, -1,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 1,
          points: 1,
          answers:
          [{ answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false }]
        }
      }
    )).toThrow(HTTPError[400]);
  });

  test('invalid user for that quiz ID', () => {
    expect(() => requestQuizQuestionCreatev2(theToken2, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 1,
          points: 1,
          answers:
          [{ answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false }]
        }
      }
    )).toThrow(HTTPError[403]);
  });

  test('question string invalid', () => {
    expect(() => requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who?',
          duration: 2,
          points: 5,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    )).toThrow(HTTPError[400]);

    expect(() => requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Oh my God, but who, who was the one who let the dogs out?',
          duration: 1,
          points: 1,
          answers: [{ answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false }]
        }
      }
    )).toThrow(HTTPError[400]);
  });

  test('Invalid number of answers', () => {
    expect(() => requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 1,
          points: 1,
          answers:
          [{ answer: 'the neighbour', correct: false }]
        }
      }
    )).toThrow(HTTPError[400]);

    expect(() => requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 1,
          points: 1,
          answers:
          [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
            { answer: 'the real estate agent', correct: false },
            { answer: 'the president', correct: false },
          ]
        }
      }
    )).toThrow(HTTPError[400]);
  });

  test('Negative duration', () => {
    expect(() => requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: -1,
          points: 1,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    )).toThrow(HTTPError[400]);

    expect(() => requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 0,
          points: 1,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    )).toThrow(HTTPError[400]);
  });

  test('Sum of question durations > 3 min', () => {
    expect(() => requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 181,
          points: 1,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    )).toThrow(HTTPError[400]);
  });

  test('Points awarded out of range', () => {
    expect(() => requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 4,
          points: 0,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    )).toThrow(HTTPError[400]);
  });

  test('Points awarded out of range', () => {
    expect(() => requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 4,
          points: 0,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    )).toThrow(HTTPError[400]);

    expect(() => requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 4,
          points: 11,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    )).toThrow(HTTPError[400]);
  });

  test('Invalid answer range', () => {
    expect(() => requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 4,
          points: 11,
          answers: [
            { answer: '', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    )).toThrow(HTTPError[400]);

    expect(() => requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 4,
          points: 11,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer, not it wasnt...', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    )).toThrow(HTTPError[400]);
  });

  test('Duplicated answer', () => {
    expect(() => requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 2,
          points: 5,
          answers: [
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    )).toThrow(HTTPError[400]);

    expect(() => requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 2,
          points: 5,
          answers:
          [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the postman', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    )).toThrow(HTTPError[400]);
  });

  test('No correct answer', () => {
    expect(() => requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 2,
          points: 5,
          answers:
          [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: false },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    )).toThrow(HTTPError[400]);
  });

  test('valid request', () => {
    expect(requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 2,
          points: 5,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    )).toStrictEqual({ questionId: expect.any(Number) });

    expect(requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the cats out?',
          duration: 2,
          points: 5,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    )).toStrictEqual({ questionId: expect.any(Number) });

    expect(requestQuizInfov2(theToken, theQuiz.quizId)).toStrictEqual(
      {
        quizId: theQuiz.quizId,
        name: quizCreate[0].name,
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: quizCreate[0].description,
        numQuestions: 2,
        questions: [
          {
            questionId: expect.any(Number),
            question: 'Who let the dogs out?',
            duration: 2,
            points: 5,
            answers: [
              {
                answerId: expect.any(Number),
                answer: 'the neighbour',
                correct: false,
                colour: expect.any(String)
              },
              {
                answerId: expect.any(Number),
                answer: 'the butcher',
                correct: false,
                colour: expect.any(String)
              },
              {
                answerId: expect.any(Number),
                answer: 'the police officer',
                correct: false,
                colour: expect.any(String)
              },
              {
                answerId: expect.any(Number),
                answer: 'the postman',
                correct: true,
                colour: expect.any(String)
              },
              {
                answerId: expect.any(Number),
                answer: 'their owner',
                correct: false,
                colour: expect.any(String)
              },
            ]
          },
          {
            questionId: expect.any(Number),
            question: 'Who let the cats out?',
            duration: 2,
            points: 5,
            answers: [
              {
                answerId: expect.any(Number),
                answer: 'the neighbour',
                correct: false,
                colour: expect.any(String)
              },
              {
                answerId: expect.any(Number),
                answer: 'the butcher',
                correct: false,
                colour: expect.any(String)
              },
              {
                answerId: expect.any(Number),
                answer: 'the police officer',
                correct: false,
                colour: expect.any(String)
              },
              {
                answerId: expect.any(Number),
                answer: 'the postman',
                correct: true,
                colour: expect.any(String)
              },
              {
                answerId: expect.any(Number),
                answer: 'their owner',
                correct: false,
                colour: expect.any(String)
              },
            ]
          }
        ],
        duration: 0,
        userId: expect.any(Number),
      }
    );
  });
});

describe('quizQuestionEditv2 /v2/admin/quiz/{quizid}/question/{questionid}', () => {
  let theToken: {token: string};
  let theQuiz: {quizId: number};
  let theToken2: {token: string};
  let question: {questionId: number};

  beforeEach(() => {
    theToken = requestUserRegister(userRegister[0]).body;
    theToken2 = requestUserRegister(userRegister[1]).body;
    theQuiz = requestQuizCreatev2(theToken, quizCreate[0].name, quizCreate[0].description);
    question = requestQuestionCreate(theToken.token, corQuestionCreate[0], theQuiz.quizId).body;
  });

  test('invalid question Id', () => {
    request('DELETE', `${SERVER_URL}/v1/clear`);
    theToken = requestUserRegister(userRegister[0]).body;
    theQuiz = requestQuizCreatev2(theToken, quizCreate[0].name, quizCreate[0].description);
    requestQuestionCreate(theToken.token, corQuestionCreate[0], theQuiz.quizId);
    expect(() => requestQuizQuestionEditv2(theToken, theQuiz.quizId, question.questionId, { questionBody: quizQuestions[0] })).toThrow(HTTPError[400]);
  });

  test('invalid user for that quiz ID', () => {
    expect(() => requestQuizQuestionEditv2(theToken2, theQuiz.quizId, question.questionId, { questionBody: quizQuestions[0] })).toThrow(HTTPError[403]);
  });

  test('question string invalid', () => {
    const newInput = structuredClone(quizQuestions[0]);
    newInput.question = 'Who?';
    expect(() => requestQuizQuestionEditv2(theToken, theQuiz.quizId, question.questionId, { questionBody: newInput })).toThrow(HTTPError[400]);

    newInput.question = 'Oh my God, but who, who was the one who let the dogs out?';
    expect(() => requestQuizQuestionEditv2(theToken, theQuiz.quizId, question.questionId, { questionBody: newInput })).toThrow(HTTPError[400]);
  });

  test('Invalid number of answers', () => {
    const newInput = structuredClone(quizQuestions[0]);
    newInput.answers = [quizQuestions[0].answers[0]];
    expect(() => requestQuizQuestionEditv2(theToken, theQuiz.quizId, question.questionId, { questionBody: newInput })).toThrow(HTTPError[400]);

    newInput.answers = [
      { answer: 'the neighbour', correct: false },
      { answer: 'the butcher', correct: false },
      { answer: 'the police officer', correct: false },
      { answer: 'the postman', correct: true },
      { answer: 'their owner', correct: false },
      { answer: 'the real estate agent', correct: false },
      { answer: 'the president', correct: false },
    ];
    expect(() => requestQuizQuestionEditv2(theToken, theQuiz.quizId, question.questionId, { questionBody: newInput })).toThrow(HTTPError[400]);
  });

  test('Negative duration', () => {
    const newInput = structuredClone(quizQuestions[0]);
    newInput.duration = -1;
    expect(() => requestQuizQuestionEditv2(theToken, theQuiz.quizId, question.questionId, { questionBody: newInput })).toThrow(HTTPError[400]);
  });

  test('Sum of question durations > 3 min', () => {
    // cor[1] has duration of 1
    requestQuestionCreate(theToken.token, quizQuestions[1], theQuiz.quizId);
    const newInput = structuredClone(quizQuestions[0]);
    newInput.duration = 180;
    expect(() => requestQuizQuestionEditv2(theToken, theQuiz.quizId, question.questionId, { questionBody: newInput })).toThrow(HTTPError[400]);
  });

  test('Points awarded out of range', () => {
    const newInput = structuredClone(quizQuestions[0]);
    newInput.points = 0;
    expect(() => requestQuizQuestionEditv2(theToken, theQuiz.quizId, question.questionId, { questionBody: newInput })).toThrow(HTTPError[400]);

    newInput.points = 11;
    expect(() => requestQuizQuestionEditv2(theToken, theQuiz.quizId, question.questionId, { questionBody: newInput })).toThrow(HTTPError[400]);
  });

  test('Invalid answer range', () => {
    // TODO: simplify
    let questionBody = structuredClone(corQuestionCreate[0]);
    questionBody.answers[0].answer = '';
    expect(() => requestQuizQuestionEditv2(theToken, theQuiz.quizId, question.questionId, { questionBody: questionBody })).toThrow(HTTPError[400]);

    questionBody = structuredClone(corQuestionCreate[0]);
    questionBody.answers[0].answer = 'ab'.repeat(15) + 'a';
    expect(() => requestQuizQuestionEditv2(theToken, theQuiz.quizId, question.questionId, { questionBody: questionBody })).toThrow(HTTPError[400]);
  });

  test('Duplicated answer', () => {
    const questionBody = structuredClone(corQuestionCreate[0]);
    questionBody.answers[1].answer = questionBody.answers[0].answer;
    expect(() => requestQuizQuestionEditv2(theToken, theQuiz.quizId, question.questionId, { questionBody: questionBody })).toThrow(HTTPError[400]);
  });

  test('No correct answer', () => {
    const questionBody = structuredClone(corQuestionCreate[0]);
    questionBody.answers[3].correct = false;
    expect(() => requestQuizQuestionEditv2(theToken, theQuiz.quizId, question.questionId, { questionBody: questionBody })).toThrow(HTTPError[400]);
  });

  test('invalid token', () => {
    expect(() => requestQuizQuestionEditv2(undefined, theQuiz.quizId, question.questionId, { questionBody: corQuestionCreate[0] })).toThrow(HTTPError[401]);
  });

  test('valid request', () => {
    expect(requestQuizQuestionEditv2(theToken, theQuiz.quizId, question.questionId, { questionBody: corQuestionCreate[0] })).toStrictEqual({ questionId: expect.any(Number) });
  });
});

describe('adminQuizQuestion Duplicate /v1/admin/quiz/:quizid/question/:questionid/duplicate', () => {
  let theToken: IncomingHttpHeaders;
  let theQuiz: {quizId: number};
  let theToken2: IncomingHttpHeaders;
  let question1: {questionId: number};

  beforeEach(() => {
    const user1 = request('POST', `${SERVER_URL}/v1/admin/auth/register`,
      {
        json: {
          email: 'john@yahoo.com',
          password: 'Passwor1',
          nameFirst: 'John',
          nameLast: 'Snow'
        }
      }
    );
    theToken = JSON.parse(user1.body.toString());
    theQuiz = requestQuizCreatev2(theToken, quizCreate[0].name, quizCreate[0].description);
    // theQuiz = JSON.parse(quiz.body.toString());

    const user2 = request('POST', `${SERVER_URL}/v1/admin/auth/register`,
      {
        json: {
          email: 'john2@yahoo.com',
          password: 'Passwor1',
          nameFirst: 'Joanna',
          nameLast: 'Snowa'
        }
      }
    );
    theToken2 = JSON.parse(user2.body.toString());

    question1 = requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 2,
          points: 5,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    );
    // question1 = JSON.parse(quizQuestion.body as string);
  });

  test('invalid token', () => {
    expect(() =>
      requestQuizQuestionDuplicatev2({}, theQuiz.quizId,
        question1.questionId)).toThrow(HTTPError[401]);
  });

  test('invalid Question ID', () => {
    expect(() =>
      requestQuizQuestionDuplicatev2(theToken, theQuiz.quizId, -1)
    ).toThrow(HTTPError[400]);
  });

  test('invalid user for that quiz ID', () => {
    expect(() =>
      requestQuizQuestionDuplicatev2(theToken2, theQuiz.quizId, question1.questionId)
    ).toThrow(HTTPError[403]);
  });

  test('valid request', () => {
    expect(requestQuizQuestionDuplicatev2(theToken, theQuiz.quizId,
      question1.questionId)
    ).toStrictEqual({ newQuestionId: expect.any(Number) });

    expect(requestQuizInfov2(theToken, theQuiz.quizId)
    ).toStrictEqual({
      quizId: theQuiz.quizId,
      name: 'COMP1111',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Party time',
      numQuestions: 1,
      questions: [
        {
          questionId: question1.questionId,
          question: 'Who let the dogs out?',
          duration: 2,
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'the neighbour',
              correct: false,
              colour: expect.any(String)
            },
            {
              answerId: expect.any(Number),
              answer: 'the butcher',
              correct: false,
              colour: expect.any(String)
            },
            {
              answerId: expect.any(Number),
              answer: 'the police officer',
              correct: false,
              colour: expect.any(String)
            },
            {
              answerId: expect.any(Number),
              answer: 'the postman',
              correct: true,
              colour: expect.any(String)
            },
            {
              answerId: expect.any(Number),
              answer: 'their owner',
              correct: false,
              colour: expect.any(String)
            },
          ]
        },
        {
          questionId: expect.any(Number),
          question: 'Who let the dogs out?',
          duration: 2,
          points: 5,
          answers: [
            {
              answerId: expect.any(Number),
              answer: 'the neighbour',
              correct: false,
              colour: expect.any(String)
            },
            {
              answerId: expect.any(Number),
              answer: 'the butcher',
              correct: false,
              colour: expect.any(String)
            },
            {
              answerId: expect.any(Number),
              answer: 'the police officer',
              correct: false,
              colour: expect.any(String)
            },
            {
              answerId: expect.any(Number),
              answer: 'the postman',
              correct: true,
              colour: expect.any(String)
            },
            {
              answerId: expect.any(Number),
              answer: 'their owner',
              correct: false,
              colour: expect.any(String)
            },
          ]
        }
      ],
      duration: 0,
      userId: expect.any(Number),
    });
  });
});

// delete this line

describe('adminQuizQuestion Delete /v1/admin/quiz/:quizid/question/:questionid', () => {
  let theToken: IncomingHttpHeaders;
  let theQuiz: {quizId: number};
  let theToken2: IncomingHttpHeaders;
  let question1: {questionId: number};

  beforeEach(() => {
    const user1 = request('POST', `${SERVER_URL}/v1/admin/auth/register`,
      {
        json: {
          email: 'john@yahoo.com',
          password: 'Passwor1',
          nameFirst: 'John',
          nameLast: 'Snow'
        }
      }
    );
    theToken = JSON.parse(user1.body.toString());
    theQuiz = requestQuizCreatev2(theToken, quizCreate[0].name, quizCreate[0].description);
    // theQuiz = JSON.parse(quiz.body.toString());

    const user2 = request('POST', `${SERVER_URL}/v1/admin/auth/register`,
      {
        json: {
          email: 'john2@yahoo.com',
          password: 'Passwor1',
          nameFirst: 'Joanna',
          nameLast: 'Snowa'
        }
      }
    );
    theToken2 = JSON.parse(user2.body.toString());

    question1 = requestQuizQuestionCreatev2(theToken, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 2,
          points: 5,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    );
    // question1 = JSON.parse(quizQuestion.body as string);
  });

  test('invalid token', () => {
    expect(() =>
      requestQuizQuestionDeletev2({}, theQuiz.quizId, question1.questionId)
    ).toThrow(HTTPError[401]);
  });

  test('invalid Question ID', () => {
    expect(() =>
      requestQuizQuestionDeletev2(theToken, theQuiz.quizId, -1)
    ).toThrow(HTTPError[400]);
  });

  test('invalid user for that quiz ID', () => {
    expect(() =>
      requestQuizQuestionDeletev2(theToken2, theQuiz.quizId, question1.questionId)
    ).toThrow(HTTPError[403]);
  });

  test('valid request', () => {
    expect(
      requestQuizQuestionDeletev2(theToken, theQuiz.quizId, question1.questionId)
    ).toStrictEqual({});

    expect(requestQuizInfov2(theToken, theQuiz.quizId)).toStrictEqual(
      {
        quizId: theQuiz.quizId,
        name: 'COMP1111',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Party time',
        numQuestions: 0,
        questions: [],
        duration: 0,
        userId: expect.any(Number),
      }
    );
  });
});

describe('/v1/player/:playerid/chat', () => {
  let user1: {token: string};
  let quiz: {quizId: number};
  let session: {sessionId: number};
  let player: {playerId: number};
  const validTime = 5;

  const validMessage = {
    message: {
      messageBody: 'Hello everyone! Nice to chat.'
    }
  };

  beforeEach(() => {
    user1 = requestUserRegister(userRegister[0]).body;
    quiz = requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);
    expect(requestQuestionCreate(user1.token, corQuestionCreate[0], quiz.quizId).statusCode).toBe(200);
    session = requestSessionCreate(user1, quiz.quizId, validTime);
    player = requestPlayerJoin(userRegister[0].nameFirst + ' ' + userRegister[0].nameLast, session.sessionId);
  });
  test('successful send chat message', () => {
    const response = request('POST', `${SERVER_URL}/v1/player/${player.playerId}/chat`, {
      json: validMessage
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body.toString())).toStrictEqual({});
  });

  test('player ID does not exist', () => {
    const invalidPlayerId = -1;
    expect(() => {
      requestPlayerSendChat(invalidPlayerId, validMessage.message.messageBody);
    }).toThrow(HTTPError[400]);
  });

  test('message body too short', () => {
    expect(() => {
      requestPlayerSendChat(player.playerId, '');
    }).toThrow(HTTPError[400]);
  });

  test('message body too long', () => {
    expect(() => {
      requestPlayerSendChat(player.playerId, 'a'.repeat(120));
    }).toThrow(HTTPError[400]);
  });
});

describe('Player chat /v1/:playerId/chat', () => {
  let user1: {token: string};
  let quiz: {quizId: number};
  let session: {sessionId: number};
  let player: {playerId: number};
  const validTime = 5;

  beforeEach(() => {
    user1 = requestUserRegister(userRegister[0]).body;
    quiz = requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);

    expect(requestQuestionCreate(user1.token, corQuestionCreate[0], quiz.quizId).statusCode).toBe(200);
    session = requestSessionCreate(user1, quiz.quizId, validTime);
    player = requestPlayerJoin(userRegister[0].nameFirst + ' ' + userRegister[0].nameLast, session.sessionId);
  });

  it('If player ID does not exist', () => {
    const res = requestChat(player.playerId + 1);
    expect(res.statusCode).toBe(400);
  });

  it('Success', () => {
    const res = requestChat(player.playerId);
    expect(res.statusCode).toBe(200);
  });
});

describe('Session Status /v1/admin/quiz/:quizid/session/:sessionid', () => {
  let user1 : IncomingHttpHeaders;
  let user2 : IncomingHttpHeaders;
  let quiz: {quizId: number};
  let session: {sessionId: number};
  const validTime = 5;

  beforeEach(() => {
    user1 = requestUserRegister(userRegister[0]).body;
    user2 = requestUserRegister(userRegister[1]).body;

    quiz = requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);

    requestQuizQuestionCreatev2(user1, quiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 2,
          points: 5,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ],
          thumbnailURL: 'http://google.com/some/image/path.jpg'
        }
      }
    );
    session = requestSessionCreate(user1, quiz.quizId, validTime);
  });

  it('Invalid token', () => {
    expect(() => requestSessionStatus({}, quiz.quizId, session.sessionId))
      .toThrow(HTTPError[401]);
    expect(() => requestSessionStatus(undefined, quiz.quizId, session.sessionId))
      .toThrow(HTTPError[401]);
  });

  it('Valid token is provided but user is not the owner', () => {
    expect(() => requestSessionStatus(user2, quiz.quizId, session.sessionId))
      .toThrow(HTTPError[403]);
  });

  it('Session Id is not valid for this quiz ', () => {
    expect(() => requestSessionStatus(user1, quiz.quizId, -1))
      .toThrow(HTTPError[400]);
  });

  it('Success', () => {
    expect(requestSessionStatus(user1, quiz.quizId, session.sessionId)).toStrictEqual(
      {
        state: 'LOBBY',
        atQuestion: 0,
        players: expect.any(Object),
        metadata: {
          quizId: expect.any(Number),
          name: 'COMP1111',
          timeCreated: expect.any(Number),
          timeLastEdited: expect.any(Number),
          description: 'Party time',
          numQuestions: expect.any(Number),
          questions: expect.any(Object),
          duration: expect.any(Number),
          thumbnailUrl: expect.any(String)
        }
      }
    );
  });
});

describe('Player Status /v1/player/:playerid', () => {
  let playerId1: {playerId: number};
  let playerId2: {playerId: number};
  let user1: IncomingHttpHeaders;
  let theQuiz: {quizId: number};
  let quiz: Quiz;
  let session: {sessionId: number};
  const validTime = 5;
  // const validTime = 5; enable when session row is enabled

  beforeEach(() => {
    user1 = requestUserRegister(userRegister[0]).body;
    theQuiz = requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);
    requestQuizQuestionCreatev2(user1, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 2,
          points: 5,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    );

    session = requestSessionCreate(user1, theQuiz.quizId, validTime);
    const name1 = userRegister[0].nameFirst + userRegister[0].nameLast;
    const name2 = userRegister[1].nameFirst + userRegister[1].nameLast;
    playerId1 = requestPlayerJoin(name1, session.sessionId);
    playerId2 = requestPlayerJoin(name2, session.sessionId);
    quiz = requestQuizInfov2(user1, theQuiz.quizId);
  });

  it('Invalid Player', () => {
    expect(() => requestPlayerStatus(999))
      .toThrow(HTTPError[400]);
    expect(() => requestPlayerStatus(-1))
      .toThrow(HTTPError[400]);
  });

  it('Success', () => {
    expect(requestPlayerStatus(playerId1.playerId)).toStrictEqual(
      {
        state: 'LOBBY',
        numQuestions: quiz.numQuestions,
        atQuestion: expect.any(Number), // REVIEW THIS!!!!
      }
    );
    expect(requestPlayerStatus(playerId2.playerId)).toStrictEqual(
      {
        state: 'LOBBY',
        numQuestions: quiz.numQuestions,
        atQuestion: expect.any(Number), // REVIEW THIS!!!!
      }
    );
  });
});

describe('Question info for a player /v1/player/:playerid/question/:questionposition', () => {
  let playerId1: {playerId: number};
  let playerId2: {playerId: number};
  let user1: IncomingHttpHeaders;
  let theQuiz: {quizId: number};
  let quiz: Quiz;
  let session: Session;
  let session0: {sessionId: number};
  const validTime = 5;
  // const validTime = 5; enable when session row is enabled

  beforeEach(() => {
    user1 = requestUserRegister(userRegister[0]).body;
    theQuiz = requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);

    requestQuizQuestionCreatev2(user1, theQuiz.quizId,
      {
        questionBody: {
          question: 'Who let the dogs out?',
          duration: 2,
          points: 5,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      });
    requestQuizQuestionCreatev2(user1, theQuiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 2,
          points: 5,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    );

    session0 = requestSessionCreate(user1, theQuiz.quizId, validTime);
    session = requestSessionStatus(user1, theQuiz.quizId, session0.sessionId);
    const name1 = userRegister[0].nameFirst + userRegister[0].nameLast;
    const name2 = userRegister[1].nameFirst + userRegister[1].nameLast;
    playerId1 = requestPlayerJoin(name1, session0.sessionId);
    playerId2 = requestPlayerJoin(name2, session0.sessionId);
    quiz = requestQuizInfov2(user1, theQuiz.quizId);
  });

  it('Invalid Player', () => {
    expect(() => requestPlayerQuestionInfo(999, 1))
      .toThrow(HTTPError[400]);
    expect(() => requestPlayerQuestionInfo(-1, 1))
      .toThrow(HTTPError[400]);
  });

  it('Question Position is not valid for the session the player is in', () => {
    expect(() => requestPlayerQuestionInfo(playerId1.playerId, 3))
      .toThrow(HTTPError[400]);
    expect(() => requestPlayerQuestionInfo(playerId2.playerId, 4))
      .toThrow(HTTPError[400]);
  });

  it('Session is not currently on this question', () => {
    expect(() => requestPlayerQuestionInfo(playerId1.playerId, 2))
      .toThrow(HTTPError[400]);
    expect(() => requestPlayerQuestionInfo(playerId2.playerId, 2))
      .toThrow(HTTPError[400]);
  });

  it('Session is in LOBBY or END state', () => {
    expect(() => requestPlayerQuestionInfo(playerId1.playerId, 1))
      .toThrow(HTTPError[400]);
    requestSessionUpdate({ token: user1.token }, quiz.quizId,
      { action: Action.END }, session0.sessionId);
    expect(() => requestPlayerQuestionInfo(playerId2.playerId, 1))
      .toThrow(HTTPError[400]);
  });

  it('Success', () => {
    requestSessionUpdate({ token: user1.token }, quiz.quizId,
      { action: Action.NEXT_QUESTION }, session0.sessionId);
    session = requestSessionStatus(user1, theQuiz.quizId, session0.sessionId);
    expect(requestPlayerQuestionInfo(playerId1.playerId, 1)).toStrictEqual(session.metadata.questions[0]);
    expect(requestPlayerQuestionInfo(playerId2.playerId, 1)).toStrictEqual(session.metadata.questions[0]);
  });
});

describe('/v1/player/:playerid/chat', () => {
  let user1: {token: string};
  let quiz: {quizId: number};
  let session: {sessionId: number};
  let player: {playerId: number};
  const validTime = 5;

  const validMessage = {
    message: {
      messageBody: 'Hello everyone! Nice to chat.'
    }
  };

  beforeEach(() => {
    user1 = requestUserRegister(userRegister[0]).body;
    quiz = requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);
    expect(requestQuestionCreate(user1.token, corQuestionCreate[0], quiz.quizId).statusCode).toBe(200);
    session = requestSessionCreate(user1, quiz.quizId, validTime);
    player = requestPlayerJoin(userRegister[0].nameFirst + ' ' + userRegister[0].nameLast, session.sessionId);
  });

  test('successful send chat message', () => {
    const response = request('POST', `${SERVER_URL}/v1/player/${player.playerId}/chat`, {
      json: validMessage
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body.toString())).toStrictEqual({});
  });

  test('player ID does not exist', () => {
    const invalidPlayerId = -1;
    expect(() => {
      requestPlayerSendChat(invalidPlayerId, validMessage.message.messageBody);
    }).toThrow(HTTPError[400]);
  });

  test('message body too short', () => {
    expect(() => {
      requestPlayerSendChat(player.playerId, '');
    }).toThrow(HTTPError[400]);
  });

  test('message body too long', () => {
    expect(() => {
      requestPlayerSendChat(player.playerId, 'a'.repeat(120));
    }).toThrow(HTTPError[400]);
  });
});

describe('Final session Results /v1/admin/quiz/:quizid/session/:sessionid/results', () => {
  let user1: {token: string};
  let user2: {token: string};
  let quiz: {quizId: number};
  let session: {sessionId: number};
  const validTime = 5;

  beforeEach(() => {
    user1 = requestUserRegister(userRegister[0]).body;
    user2 = requestUserRegister(userRegister[1]).body;
    quiz = requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);

    expect(requestQuestionCreate(user1.token, corQuestionCreate[0], quiz.quizId).statusCode).toBe(200);
    session = requestSessionCreate(user1, quiz.quizId, validTime);
  });

  it('Token is empty or invalid (does not refer to valid logged in user session)', () => {
    const res = requestSessionFinalResults(quiz.quizId, session.sessionId, '');
    expect(res.statusCode).toBe(401);
  });
  it('Valid token is provided, but user is not an owner of this quiz', () => {
    const res = requestSessionFinalResults(quiz.quizId, session.sessionId, user2.token);
    expect(res.statusCode).toBe(403);
  });

  it('Session Id does not refer to a valid session within this quiz', () => {
    const res = requestSessionFinalResults(quiz.quizId, -1, user1.token);
    expect(res.statusCode).toBe(400);
  });

  it('Session is not in FINAL_RESULTS state', () => {
    const res = requestSessionFinalResults(quiz.quizId, session.sessionId, user1.token);
    expect(res.statusCode).toBe(400);
  });

  it('Success', () => {
    requestSessionUpdate(user1, quiz.quizId, { action: Action.NEXT_QUESTION }, session.sessionId);
    requestSessionUpdate(user1, quiz.quizId, { action: Action.SKIP_COUNTDOWN }, session.sessionId);
    requestSessionUpdate(user1, quiz.quizId, { action: Action.GO_TO_ANSWER }, session.sessionId);
    requestSessionUpdate(user1, quiz.quizId, { action: Action.GO_TO_FINAL_RESULTS }, session.sessionId);
    const res = requestSessionFinalResults(quiz.quizId, session.sessionId, user1.token);
    expect(res.statusCode).toBe(200);
  });
});

describe('requestResultsForQuestion tests', () => {
  let playerId1: {playerId: number};
  let playerId2: {playerId: number};
  let user1: IncomingHttpHeaders;
  let theQuiz: {quizId: number};
  let quiz: Quiz;
  let session: {sessionId: number};
  const validTime = 5;

  beforeEach(() => {
    user1 = requestUserRegister(userRegister[0]).body;
    theQuiz = requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);

    requestQuizQuestionCreatev2(user1, theQuiz.quizId, { questionBody: quizQuestions[0] });
    requestQuizQuestionCreatev2(user1, theQuiz.quizId, { questionBody: quizQuestions[1] });

    session = requestSessionCreate(user1, theQuiz.quizId, validTime);
    const name1 = userRegister[0].nameFirst + userRegister[0].nameLast;
    const name2 = userRegister[1].nameFirst + userRegister[1].nameLast;
    playerId1 = requestPlayerJoin(name1, session.sessionId);
    playerId2 = requestPlayerJoin(name2, session.sessionId);
    quiz = requestQuizInfov2(user1, theQuiz.quizId);
  });
  test('Player doesnt exist', () => {
    expect(() => requestResultsForQuestion(999, 1))
      .toThrow(HTTPError[400]);
    expect(() => requestResultsForQuestion(-1, 1))
      .toThrow(HTTPError[400]);
  });
  test('Question Position is not valid for the session the player is in', () => {
    expect(() => requestResultsForQuestion(playerId1.playerId, 3))
      .toThrow(HTTPError[400]);
    expect(() => requestResultsForQuestion(playerId2.playerId, 4))
      .toThrow(HTTPError[400]);
  });
  test('Session is not currently on this question', () => {
    expect(() => requestResultsForQuestion(playerId1.playerId, 2))
      .toThrow(HTTPError[400]);
    expect(() => requestResultsForQuestion(playerId2.playerId, 2))
      .toThrow(HTTPError[400]);
  });
  test('Session is in END state', () => {
    requestSessionUpdate({ token: user1.token }, quiz.quizId, { action: Action.END }, session.sessionId);
    expect(() => {
      requestResultsForQuestion(playerId1.playerId, 1);
    }).toThrow(HTTPError[400]);
  });
  test('Session is in QUESTION_CLOSE state', () => {
    requestSessionUpdate({ token: user1.token }, quiz.quizId, { action: Action.NEXT_QUESTION }, session.sessionId);
    expect(() => {
      requestResultsForQuestion(playerId1.playerId, 1);
    }).toThrow(HTTPError[400]);

    requestSessionUpdate({ token: user1.token }, quiz.quizId, { action: Action.SKIP_COUNTDOWN }, session.sessionId);
    expect(() => {
      requestResultsForQuestion(playerId1.playerId, 1);
    }).toThrow(HTTPError[400]);
  });
  test.skip('Success', () => {
    requestSessionUpdate({ token: user1.token }, quiz.quizId, { action: Action.NEXT_QUESTION }, session.sessionId);
    requestSessionUpdate({ token: user1.token }, quiz.quizId, { action: Action.SKIP_COUNTDOWN }, session.sessionId);
    sleepSync(6 * 1000);
    requestSessionUpdate({ token: user1.token }, quiz.quizId, { action: Action.GO_TO_ANSWER }, session.sessionId);
    expect(requestResultsForQuestion(playerId1.playerId, 1)).toStrictEqual({});
    expect(requestResultsForQuestion(playerId2.playerId, 1)).toStrictEqual({});
  });
});

describe('Submit Answer tests', () => {
  let playerId1: {playerId: number};
  let playerId2: {playerId: number};
  let answerIds: number[];
  let user1: IncomingHttpHeaders;
  let theQuiz: {quizId: number};
  let quiz: Quiz;
  let session: {sessionId: number};
  const validTime = 5;

  beforeEach(() => {
    // Register a user and get a token
    user1 = requestUserRegister(userRegister[0]).body;
    theQuiz = requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);
    requestQuizQuestionCreatev2(user1, theQuiz.quizId, { questionBody: quizQuestions[0] });
    requestQuizQuestionCreatev2(user1, theQuiz.quizId, { questionBody: quizQuestions[1] });
    session = requestSessionCreate(user1, theQuiz.quizId, validTime);
    const name1 = userRegister[0].nameFirst + userRegister[0].nameLast;
    const name2 = userRegister[1].nameFirst + userRegister[1].nameLast;
    playerId1 = requestPlayerJoin(name1, session.sessionId);
    playerId2 = requestPlayerJoin(name2, session.sessionId);
    quiz = requestQuizInfov2(user1, theQuiz.quizId);
    requestSessionUpdate({ token: user1.token }, quiz.quizId, { action: Action.NEXT_QUESTION }, session.sessionId);
    requestSessionUpdate({ token: user1.token }, quiz.quizId, { action: Action.SKIP_COUNTDOWN }, session.sessionId);

    const questionInfo: { answers: Answer[] } = requestPlayerQuestionInfo(playerId1.playerId, 1);
    answerIds = questionInfo.answers.map(answer => answer.answerId);
  });

  test('Succesful Answer Submission', () => {
    expect(requestPlayerSubmitAnswer(playerId1.playerId, 1, answerIds)).toStrictEqual({});
    expect(requestPlayerSubmitAnswer(playerId2.playerId, 1, answerIds)).toStrictEqual({});
  });

  test('Invalid Player', () => {
    expect(() => requestPlayerSubmitAnswer(999, 1, answerIds))
      .toThrow(HTTPError[400]);
    expect(() => requestPlayerSubmitAnswer(-1, 1, answerIds))
      .toThrow(HTTPError[400]);
  });
  test('Answer IDs are not valid for this particular question', () => {
    const invalidAnswerIds = [-1];

    expect(() => {
      requestPlayerSubmitAnswer(playerId1.playerId, 1, invalidAnswerIds);
    }).toThrow(HTTPError[400]);
  });
  test('question position is not valid for the session this player is in', () => {
    expect(() => {
      requestPlayerSubmitAnswer(playerId1.playerId, 10, answerIds);
    }).toThrow(HTTPError[400]);
  });
  test('Session is in END state', () => {
    requestSessionUpdate({ token: user1.token }, quiz.quizId, { action: Action.END }, session.sessionId);
    expect(() => {
      requestPlayerSubmitAnswer(playerId1.playerId, 1, answerIds);
    }).toThrow(HTTPError[400]);
  });
  test('Session is in QUESTION_CLOSE state', () => {
    sleepSync(5 * 1000);
    expect(() => {
      requestPlayerSubmitAnswer(playerId1.playerId, 1, answerIds);
    }).toThrow(HTTPError[400]);
  });
  test('Session is in ANSWER_SHOW state', () => {
    requestSessionUpdate({ token: user1.token }, quiz.quizId, { action: Action.GO_TO_ANSWER }, session.sessionId);
    expect(() => {
      requestPlayerSubmitAnswer(playerId1.playerId, 1, answerIds);
    }).toThrow(HTTPError[400]);
  });
  test('Session is in QUESTION_COUNTDOWN state', () => {
    sleepSync(5 * 1000);
    requestSessionUpdate({ token: user1.token }, quiz.quizId, { action: Action.NEXT_QUESTION }, session.sessionId);
    expect(() => {
      requestPlayerSubmitAnswer(playerId1.playerId, 1, answerIds);
    }).toThrow(HTTPError[400]);
  });
  test('session is not yet up to this question', () => {
    expect(() => requestPlayerQuestionInfo(playerId1.playerId, 2))
      .toThrow(HTTPError[400]);
    expect(() => requestPlayerQuestionInfo(playerId2.playerId, 2))
      .toThrow(HTTPError[400]);
  });
  test('Duplicate answer IDs provided', () => {
    const duplicateAnswerIds = [answerIds[0], answerIds[0]];

    expect(() => {
      requestPlayerSubmitAnswer(playerId1.playerId, 1, duplicateAnswerIds);
    }).toThrow(HTTPError[400]);
  });
  test('Less than 1 answer ID submitted', () => {
    const emptyAnswerIds: number[] = [];

    expect(() => {
      requestPlayerSubmitAnswer(playerId1.playerId, 1, emptyAnswerIds);
    }).toThrow(HTTPError[400]);
  });
});

describe('View active and inactive sessions', () => {
  let theToken: IncomingHttpHeaders;
  let theQuiz: QuizReturn;

  beforeEach(() => {
    theToken = requestUserRegister(userRegister[0]).body;
    theQuiz = requestQuizCreatev2(theToken, quizCreate[0].name, quizCreate[0].description);
  });

  test.each([
    { token: '' },
    { token: '1234' }
  ])('ERROR: %p is invalid Token', ({ token }) => {
    expect(() => requestSessionActivity({ token }, theQuiz.quizId)).toThrow(HTTPError[401]);
  });

  test('validToken but not user is not owner of Quiz', () => {
    const theToken2 = requestUserRegister(userRegister[1]).body;
    expect(() => requestSessionActivity(theToken2, theQuiz.quizId)).toThrow(HTTPError[403]);
  });

  test('successfully view session activity', () => {
    const sessionActivity = requestSessionActivity(theToken, theQuiz.quizId);
    expect(sessionActivity).toEqual({
      activeSessions: [],
      inactiveSessions: []
    });
  });
});

describe('adminQuizQuestion Movev2', () => {
  let user1: IncomingHttpHeaders;
  let quiz: { quizId: number };
  let user2: IncomingHttpHeaders;
  let question: {questionId: number };

  beforeEach(() => {
    user1 = requestUserRegister(userRegister[0]).body;
    user2 = requestUserRegister(userRegister[1]).body;
    quiz = requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);
    question = requestQuizQuestionCreatev2(user1, quiz.quizId,
      {
        questionBody:
        {
          question: 'Who let the dogs out?',
          duration: 2,
          points: 5,
          answers: [
            { answer: 'the neighbour', correct: false },
            { answer: 'the butcher', correct: false },
            { answer: 'the police officer', correct: false },
            { answer: 'the postman', correct: true },
            { answer: 'their owner', correct: false },
          ]
        }
      }
    );
  });

  test.skip('Question Id does not refer to a valid question within this quiz', () => {
    expect(() => requestQuestionMovev2(user2, 0, quiz.quizId, undefined)
    ).toThrow(HTTPError[400]);
  });

  test.skip('NewPosition is less than 0, or NewPosition is greater than n-1 where n is the number of questions', () => {
    expect(() => requestQuestionMovev2(user1, -1, quiz.quizId, question.questionId)
    ).toThrow(HTTPError[400]);

    expect(() => requestQuestionMovev2(user1, 2, quiz.quizId, question.questionId)
    ).toThrow(HTTPError[400]);
  });

  test('NewPosition is the position of the current question', () => {
    expect(() => requestQuestionMovev2(user1, 1, quiz.quizId, question.questionId)
    ).toThrow(HTTPError[400]);
  });

  test.skip('Token is empty or invalid (does not refer to valid logged in user session)', () => {
    const invalidHeaders = { token: 'invalid' };
    expect(() => requestQuestionMovev2(invalidHeaders, 0, quiz.quizId, question.questionId)
    ).toThrow(HTTPError[400]);
  });

  test.skip('Valid token is provided, but user is not an owner of this quiz', () => {
    expect(() => requestQuestionMovev2(user2, 0, quiz.quizId, question.questionId)
    ).toThrow(HTTPError[400]);
  });

  test.skip('SUCCESS: question move', () => {
    const res = requestQuestionMovev2(user1, 0, quiz.quizId, question.questionId);

    expect(res.statusCode).toBe(200);
    expect(res.body).toStrictEqual({});
  });
});

describe('Quiz Restore', () => {
  let user1: {token: string};
  let user2 : {token: string};
  let quiz: {quizId: number};

  beforeEach(() => {
    user1 = requestUserRegister(userRegister[0]).body;
    user2 = requestUserRegister(userRegister[1]).body;
    quiz = requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);
  });

  test.skip('Quiz name of the restored quiz is already used by another active quiz', () => {
    requestQuizRemovev2(quiz.quizId, user1.token);
    requestQuizCreatev2(user1, quizCreate[0].name, quizCreate[0].description);
    expect(() => {
      requestQuizRestorev2(quiz.quizId, user1.token);
    }).toThrow(HTTPError[400]);
  });
  test('Quiz ID refers to a quiz that is not currently in the trash', () => {
    expect(() => {
      requestQuizRestorev2(quiz.quizId, user1.token);
    }).toThrow(HTTPError[400]);
  });
  test.skip('invalid token', () => {
    let invalidToken: 'invalid';
    expect(() => {
      requestQuizRestorev2(quiz.quizId, invalidToken);
    }).toThrow(HTTPError[401]);
  });
  test.skip('Valid token is provided, but user is not an owner of this quiz', () => {
    requestQuizRemovev2(quiz.quizId, user1.token);
    expect(() => {
      requestQuizRestorev2(quiz.quizId, user2.token);
    }).toThrow(HTTPError[403]);
  });
});
