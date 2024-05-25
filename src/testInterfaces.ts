import request, { HttpVerb } from 'sync-request-curl';
import { port, url } from './config.json';
// import { Question } from './dataStore';
import { IncomingHttpHeaders } from 'http';
import HTTPError from 'http-errors';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 10000;

export function sleepSync(ms: number) {
  const startTime = new Date().getTime();
  while (new Date().getTime() - startTime < ms) {
    // zzzZZ - comment needed so eslint doesn't complain
  }
}

// frameworks for use in test.ts
export interface QuizReturn {
  quizId: number;
}

export interface UserReturn {
  token: string;
}

interface QuizTest {
  name: string;
  description: string;
}

interface UserRegister {
  email: string;
  password: string;
  nameFirst: string;
  nameLast: string;
}

export interface Answer {
  answerId?: number,
  answer: string,
  colour?: string,
  correct: boolean,
}

export interface QuestionInfo {
  answers: Answer[];
}

interface Message {
  [key: string]: Record<never, never>
}
export interface QuizQuestions {
  question: string;
  duration: number;
  points: number;
  answers: Array<Answer>;
  thumbnailURL?: string;
}

export interface Token {
  sessionId: number;
  userId: number;
}

// enum
export enum Action {
  NEXT_QUESTION = 'NEXT_QUESTION',
  SKIP_COUNTDOWN = 'SKIP_COUNTDOWN',
  GO_TO_ANSWER = 'GO_TO_ANSWER',
  GO_TO_FINAL_RESULTS = 'GO_TO_FINAL_RESULTS',
  END = 'END'
}

// data
export const answerSet : Array<Answer[]> = [
  [
    { answer: 'the neighbour', correct: false },
    { answer: 'the butcher', correct: false },
    { answer: 'the police officer', correct: false },
    { answer: 'the postman', correct: true },
    { answer: 'their owner', correct: false }
  ]
];

export const corQuestionCreate: QuizQuestions[] = [
  {
    question: 'Who let the dogs out?',
    duration: 1,
    points: 1,
    answers: answerSet[0]
  }
];

// contain input into authRegister
export const userRegister : UserRegister[] = [
  {
    email: 'Sean@hotmail.com',
    password: 'Passwor1',
    nameFirst: 'Sean',
    nameLast: 'Smith',
  },
  {
    email: 'Sam@hotmail.com',
    password: 'Passwor1',
    nameFirst: 'Sam',
    nameLast: 'Bro',
  },
  {
    email: 'john@yahoo.com',
    password: 'Passwor1',
    nameFirst: 'John',
    nameLast: 'Snow',
  },
];

export const quizCreate : QuizTest[] = [
  {
    name: 'COMP1111',
    description: 'Party time',
  },
  {
    name: 'peach',
    description: 'fruit',
  },
];

export const quizQuestions : QuizQuestions[] = [
  {
    question: 'Who let the dogs out?',
    duration: 2,
    points: 5,
    answers:
    [{ answer: 'the neighbour', correct: false },
      { answer: 'the butcher', correct: false },
      { answer: 'the police officer', correct: false },
      { answer: 'the postman', correct: true },
      { answer: 'their owner', correct: false }]
  },
  {
    question: 'New Question',
    duration: 1,
    points: 1,
    answers: [
      { answer: 'new answer0', correct: false },
      { answer: 'new answer1', correct: false },
      { answer: 'new answer2', correct: false },
      { answer: 'new answer3', correct: true },
      { answer: 'new answer4', correct: false }]
  },
];

// it02 functions
export function requestQuestionCreate(token: string, questionBody: object, quizId: number) {
  const response = request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/`, {
    json: { token, questionBody }
  });

  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body as string)
  };
}

export function requestQuestionMove(token: string, newPosition: number, quizId: number, questionId: number) {
  const response = request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}/move`, {
    json: { token: token, newPosition: newPosition }
  });
  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body as string)
  };
}

export function requestQuizCreate(message: object) {
  const res = request('POST', `${SERVER_URL}/v1/admin/quiz`,
    { json: message });

  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body as string)
  };
}

export const requestQuizInfo = (token: string | number, quizid: number) => {
  const res = request('GET', `${SERVER_URL}/v1/admin/quiz/${quizid}`, {
    qs: { token }
  });

  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body as string)
  };
};

export function requestQuizList(token: string) {
  const response = request('GET', `${SERVER_URL}/v1/admin/quiz/list`, {
    qs: { token }
  });
  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body as string)
  };
}

export const requestQuizTrashView = (token: string) => {
  const response = request('GET', `${SERVER_URL}/v1/admin/quiz/trash`, {
    qs: { token }
  });

  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body as string)
  };
};

