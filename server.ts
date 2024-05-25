import express, { json, Request, Response } from 'express';
import { echo } from './newecho';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import errorHandler from 'middleware-http-errors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path /* { parse } */ from 'path';
// import HTTPError from 'http-errors';
import process from 'process';
import {
  adminAuthLogin,
  adminAuthRegister,
  adminUserDetails,
  adminAuthLogout,
  adminUserDetailsUpdate,
  adminUserPasswordUpdate
} from './auth';
import {
  adminUserDetailsv2,
  adminUserDetailsUpdatev2,
  adminAuthLogoutv2,
  adminUserPasswordUpdatev2,
} from './auth.v2';
import {
  adminQuizCreate,
  adminQuizList,
  adminQuizInfo,
  adminQuizTransfer,
  adminQuizRestore,
  adminQuizNameUpdate,
  adminQuizDescriptionUpdate,
  adminQuizzesInTrash,
  adminQuizemptyTrash,
  adminQuizCreateQuestion,
  adminQuizDuplicateQuestion,
  adminQuizMoveQuestion,
  adminQuizDeleteQuestion,
  adminQuizEditQuestion,
  adminQuizRemove,
} from './quiz';

import {
  adminQuizCreatev2,
  adminQuizRemovev2,
  adminQuizInfov2,
  adminQuizListv2,
  adminQuizNameUpdatev2,
  adminQuizQuestionCreatev2,
  adminQuizQuestionEditv2,
  adminQuizQuestionDuplicatev2,
  adminQuizQuestionDeletev2,
  adminQuizMoveQuestionv2,
  adminQuizzesInTrashv2,
  adminQuizemptyTrashv2,
  adminQuizRestorev2,
  adminQuizSessionCreate,
  adminQuizSessionUpdate,
  adminQuizSessionStatus,
  adminQuizSessionActivity,
  sessionResults,
  playerJoin,
  playerStatus,
  playerSendChat,
  playerChat,
  playerQuestionInfo,
  playerQuestionResults,
  playerSubmitAnswer,
} from './quiz.v2';

import { clear, decoding, decodeUserId } from './other';
import { getData } from './dataStore';
// import { UserReturn } from './testInterfaces';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));
// for producing the docs that define the API
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use('/docs', sui.serve, sui.setup(YAML.parse(file), { swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' } }));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || 'localhost';

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const data = req.query.echo as string;
  return res.json(echo(data));
});

app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  // For PUT/POST requests, data is transfered through the JSON body and will always be of the correct type.
  const { email, password, nameFirst, nameLast } = req.body;

  const response = adminAuthRegister(email, password, nameFirst, nameLast);

  if ('error' in response) {
    return res.status(400).json(response);
  }

  res.json({ token: response.token });
});

app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  // For PUT/POST requests, data is transfered through the JSON body and will always be of the correct type.
  const { email, password } = req.body;

  const response = adminAuthLogin(email, password);

  if ('error' in response) {
    return res.status(400).json(response);
  }

  res.json({ token: response.token });
});

app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  const { token } = req.body;
  const response = adminAuthLogout(token);
  console.log(token);
  console.log(response);
  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }

  res.json(response);
});

app.delete('/v1/admin/quiz/:quizId', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId);
  const tokenString = req.query.token as string;
  const userId = decodeUserId(tokenString);
  const response = adminQuizRemove(userId, quizId);
  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }

  res.json(response);
});

// Example get request
app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  const tokenString = req.query.token as string;
  /* if (tokenString === undefined) {
    return res.status(401).json({ error: 'Invalid user Id' });
  }

  const theToken = decoding(tokenString); */

  const theToken = decodeUserId(tokenString);

  const response = adminUserDetails(theToken);

  if ('error' in response) {
    return res.status(401).json(response);
  }

  res.json(response);
});

app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  const { token, email, nameFirst, nameLast } = req.body;
  const theToken = decodeUserId(token);
  const response =
    adminUserDetailsUpdate(theToken, email, nameFirst, nameLast);

  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }

  res.json(response);
});

app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  const { token, oldPassword, newPassword } = req.body;
  const response = adminUserPasswordUpdate(token, oldPassword, newPassword);
  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }

  res.json(response);
});

app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  const { token, name, description } = req.body;
  const theToken = decodeUserId(token);
  const response = adminQuizCreate(theToken, name, description);
  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }
  res.json(response);
});

app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  const token = req.query.token as string;
  const userId = decodeUserId(token);
  const response = adminQuizList(userId);
  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }
  res.json(response);
});

app.get('/v1/admin/quiz/trash', (req, res) => {
  const tokenString = req.query.token as string;
  const response = adminQuizzesInTrash(tokenString);

  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }

  res.json(response);
});

app.get('/v1/admin/quiz/:quizid/', (req: Request, res: Response) => {
  let thisQuizId = parseInt(req.params.quizid);
  if (thisQuizId === undefined) {
    thisQuizId = -1;
  }

  const tokenString = req.query.token as string;
  const theToken = decodeUserId(tokenString);

  if (theToken === undefined) {
    return res.status(401).json({ error: 'invalid token' });
  }

  // const theToken = decoding(tokenString);
  const response = adminQuizInfo(theToken, thisQuizId);

  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }
  res.json(response);
});

app.put('/v1/admin/quiz/:quizId/name', (req: Request, res:Response) => {
  const quizId = parseInt(req.params.quizId);
  const { name, token } = req.body;
  const userId = decodeUserId(token);
  if (userId === undefined) {
    return res.status(401).json({ error: 'Token is invalid' });
  }
  const response = adminQuizNameUpdate(userId, quizId, name);

  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  } else if (!isTokenValid) {
    return res.status(401).json(response);
  }
  res.json(response);
});

app.put('/v1/admin/quiz/:quizId/description', (req: Request, res:Response) => {
  const quizId = parseInt(req.params.quizId);
  const { token, description } = req.body;
  const userId = decodeUserId(token);
  if (userId === undefined) {
    return res.status(401).json({ error: 'Token is invalid' });
  }
  const response = adminQuizDescriptionUpdate(userId, quizId, description);

  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }
  res.json(response);
});

app.delete('/v1/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const tokenString = req.query.token as string;
  const quizIds: number[] = JSON.parse(req.query.quizIds as string);
  const response = adminQuizemptyTrash(tokenString, quizIds);

  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }

  res.status(200).json({});
});

app.post('/v1/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const thisQuizId = parseInt(req.params.quizid);
  const token = req.body.token;
  const {
    questionBody:
    { question, duration, points, answers }
  } = req.body;

  const theToken = decodeUserId(token);
  const response = adminQuizCreateQuestion(thisQuizId, theToken, question, duration, points, answers);

  // mock function, this needs to be fixed
  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }

  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/question/:questionId/move', (req: Request, res: Response) => {
  let quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionId);
  if (quizId === undefined) {
    quizId = -1;
  }

  const { token, newPosition } = req.body;

  if (!isTokenValid(token)) {
    return res.status(401).json({ error: 'Invalid Token' });
  }

  const userId = decodeUserId(token);
  const response = adminQuizMoveQuestion(quizId, userId, questionId, newPosition);

  // mock function, this needs to be fixed
  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }

  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/question/:questionId', (req: Request, res: Response) => {
  const thisQuizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionId);

  console.log(req.body);
  const {
    token, questionBody:
    { question, duration, points, answers }
  } = req.body;

  const theUserId = decodeUserId(token);
  const response = adminQuizEditQuestion(thisQuizId, theUserId, questionId, question, duration, points, answers);

  // mock function, this needs to be fixed
  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }

  if (!isTokenValid(token)) {
    return res.status(401).json({ error: 'Invalid Token' });
  }
  res.json(response);
});

app.post('/v1/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const thisQuizId = parseInt(req.params.quizid);
  const theQuestionId = parseInt(req.params.questionid);
  const { token } = req.body;
  const theToken = decodeUserId(token);
  const response = adminQuizDuplicateQuestion(thisQuizId, theToken, theQuestionId);

  // mock function, this needs to be fixed
  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }

  res.json(response);
});

app.delete('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const thisQuizId = parseInt(req.params.quizid);
  const theQuestionId = parseInt(req.params.questionid);
  const tokenString = req.query.token as string;
  const theToken = decodeUserId(tokenString);
  const response = adminQuizDeleteQuestion(thisQuizId, theToken, theQuestionId);

  // mock function, this needs to be fixed
  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }

  res.json(response);
});

app.delete('/v1/clear', (req: Request, res: Response) => {
  const response = clear();
  res.status(200).json(response);
});

app.post('/v1/admin/quiz/:quizid/transfer/', (req: Request, res: Response) => {
  if (req.body.token === undefined) {
    return res.status(401).json({ error: 'Invalid Token' });
  }
  const theToken = decoding(req.body.token);
  const theUserId = theToken.userId;
  const thisQuizId = parseInt(req.params.quizid);
  const thisEmail = req.body.userEmail;
  const response = adminQuizTransfer(thisQuizId, theUserId, thisEmail);
  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }

  res.json(response);
});