export const requestQuizNameUpdate = (token: string, quizid: number, name: string) => {
  const response = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizid}/name`, {
    json: { token, name }
  });

  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body as string)
  };
};

export const requestQuizDescriptionUpdate = (token: string, quizid: number, description: string) => {
  const response = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizid}/description`, {
    json: { token, description }
  });

  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body as string)
  };
};

export const requestQuestionEdit = (token: string, quizId: number, questionId: number, questionBody: object) => {
  const response = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
    json: { token, questionBody }
  });

  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body as string)
  };
};

export function requestDeleteQuiz(token: string, quizId: number) {
  const response = request('DELETE', `${SERVER_URL}/v1/admin/quiz/${quizId}`, {
    json: { token }
  });

  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body as string)
  };
}

export function requestUserRegister(message: object) {
  const res = request('POST', `${SERVER_URL}/v1/admin/auth/register`,
    { json: message });

  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body as string)
  };
}

export function requestUserDetails(token: string) {
  const response = request('GET', `${SERVER_URL}/v1/admin/user/details`, {
    json: { token }
  });
  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body as string)
  };
}

export function requestUserPasswordUpdate(token: string, oldPassword: string, newPassword: string) {
  const res = request('PUT', `${SERVER_URL}/v1/admin/user/password`,
    { json: { token, oldPassword, newPassword } });

  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body as string)
  };
}

export function requestUserLogin(message: object) {
  const res = request('POST', `${SERVER_URL}/v1/admin/auth/login`,
    { json: message });

  const finalRes = JSON.parse(res.body as string);
  return finalRes;
}

export function requestUserLogout(token: string) {
  const response = request('POST', `${SERVER_URL}/v1/admin/auth/logout`,
    { json: { token } });
  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body as string)
  };
}

export function requestSendQuizToTrash(quizId: number, token: string) {
  const url = `${SERVER_URL}/v1/admin/quiz/${quizId}?token=${token}`;
  const res = request('DELETE', url);
  const finalRes = JSON.parse(res.body as string);
  return finalRes;
}

// ITERATION 3 FUNCTIONS

/**
 * Helper function from lab08_quiz
 */
function requestHelper(
  method: HttpVerb,
  path: string,
  message: Message,
  headers: IncomingHttpHeaders = {}
) {
  let qs = {};
  let json = {};
  if (['GET', 'DELETE'].includes(method.toUpperCase())) {
    qs = message;
  } else {
    // PUT/POST
    json = message;
  }

  const res = request(method, SERVER_URL + path, { qs, json, headers, timeout: TIMEOUT_MS });

  let theResponse;

  try {
    theResponse = JSON.parse(res.body.toString());
  } catch (e) {
    if (res.statusCode === 200) {
      throw HTTPError(500, 'Non-jsonifiable body');
    }
    theResponse = { error: `Failed to parse JSON: '${e.message}'` };
  }

  const errorMessage = `[${res.statusCode}] ` + theResponse?.error || theResponse || 'No message specified!';

  if (res.statusCode !== 200) {
    throw HTTPError(res.statusCode, errorMessage);
  }
  return theResponse;
}

// it02 ADMIN AUTH helpers
export function requestUserDetailsv2(token: IncomingHttpHeaders) {
  return requestHelper('GET', '/v2/admin/user/details', {}, token);
}

export function requestUserDetailsUpdatev2(token: IncomingHttpHeaders, email: string, nameFirst: string, nameLast: string) {
  return requestHelper('PUT', '/v2/admin/user/details', { email, nameFirst, nameLast }, token);
}

export function requestQuizRemovev2(quizId: number, token: string) {
  const headers = { token: token };
  return requestHelper('DELETE', `/v2/admin/quiz/${quizId}`, {}, headers);
}

export function requestQuizRestorev2(quizId: number, token: string) {
  const headers = { token: token };
  return requestHelper('POST', `/v2/admin/quiz/${quizId}/restore`, {}, headers);
}

export function requestUserLogoutv2(token: IncomingHttpHeaders) {
  return requestHelper('POST', '/v2/admin/auth/logout', {}, token);
}

export function requestUserPasswordv2(token: IncomingHttpHeaders,
  oldPassword: string, newPassword: string) {
  return requestHelper('PUT', '/v2/admin/user/password',
    { oldPassword, newPassword }, token);
}

export function requestQuizCreatev2(token: IncomingHttpHeaders, name: string, description: string) {
  return requestHelper('POST', '/v2/admin/quiz', { name, description }, token);
}

export function requestQuizInfov2(token: IncomingHttpHeaders, quizId: number) {
  return requestHelper('GET', `/v2/admin/quiz/${quizId}`,
    {}, token);
}

export function requestQuizListv2(token: IncomingHttpHeaders) {
  return requestHelper('GET', '/v2/admin/quiz/list',
    {}, token);
}