app.post('/v1/admin/quiz/:quizid/restore/', (req: Request, res: Response) => {
  if (req.body.token === undefined) {
    return res.status(401).json({ error: 'Invalid Token' });
  }
  const theToken = decoding(req.body.token);
  const theUserId = theToken.userId;
  const thisQuizId = parseInt(req.params.quizid);
  const response = adminQuizRestore(thisQuizId, theUserId);
  if ('error' in response) {
    return res.status(response.errornum).json({ error: response.error });
  }
  res.json(response);
});

app.delete('/v1/clear', (req: Request, res: Response) => {
  const response = clear();
  res.status(200).json(response);
});

// V2 - ITERATION 2 MODIFIED
app.delete('/v2/admin/quiz/:quizId', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId);
  const userId = decodeUserId(req.header('token'));
  const response = adminQuizRemovev2(userId, quizId);
  res.json(response);
});

app.post('/v2/admin/quiz/:quizid/restore/', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizId);
  const userId = decodeUserId(req.header('token'));
  const response = adminQuizRestorev2(userId, quizId);
  res.json(response);
});

app.get('/v2/admin/quiz/trash', (req, res) => {
  const tokenString = req.header('token');
  if (!tokenString) {
    return res.status(401).json({ error: 'Token is empty or invalid' });
  }

  try {
    const response = adminQuizzesInTrashv2(tokenString);
    res.json(response);
  } catch (error) {
    if (error.statusCode && error.message) {
      return res.status(error.statusCode).json({ error: error.message });
    }
  }
});

app.delete('/v2/admin/quiz/trash/empty', (req: Request, res: Response) => {
  const tokenString = req.header('token');
  if (!tokenString) {
    return res.status(401).json({ error: 'Token is empty or invalid' });
  }

  let quizIds: number[];
  try {
    quizIds = JSON.parse(req.query.quizIds as string);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid quiz IDs format' });
  }

  try {
    adminQuizemptyTrashv2(tokenString, quizIds);
    res.status(200).json({});
  } catch (error) {
    if (error.statusCode && error.message) {
      return res.status(error.statusCode).json({ error: error.message });
    }
  }
});

app.get('/v2/admin/user/details', (req: Request, res: Response) => {
  const theToken = decodeUserId(req.header('token'));
  res.json(adminUserDetailsv2(theToken));
});

app.put('/v2/admin/user/details', (req: Request, res: Response) => {
  const { email, nameFirst, nameLast } = req.body;
  const theToken = decodeUserId(req.header('token'));
  const response = adminUserDetailsUpdatev2(theToken, email, nameFirst, nameLast);
  res.json(response);
});

app.get('/v2/admin/quiz/list', (req: Request, res: Response) => {
  const theToken = decodeUserId(req.header('token'));
  res.json(adminQuizListv2(theToken));
});

app.post('/v2/admin/quiz', (req: Request, res: Response) => {
  const theToken = decodeUserId(req.header('token'));
  const { name, description } = req.body;
  const response = adminQuizCreatev2(theToken, name, description);
  res.json(response);
});

app.put('/v2/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  const userId = decodeUserId(req.header('token'));
  const quizid = parseInt(req.params.quizid);
  const { name } = req.body;
  res.json(adminQuizNameUpdatev2(userId, quizid, name));
});

app.get('/v2/admin/quiz/:quizid', (req: Request, res: Response) => {
  const theToken = decodeUserId(req.header('token'));
  const quizId = parseInt(req.params.quizid);
  res.json(adminQuizInfov2(theToken, quizId));
});

app.post('/v2/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  const theToken = decodeUserId(req.header('token'));
  const quizId = parseInt(req.params.quizid);
  const { questionBody: { question, duration, points, answers, thumbnailURL } } = req.body;
  res.json(adminQuizQuestionCreatev2(quizId, theToken, question, duration,
    points, answers, thumbnailURL));
});

app.post('/v2/admin/quiz/:quizid/question/:questionid/duplicate', (req: Request, res: Response) => {
  const theToken = decodeUserId(req.header('token'));
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);

  res.json(adminQuizQuestionDuplicatev2(theToken, quizId, questionId));
});

app.put('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const theToken = decodeUserId(req.header('token'));
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const { questionBody: { question, duration, points, answers, thumbnailURL } } = req.body;
  res.json(adminQuizQuestionEditv2(quizId, theToken, questionId, question, duration, points, answers, thumbnailURL));
});

app.put('/v2/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  const { newPosition } = req.body;
  const userId = decodeUserId(req.header('token'));
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);
  const response = adminQuizMoveQuestionv2(quizId, userId, questionId, newPosition);
  res.json(response);
});

app.delete('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  const theToken = decodeUserId(req.header('token'));
  const quizId = parseInt(req.params.quizid);
  const questionId = parseInt(req.params.questionid);

  res.json(adminQuizQuestionDeletev2(theToken, quizId, questionId));
});

// ITERATION 3 V1 FUNCTIONS

app.get('/v1/admin/quiz/:quizid/sessions', (req: Request, res: Response) => {
  const theToken = decodeUserId(req.header('token'));
  const quizId = parseInt(req.params.quizid);
  res.json(adminQuizSessionActivity(theToken, quizId));
});

app.post('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);

  if (isNaN(playerId)) {
    return res.status(400).json({ error: 'Invalid player ID' });
  }

  const { message: { messageBody } } = req.body;

  try {
    const response = playerSendChat(playerId, messageBody);
    res.json(response);
  } catch (error) {
    if (error.statusCode && error.message) {
      return res.status(error.statusCode).json({ error: error.message });
    }
  }
});

app.get('/v1/player/:playerid/chat', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const response = playerChat(playerId);
  res.json(response);
});

app.post('/v1/admin/quiz/:quizid/session/start', (req: Request, res: Response) => {
  const { autoStartNum } = req.body;
  const quizId = parseInt(req.params.quizid);
  const userId = decodeUserId(req.header('token'));
  const response = adminQuizSessionCreate(userId, quizId, autoStartNum);

  res.json(response);
});

app.put('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  // TODO: make req.body look cleaner
  // input req.body contains message: action:
  const { action } = req.body;
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);
  const userId = decodeUserId(req.header('token'));
  const response = adminQuizSessionUpdate(userId, quizId, sessionId, action);

  res.json(response);
});

app.post('/v1/player/join', (req: Request, res: Response) => {
  const { name, sessionId } = req.body;
  const response = playerJoin(sessionId, name);
  res.json(response);
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);

  const userId = decodeUserId(req.header('token'));

  res.json(adminQuizSessionStatus(userId, quizId, sessionId));
});

app.get('/v1/player/:playerid', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);

  res.json(playerStatus(playerId));
});

app.get('/v1/player/:playerid/question/:questionposition', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);

  res.json(playerQuestionInfo(playerId, questionPosition));
});

app.get('/v1/admin/quiz/:quizid/session/:sessionid/results', (req: Request, res: Response) => {
  const quizId = parseInt(req.params.quizid);
  const sessionId = parseInt(req.params.sessionid);
  const userId = decodeUserId(req.header('token'));
  res.json(sessionResults(quizId, sessionId, userId));
});

app.put('/v1/player/:playerid/question/:questionposition/answer', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);
  const answerIds = req.body.answerIds;

  if (isNaN(playerId) || isNaN(questionPosition)) {
    return res.status(400).json({ error: 'Invalid player ID or question position' });
  }

  if (!Array.isArray(answerIds) || answerIds.length === 0) {
    return res.status(400).json({ error: 'Invalid or missing answer IDs' });
  }
  res.json(playerSubmitAnswer(playerId, questionPosition, answerIds));
});

app.get('/v1/player/:playerid/question/:questionposition/results', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid);
  const questionPosition = parseInt(req.params.questionposition);

  res.json(playerQuestionResults(playerId, questionPosition));
});

app.post('/v2/admin/auth/logout', (req: Request, res: Response) => {
  const userId = decodeUserId(req.header('token'));
  res.json(adminAuthLogoutv2(userId));
});

app.put('/v2/admin/user/password', (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  res.json(adminUserPasswordUpdatev2(req.header('token'), oldPassword, newPassword));
});

/**
  * returns true if token exists in dataStore,
  * @param {string}  token - the token string input
  * @returns {boolean}
*
*/
function isTokenValid(token: string): boolean {
  const data = getData();
  const targetToken = data.tokens.find((t: string) => t === token);
  if (targetToken === undefined) {
    return false;
  }

  return true;
}

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

app.use((req: Request, res: Response) => {
  const error = `
    404 Not found - This could be because:
      0. You have defined routes below (not above) this middleware in server.ts
      1. You have not implemented the route ${req.method} ${req.path}
      2. There is a typo in either your test or server, e.g. /posts/list in one
         and, incorrectly, /post/list in the other
      3. You are using ts-node (instead of ts-node-dev) to start your server and
         have forgotten to manually restart to load the new changes
      4. You've forgotten a leading slash (/), e.g. you have posts/list instead
         of /posts/list in your server.ts or test file
  `;
  res.status(404).json({ error });
});

// For handling errors
app.use(errorHandler());

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => console.log('Shutting down server gracefully.'));
});