export function requestQuizzesInTrashv2(token: string) {
  const headers = { token: token };
  return requestHelper('GET', '/v2/admin/quiz/trash', {}, headers);
}

export function requestQuizEmptyTrashv2(token: string, quizIds: number[]) {
  const headers = { Authorization: `Bearer ${token}` };
  const message = {
    quizIds: JSON.stringify(quizIds)
  };
  return requestHelper('DELETE', '/v2/admin/quiz/trash/empty', message, headers);
}

export function requestQuizQuestionCreatev2(token: IncomingHttpHeaders, quizId: number, message: Message) {
  const { questionBody } = message;
  return requestHelper('POST', `/v2/admin/quiz/${quizId}/question`,
    { questionBody }, token);
}

export function requestQuizQuestionEditv2(token: IncomingHttpHeaders, quizId: number, questionId: number, message: Message) {
  const { questionBody } = message;
  return requestHelper('PUT', `/v2/admin/quiz/${quizId}/question/${questionId}`,
    { questionBody }, token);
}

export function requestQuizQuestionDuplicatev2(token: IncomingHttpHeaders, quizId: number, questionId: number) {
  return requestHelper('POST', `/v2/admin/quiz/${quizId}/question/${questionId}/duplicate`,
    {}, token);
}

export function requestQuestionMovev2(token: IncomingHttpHeaders, quizId: number, questionId: number, newPosition: number) {
  return requestHelper('PUT', `/v2/admin/quiz/${quizId}/question/${questionId}/move`,
    { newPosition }, token);
}

export function requestQuizQuestionDeletev2(token: IncomingHttpHeaders, quizId: number, questionId: number) {
  return requestHelper('DELETE', `/v2/admin/quiz/${quizId}/question/${questionId}`,
    {}, token);
}

export function requestSessionCreate(token: IncomingHttpHeaders, quizId: number, autoStartNum: number) {
  return requestHelper('POST', `/v1/admin/quiz/${quizId}/session/start`,
    { autoStartNum }, token);
}

export function requestSessionStatus(token: IncomingHttpHeaders, quizId: number, sessionId: number) {
  return requestHelper('GET', `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    {}, token);
}

export function requestSessionUpdate(token: IncomingHttpHeaders, quizId: number, message: Message, sessionId: number) {
  const { action } = message;
  return requestHelper('PUT', `/v1/admin/quiz/${quizId}/session/${sessionId}`,
    { action }, token);
}

export function requestPlayerJoin(name: string, sessionId: number) {
  return requestHelper('POST', '/v1/player/join',
    { name, sessionId });
}

export function requestPlayerStatus(playerId: number) {
  return requestHelper('GET', `/v1/player/${playerId}`, {});
}

export function requestQuizSessions(token: string, quizId: number) {
  const response = request('GET', `${SERVER_URL}/v1/admin/quiz/${quizId}/sessions`, {
    headers: { token: token }
  });
  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body.toString())
  };
}

export function requestPlayerQuestionInfo(playerId: number, questionPosition: number) {
  return requestHelper('GET', `/v1/player/${playerId}/question/${questionPosition}`, {});
}

export function requestPlayerSendChat(playerId: number, theMessage: string) {
  return requestHelper('POST', `/v1/player/${playerId}/chat`, { message: { messageBody: theMessage } });
}

export const requestChat = (playerid: number) => {
  const res = request('GET', `${SERVER_URL}/v1/player/${playerid}/chat`);
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body as string)
  };
};

export const requestSessionFinalResults = (quizId: number, sessionId: number, token: string) => {
  const res = request('GET', `${SERVER_URL}/v1/admin/quiz/${quizId}/session/${sessionId}/results`, {
    headers: { token: token }
  });
  return {
    statusCode: res.statusCode,
    body: JSON.parse(res.body as string)
  };
};

export function requestPlayerSubmitAnswer(playerId: number, questionPosition: number, answerIds: number[]) {
  return requestHelper('PUT', `/v1/player/${playerId}/question/${questionPosition}/answer`, { answerIds });
}

export function requestResultsForQuestion(playerId: number, questionPosition: number) {
  return requestHelper('GET', `/v1/player/${playerId}/question/${questionPosition}/results`, {});
}

export function requestSessionActivity(token: IncomingHttpHeaders, quizId: number) {
  return requestHelper('GET', `/v1/admin/quiz/${quizId}/sessions`,
    {}, token);
}

export function requestQuizThumbnailUpdate(token: IncomingHttpHeaders, quizId: number, url: Message) {
  const { imgUrl } = url;
  return requestHelper('PUT', `/v1/admin/quiz/${quizId}/thumbnail`, { imgUrl }, token);
}
