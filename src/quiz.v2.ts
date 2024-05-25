import {
  Question,
  Quiz,
  QuizBrief,
  ErrorObject,
  Answer,
  getData,
  setData,
  Player,
  QuizResponse,
  User,
  Message,
  Session,
  SessionActions,
  SessionStates,
  SessionActivity,
  // QuestionResults,
  // PlayerResults,
} from './dataStore';

import {
  isValidUserAndQuizOwner,
  answersLengthDuplication,
  correctAnswers,
  pushObject,
} from './quiz';

import { randomNum, decoding, tokenValid } from './other';
import HTTPError from 'http-errors';
import createHttpError from 'http-errors';

/**
 * Given basic details about a new quiz, create one for the logged in user.
 * @param {number} authUserId
 * @param {string} name
 * @param {string} description
 * @returns {{quizId: number}}}
*/

export function adminQuizCreatev2(authUserId: number, name: string,
  description: string): {quizId: number} {
  const store = getData();
  const quizStore = store.quizzes;

  // Check if authUser is valid
  // Changed from (!adminUserDetails)
  const theUser = store.users.find(
    (theUserId: User) => theUserId.userId === authUserId
  );

  if (theUser === undefined) {
    throw createHttpError(401, 'Token is invalid');
  }

  // check validity of name
  const allowedCharacters = /^[a-zA-Z0-9\s]+$/;
  if (!allowedCharacters.test(name)) {
    throw createHttpError(400, 'Name contains invalid characters');
  }

  // Check length of name
  if (name.length < 3 || name.length > 30) {
    throw createHttpError(400, 'Name is either less than 3 characters long or more than 30 characters long');
  }
  // Check if name is already used by the current logged in user for another quiz

  // Check length of description
  if (description.length > 100) {
    throw createHttpError(400, 'Description is more than 100 characters in length');
  }

  if (store.quizzes.filter((q) => q.name === name && q.userId === authUserId).length > 0) {
    throw createHttpError(400, 'Quiz name already exists');
  }

  const d = new Date();
  const time = d.getTime();
  const newQuizId = quizStore.length + 1;
  const questions : Question[] = [];
  const newUserId: Quiz = {
    userId: authUserId,
    quizId: newQuizId,
    name: name,
    timeCreated: time,
    timeLastEdited: 1,
    description: description,
    numQuestions: 0,
    duration: 0,
    questions: questions,
    thumbnailURL: '',
    isTrashed: false
  };
  store.quizzes.push(newUserId);
  setData(store);

  return {
    quizId: newQuizId,
  };
}

/**
 * Edit a quiz question in a valid quiz
 * @param {number} quizId
 * @param {number} userId
 * @param {number} questionId,
 * @param {string} question name
 * @param {number} duration
 * @param {number} points
 * @param {Answer[]} Answer[]
 * @returns {questionId: questionId}
*/
export function adminQuizQuestionEditv2 (quizId: number, authUserId: number, questionId: number,
  theQuestion: string, theDuration: number, thePoints: number, theAnswers: Answer[], thumbnailURL: string
): {questionId: number} | ErrorObject {
  const data = getData();
  const user = data.users.find((u) => u.userId === authUserId);

  if (user === undefined) {
    throw createHttpError(401, 'Invalid Token');
  }

  const theQuiz = data.quizzes.find((qid) => qid.quizId === quizId && qid.userId === authUserId);
  if (theQuiz === undefined) {
    throw createHttpError(403, 'QuizId is not owned by user');
  }
  let question = theQuiz.questions.find((q: Question) => q.questionId === questionId);
  if (question === undefined) {
    throw createHttpError(400, 'Question Id does not refer to a valid question');
  }
  // Check whether question string lenght is valid
  if (theQuestion.length < 5 || theQuestion.length > 50) {
    throw createHttpError(400, 'Question string is less than 5 characters in length or greater' +
    ' than 50 characters in length');
  }
  // Check number of answers
  if (theAnswers.length < 2 || theAnswers.length > 6) {
    throw createHttpError(400, 'The question has more than 6 answers or less than 2 answers');
  }
  // Check question duration
  if (theDuration < 1) {
    throw createHttpError(400, 'The question duration is not a positive number');
  }
  // Check sum of question durations
  if (theQuiz.duration - question.duration + theDuration > 180) {
    throw createHttpError(400, 'The sum of the question durations in the quiz exceeds 3 minutes');
  }
  // Check points awarded
  if (thePoints < 1 || thePoints > 10) {
    throw createHttpError(400, 'Points awarded are less than 1 or greater than 10');
  }
  // Check answers lenght, duplication and whether there's at least 1 correct
  if (answersLengthDuplication(theAnswers) === 1) {
    throw createHttpError(400, 'Answers have to be within 1 and 30 characters long');
  }
  if (answersLengthDuplication(theAnswers) === 2) {
    throw createHttpError(400, 'Answers are duplicated');
  }
  if (correctAnswers(theAnswers) === 0) {
    throw createHttpError(400, 'There are no correct answers');
  }

  // update quiz Duration
  theQuiz.duration = theQuiz.duration - question.duration + theDuration;
  const toPush = pushObject(theQuestion, theDuration, thePoints, theAnswers, thumbnailURL);
  question = toPush;
  theQuiz.timeLastEdited = new Date().getTime();
  setData(data);

  return { questionId: toPush.questionId };
}

/**
* Provide a list of all quizzes that are owned by the currently logged in user.
* @param {number} authUserId
* @returns { quizzes: [
  *    {
  *      quizId,
  *      name,
  *    }
  *  ]
  * }
*/

export function adminQuizListv2(userId: number): { quizzes: QuizBrief[] } | ErrorObject {
  const store = getData();
  const user = store.users.find((u) => u.userId === userId);

  if (user === undefined) {
    throw createHttpError(401, 'Invalid Token');
  }

  const quizzesReturn: QuizBrief[] = [];
  const quizzes = store.quizzes.filter((q) => q.userId === userId && q.isTrashed === false);
  for (const quiz of quizzes) {
    quizzesReturn.push(
      {
        quizId: quiz.quizId,
        name: quiz.name
      }
    );
  }

  return { quizzes: quizzesReturn };
}

/**
 * Returns empty object. Changes the name of the quiz that the user owns.
 * @param {number} authUserId - userId of the user
 * @param {number} quizId - quizId of the quiz
 * @param {string} name - name to change quiz.name to
 * @returns {} - empty object
*
*/
export function adminQuizNameUpdatev2(authUserId: number, quizId: number, name: string): Record<string, never> | ErrorObject {
  const dataStore = getData();
  // error messages
  const quizzes = dataStore.quizzes.filter((q) => q.userId === authUserId);
  const quiz = quizzes.find((q) => q.quizId === quizId);

  if (quiz === undefined) {
    throw createHttpError(403, 'Quiz is valid, but user is not the owner of this quiz');
  }

  // Changed name to include space as valid character
  const allowedCharacters = /^[a-zA-Z0-9\s]*$/;
  if (!allowedCharacters.test(name)) {
    throw createHttpError(400, 'Name contains invalid characters');
  }

  if (name.length < 3 || name.length > 30) {
    throw createHttpError(400, 'Name length is <3 or >30');
  }

  if (quizzes.findIndex((q) => q.name === name) !== -1) {
    throw createHttpError(400, 'QuizName is already in use by this user');
  }

  quiz.name = name;
  setData(dataStore);
  return {};
}

/**
* Given a particular quiz, send it to the trash (can be recovered later)
* @param {number} userId
* @param {number} quizId
* @returns { Record<string, never> | ErrorObject }
*/
export function adminQuizRemovev2(userId: number, quizId: number): Record<string, never> | ErrorObject {
  const data = getData();

  const ownerCheck = isValidUserAndQuizOwner(userId, quizId);
  if (ownerCheck === 2) {
    throw HTTPError(403, 'Quiz ID does not refer to a quiz that this user own');
  }

  // Check whether quiz is valid
  const theQuiz = data.quizzes.find((qid: Quiz) => qid.quizId === quizId);
  if (!theQuiz) {
    throw HTTPError(400, 'Quiz Id does not refer to a valid quiz');
  }

  // Check that all sessions are in the END state using adminQuizSessionActivity
  const sessionActivity = adminQuizSessionActivity(userId, quizId);

  // If there are active sessions, throw an error
  if (!('error' in sessionActivity) && sessionActivity.activeSessions.length > 0) {
    throw HTTPError(400, 'All sessions for this quiz must be in END state');
  }

  // Mark the quiz as trashed and update the timeLastEdited.
  theQuiz.isTrashed = true;
  theQuiz.timeLastEdited = Date.now();

  setData(data);

  return {};
}

/**
 * View the quizzes that are currently in the trash for the logged in user
 * @param { string } token
 * @returns {QuizResponse}
 * @throws {HTTPError}
 */

export function adminQuizzesInTrashv2(token: string): QuizResponse {
  if (!tokenValid(token)) {
    throw HTTPError(401, 'Invalid token');
  }

  const decodedToken = decoding(token);
  if (!decodedToken) {
    throw HTTPError(401, 'Invalid token');
  }

  const userId = decodedToken.userId;
  const store = getData();
  const trashedQuizzes = store.quizzes.filter(quiz =>
    quiz.isTrashed === true && quiz.userId === userId
  );
  const trashedQuizBriefs = trashedQuizzes.map(quiz => ({
    quizId: quiz.quizId,
    name: quiz.name,
  }));

  return { quizzes: trashedQuizBriefs };
}

/**
 * Permanently deletes specific quizzes currently sitting in the trash.
 * @param {number} userId
 * @param {number[]} quizIds (array of quiz id numbers)
 * @returns { {} | ErrorObject }
 */
export function adminQuizemptyTrashv2(token: string, quizIds: number[]): Record<string, never> | ErrorObject {
  // Check if token is valid
  if (!tokenValid(token)) {
    throw HTTPError(401, 'Token is invalid or empty');
  }

  const tokenData = decoding(token);
  const userId = tokenData.userId;

  const data = getData();

  for (const quizId of quizIds) {
    const validationResult = isValidUserAndQuizOwner(userId, quizId);

    if (validationResult === 1) {
      throw HTTPError(403, 'User is invalid');
    }

    if (validationResult === 2) {
      throw HTTPError(403, 'One or more of the Quiz IDs refers to a quiz that this current user does not own');
    }

    const quiz = data.quizzes.find((q: Quiz) => q.quizId === quizId);

    // Check if the quiz is trashed
    if (!quiz.isTrashed) {
      throw HTTPError(400, 'One or more of the Quiz IDs is not currently in the trash');
    }
  }

  // Actually delete the quizzes that are in trash
  data.quizzes = data.quizzes.filter((quiz: Quiz) => !quizIds.includes(quiz.quizId));
  setData(data);

  return {};
}

/**
* Returns empty object. Changes the description of the quiz that the user owns.
* @param {number} quizId - quizId of the quiz
* @param {number} authUserId - userId of the user
* @param {number} autoStartNum - if quiz has autoStart timer
* @returns {sessionId: number | ErrorObject} - sessionId or Error
*/

export const adminQuizSessionCreate = (authUserId: number, quizId: number,
  autoStartNum: number): { sessionId: number } | ErrorObject => {
  if (authUserId === undefined) {
    throw createHttpError(401, 'Invalid Token');
  }

  const data = getData();
  const quiz = data.quizzes.filter((q: Quiz) => q.quizId === quizId).find((q: Quiz) => q.userId === authUserId);
  if (quiz === undefined) {
    throw createHttpError(403, 'Valid token is provided, but user is not an owner of this quiz');
  }

  if (autoStartNum > 50) {
    throw createHttpError(400, 'autoStartNum is a number greater than 50');
  }

  // check if has 10 more sessions, skip if sessions does not exist
  if (quiz.sessions === undefined) {
    console.log('sessions is undefined');
  } else if (quiz.sessions.activeSessions.length >= 10) {
    throw createHttpError(400, 'A maximum of 10 sessions that are not in END state currently exist');
  }

  if (quiz.questions.length === 0) {
    throw createHttpError(400, 'The quiz does not have any questions in it');
  }

  // deep copy object
  const newQ = structuredClone(quiz);
  const { userId, sessions, isTrashed, ...quizClean } = newQ;
  const sessionPush: Session = {
    sessionId: randomNum(),
    state: SessionStates.LOBBY,
    messages: [],
    autoStartNum: autoStartNum,
    players: [],
    metadata: quizClean,
    currQuestion: 0,
  };

  if (quiz.sessions === undefined) {
    quiz.sessions = {
      activeSessions: [sessionPush],
      inactiveSessions: []
    };
  } else {
    quiz.sessions.activeSessions.push(sessionPush);
  }

  setData(data);
  return { sessionId: sessionPush.sessionId };
};

/**
* Returns empty object. Updates the state of the session.
* @param {number} sessionId - sessionId of the quiz
* @param {enum} action - input action
* @returns {Record<string, never>| ErrorObject} - empty object or Error
*/

export const adminQuizSessionUpdate = (authUserId: number, quizId: number, sessionId: number, action: string): Record<string, never> | ErrorObject => {
  if (authUserId === undefined) {
    throw createHttpError(401, 'Invalid Token');
  }

  const data = getData();
  const quiz = data.quizzes.filter((q: Quiz) => q.quizId === quizId).find((q: Quiz) => q.userId === authUserId);
  if (quiz === undefined) {
    throw createHttpError(403, 'Valid token is provided, but user is not an owner of this quiz');
  }

  if (quiz.sessions === undefined) {
    throw createHttpError(400, 'SessionId does not refer to valid session in quiz');
  }

  const session = quiz.sessions.activeSessions.find((s) => s.sessionId === sessionId);
  if (session === undefined) {
    throw createHttpError(400, 'SessionId does not refer to valid session in quiz');
  }

  if (!(action in SessionActions)) {
    throw createHttpError(400, 'Action provided is not a valid Action enum');
  }

  // error check & also valid action
  switch (action) {
    case SessionActions.NEXT_QUESTION:
      if (session.state !== SessionStates.QUESTION_CLOSE &&
        session.state !== SessionStates.ANSWER_SHOW &&
        session.state !== SessionStates.LOBBY) {
        invalidAction(action, session.state);
      }
      // move currQuestion to next question in quiz array
      session.currQuestion = session.currQuestion + 1;
      session.state = SessionStates.QUESTION_COUNTDOWN;

      // setTimeout for transition to QuestionOpen and then QuestionClose
      setTimeout(() => {
        validSetData(authUserId, quizId, sessionId, SessionStates.QUESTION_OPEN);
        // get duration if currPos question is within questions.length
        if (session.currQuestion <= session.metadata.questions.length) {
          const closeQ = session.metadata.questions[session.currQuestion - 1].duration * 1000;
          questionClose(authUserId, quizId, sessionId, closeQ);
        }
      }, 3000);
      break;
    case SessionActions.SKIP_COUNTDOWN:
      if (session.state !== SessionStates.QUESTION_COUNTDOWN) {
        invalidAction(action, session.state);
      }
      session.state = SessionStates.QUESTION_OPEN;
      break;
    case SessionActions.GO_TO_ANSWER:
      if (session.state !== SessionStates.QUESTION_CLOSE &&
        session.state !== SessionStates.QUESTION_OPEN) {
        invalidAction(action, session.state);
      }
      session.state = SessionStates.ANSWER_SHOW;
      break;
    case SessionActions.GO_TO_FINAL_RESULTS:
      if (session.state !== SessionStates.QUESTION_CLOSE &&
        session.state !== SessionStates.ANSWER_SHOW) {
        invalidAction(action, session.state);
      }
      session.state = SessionStates.FINAL_RESULTS;
      break;
    case SessionActions.END:
      session.state = SessionStates.END;
      break;
  }

  setData(data);
  return {};
};

/**
* Returns void. Changes session.state to QUESTION_CLOSE with question.duration
* @param {number} userId
* @param {number} quizId- sessionId of the quiz
* @param {number} sessionId - sessionId of the quiz
* @param {number} ms - milliseconds for when to change
* @returns {void}
*/

const questionClose = (userId: number, quizId: number, sessionId: number, ms: number) => {
  const data = getData();
  // find session
  const quiz = data.quizzes.find((q) => q.userId === userId && q.quizId === quizId);
  if (quiz === undefined) {
    console.log('no quiz owned');
    return;
  }
  const session = quiz.sessions.activeSessions.find((s) => s.sessionId === sessionId);
  if (session === undefined) {
    console.log('no active session');
    return;
  }

  if (session.state !== SessionStates.QUESTION_OPEN) {
    console.log('session not in open state');
    return;
  }

  // check if is in questionOpen state
  setTimeout(() => {
    validSetData(userId, quizId, sessionId, SessionStates.QUESTION_CLOSE);
  }, ms);
};

/**
* Returns void. Changes session.state IF data still exists
* @param {number} userId
* @param {number} quizId- sessionId of the quiz
* @param {number} sessionId - sessionId of the quiz
* @param {enum} - state - Sessionstate type
* @returns {void}
*/
const validSetData = (userId: number, quizId: number, sessionId: number, state: SessionStates) => {
  const data = getData();
  if (data.users.find((u) => u.userId === userId) === undefined) {
    console.log('user does not exist');
    return;
  }
  const quiz = data.quizzes.find((q) => q.userId === userId && q.quizId === quizId);
  if (quiz === undefined) {
    console.log('no quiz owned');
    return;
  }
  const session = quiz.sessions.activeSessions.find((s) => s.sessionId === sessionId);
  if (session === undefined) {
    console.log('no active session');
    return;
  }

  console.log('change success');
  session.state = state;
  setData(data);
};

/**
* Throw createHttpError message if invalid action on session.state
* @param {string} action - input action
* @param {string} state - session state
*/
const invalidAction = (action: string, state: string) => {
  throw createHttpError(400, `${action} action cannot be applied in ${state} state`);
};

/**
* Returns playerId Object. Adds new player to quiz session.
* @param {number} sessionId - sessionId of the quiz
* @param {string} name - input any guest name
* @returns {playerId: number | ErrorObject} - new playerId or Error
*/

export const playerJoin = (session: number, name: string) => {
  const data = getData();
  const quizzes = data.quizzes.filter((q) => q.sessions !== undefined);
  const quiz = quizzes.find((q) => q.sessions.activeSessions.find((s) => s.sessionId === session));
  const targetSession = quiz.sessions.activeSessions.find((s) => s.sessionId === session);

  if (targetSession.state !== SessionStates.LOBBY) {
    throw createHttpError(400, 'Session is not in LOBBY state');
  }

  if (targetSession.players.filter((p) => p.name === name).length > 0) {
    throw createHttpError(400, 'Name of user entered is not unique (compared to other users who have already joined)');
  }

  let newName : '';
  // create new name, 5 letters + 3 numbers && check if is valid
  if (name.length === 0) {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    newName = '';
    for (let i = newName.length; i < 4; i++) {
      const char = letters.charAt(Math.floor(Math.random() * letters.length));
      newName += char;
      letters.replace(char, '');
    }

    const numbers = '0123456789';
    for (let i = 0; i < 3; i++) {
      const num = numbers.charAt(Math.floor(Math.random() * numbers.length));
      newName += num;
      numbers.replace(num, '');
    }

    name = newName;
  }

  const pushPlayer = {
    name: name,
    sessionId: session,
    playerId: randomNum(),
  };

  const { sessionId, ...sessionPlayer } = pushPlayer;
  targetSession.players.push(sessionPlayer);
  data.players.push(pushPlayer);
  setData(data);
  return { playerId: pushPlayer.playerId };
};

// TODO: add a list of saved sessionId to avoid duplicate session generation

/**
 * Pushs the new player into the players array in dataStore
 * @param {Player} pushPlayer
 * @param {number} sessionId
 * No return
 */
/* function pushPlayerArray(pushPlayer: Player, sessionId: number) {
  const data = getData();
  const player = {
    playerId: pushPlayer.playerId,
    name: pushPlayer.name,
    sessionId: sessionId
  }
  if (data.players === undefined) {
    data.players = [player];
  } else {
    data.players.push(player);
  }
  setData(data);
} */

/**
* Get the status of a particular quiz session
* @param {number} authUserId - userId of the user
* @param {number} quizId - quizId of the quiz
* @param {number} sessionId - if quiz has autoStart timer
* @returns {sessionId: number | ErrorObject} - sessionId or Error
*/

export function adminQuizSessionStatus(authUserId: number, quizId: number,
  sessionId: number): object | Error {
  const data = getData();

  const quiz = data.quizzes.find((q: Quiz) => q.quizId === quizId);

  // checking if session ID exists within this quiz
  let theSessionId: Session;
  if (quiz.sessions.activeSessions !== undefined) {
    theSessionId = quiz.sessions.activeSessions.find((s: Session) =>
      s.sessionId === sessionId);
    if (theSessionId === undefined && quiz.sessions.inactiveSessions !== undefined) {
      theSessionId = quiz.sessions.inactiveSessions.find((s: Session) =>
        s.sessionId === sessionId);
    }
  }
  if (theSessionId === undefined) {
    throw HTTPError(400, 'Session Id does not refer to a valid session within this quiz');
  }

  // check if user ID is valid and quiz is owned by this user
  if (isValidUserAndQuizOwner(authUserId, quizId) === 1) {
    throw HTTPError(401, 'Token is empty or invalid');
  } else if (isValidUserAndQuizOwner(authUserId, quizId) === 2) {
    throw HTTPError(403, 'Quiz ID does not refer to a quiz that this user owns');
  }

  let thePlayers: Player[];
  if (theSessionId.players === undefined) {
    thePlayers = [];
  } else {
    thePlayers = theSessionId.players;
  }

  return {
    state: theSessionId.state,
    atQuestion: theSessionId.currQuestion,
    players: thePlayers,
    metadata: {
      quizId: quiz.quizId,
      name: quiz.name,
      timeCreated: quiz.timeCreated,
      timeLastEdited: quiz.timeLastEdited,
      description: quiz.description,
      numQuestions: quiz.numQuestions,
      questions: quiz.questions,
      duration: quiz.duration,
      thumbnailUrl: quiz.thumbnailURL,
    }
  };
}

/**
 * Returns the relevant information about a quiz
 * @param {number} authUserId
 * @param {number} quizId
 * @returns {error: string |
*  { quizId: number,
  *    name: string
  *    timeCreated: number,
  *    timeLastEdited: number,
  *    description: string,
  *  }
  * }
  */
export function adminQuizInfov2(authUserId: number, quizId: number):
   Quiz | {error: string, errornum: number} {
  const data = getData();

  // check if token is valid
  if (isValidUserAndQuizOwner(authUserId, quizId) === 1) {
    throw HTTPError(401, 'Token is empty or invalid');
  }
  // check if quiz belongs to this user
  const isQuizOwner = data.quizzes.filter((q) => q.quizId === quizId).find((q) => q.userId === authUserId);
  if (isQuizOwner === undefined) {
    throw HTTPError(403, 'Quiz ID does not refer to a quiz that this user owns');
  }

  return {
    quizId: isQuizOwner.quizId,
    userId: isQuizOwner.userId,
    name: isQuizOwner.name,
    timeCreated: isQuizOwner.timeCreated,
    timeLastEdited: isQuizOwner.timeLastEdited,
    description: isQuizOwner.description,
    numQuestions: isQuizOwner.numQuestions,
    questions: isQuizOwner.questions,
    duration: isQuizOwner.duration,
    thumbnailURL: isQuizOwner.thumbnailURL,
  };
}

/**
  * Create a new question for a particular quiz
  * @param {number} quizId
  * @param {number} authUserId
  * @param {string} theQuestion
  * @param {number} theDuration
  * @param {number} thePoints
  * @param {Answer[]} theAnswers
  * @param {string} thumbnailURL
  * @returns { questionId: number }
  */
export function adminQuizQuestionCreatev2 (quizId: number, authUserId: number, theQuestion: string,
  theDuration: number, thePoints: number, theAnswers: Answer[], thumbnailURL: string
): {questionId: number} | Error {
  const data = getData();

  // Check whether quiz is valid
  const theQuiz = data.quizzes.find((qid: Quiz) => qid.quizId === quizId);
  if (theQuiz === undefined) {
    throw HTTPError(400, 'Quiz Id does not refer to a valid quiz');
  }
  // Check whether question string lenght is valid
  if (theQuestion.length < 5 || theQuestion.length > 50) {
    throw HTTPError(400,
      'Question string is less than 5 characters in length or greater' +
        ' than 50 characters in length');
  }
  // Check number of answers
  if (theAnswers.length < 2 || theAnswers.length > 6) {
    throw HTTPError(400,
      'The question has more than 6 answers or less than 2 answers'
    );
  }
  // Check question duration
  if (theDuration < 1) {
    throw HTTPError(400, 'The question duration is not a positive number');
  }
  // Check sum of question durations
  if (theQuiz.duration + theDuration > 180) {
    throw HTTPError(400,
      'The sum of the question durations in the quiz exceeds 3 minutes'
    );
  }
  // Check points awarded
  if (thePoints < 1 || thePoints > 10) {
    throw HTTPError(400, 'Points awarded are less than 1 or greater than 10');
  }
  // Check answers lenght, duplication and whether there's at least 1 correct
  if (answersLengthDuplication(theAnswers) === 1) {
    throw HTTPError(400, 'Answers have to be within 1 and 30 characters long');
  }
  if (answersLengthDuplication(theAnswers) === 2) {
    throw HTTPError(400, 'Answers are duplicated');
  }
  if (correctAnswers(theAnswers) === 0) {
    throw HTTPError(400, 'There are no correct answers');
  }
  // check if user ID is valid and quiz is owned by this user
  if (isValidUserAndQuizOwner(authUserId, quizId) === 1) {
    throw HTTPError(401, 'AuthUserId is not a valid user');
  } else if (isValidUserAndQuizOwner(authUserId, quizId) === 2) {
    throw HTTPError(403,
      'Quiz ID does not refer to a quiz that this user owns'
    );
  }

  const toPush = pushObject(theQuestion, theDuration, thePoints, theAnswers, thumbnailURL);
  if (theQuiz.questions === undefined) {
    theQuiz.questions = [];
    theQuiz.questions.push(toPush);
  } else {
    theQuiz.questions.push(toPush);
  }

  theQuiz.thumbnailURL = thumbnailURL;
  theQuiz.numQuestions++;
  theQuiz.timeLastEdited = new Date().getTime();
  setData(data);
  return { questionId: toPush.questionId };
}

/**
  * Duplicate a quiz question
  * @param {number} quizId
  * @param {number} authUserId
  * @param {number} theQuestionId
  * @returns { newQuestionId: number }
  */
export function adminQuizQuestionDuplicatev2 (authUserId: number, quizId: number,
  theQuestionId: number): {newQuestionId: number} | ErrorObject {
  const data = getData();

  // Check whether question is valid within this quiz
  const theQuiz = data.quizzes.find((qid: Quiz) => qid.quizId === quizId);
  const theQuestion = theQuiz.questions.find(
    (q: Question) => q.questionId === theQuestionId
  );
  if (theQuestion === undefined) {
    throw HTTPError(400,
      'Question Id does not refer to a valid question within this quiz');
  }

  // check if user ID is valid and quiz is owned by this user
  if (isValidUserAndQuizOwner(authUserId, quizId) === 1) {
    throw HTTPError(401, 'AuthUserId is not a valid user');
  } else if (isValidUserAndQuizOwner(authUserId, quizId) === 2) {
    throw HTTPError(403, 'Quiz ID does not refer to a quiz that this user owns');
  }

  const thisId = randomNum();
  const theNewQuestion = {
    questionId: thisId,
    question: theQuestion.question,
    duration: theQuestion.duration,
    points: theQuestion.points,
    answers: theQuestion.answers,
    thumbnailURL: theQuestion.thumbnailURL
  };
  const index = theQuiz.questions.indexOf(theQuestion);
  theQuiz.questions.splice(index + 1, 0, theNewQuestion);
  theQuiz.timeLastEdited = new Date().getTime();

  setData(data);
  return {
    newQuestionId: thisId
  };
}

/**
  * Delete a quiz question
  * @param {number} quizId
  * @param {number} authUserId
  * @param {number} theQuestionId
  * @returns {object | ErrorObject}
  */
export function adminQuizQuestionDeletev2 (authUserId: number, quizId: number,
  theQuestionId: number): object | Error {
  const data = getData();

  // Check whether question is valid within this quiz
  const theQuiz = data.quizzes.find((qid: Quiz) => qid.quizId === quizId);
  if (theQuiz === undefined) {
    console.log('undefined');
  }
  const theQuestion = theQuiz.questions.find(
    (q: Question) => q.questionId === theQuestionId
  );
  if (theQuestion === undefined) {
    throw HTTPError(400,
      'Question Id does not refer to a valid question within this quiz');
  }

  // check if user ID is valid and quiz is owned by this user
  if (isValidUserAndQuizOwner(authUserId, quizId) === 1) {
    throw HTTPError(401, 'AuthUserId is not a valid user');
  } else if (isValidUserAndQuizOwner(authUserId, quizId) === 2) {
    throw HTTPError(403, 'Quiz ID does not refer to a quiz that this user owns');
  }

  const index = theQuiz.questions.indexOf(theQuestion);
  theQuiz.questions.splice(index, 1);
  theQuiz.numQuestions--;

  setData(data);
  return {};
}

/**
* Gets the status of a player that has joined a session
* @param {number} playerId - playerId that is on the session
* @returns {object | Error} - status about a player
*/
export function playerStatus(playerId: number): object {
  const data = getData();

  const thePlayer = data.players.find((p) => p.playerId === playerId);

  if (thePlayer === undefined) {
    throw createHttpError(400, 'Player Id does not exist');
  }

  let theSession: Session;
  let theQuiz: Quiz;
  for (const quiz of data.quizzes) {
    theQuiz = quiz;
    theSession = quiz.sessions.activeSessions.find((s) => s.sessionId === thePlayer.sessionId);
    if (theSession !== undefined) {
      break;
    }
  }

  return {
    state: theSession.state,
    numQuestions: theQuiz.numQuestions,
    atQuestion: theSession.currQuestion
  };
}

export function playerSendChat(playerId: number, theMessage: string): Record<string, never> {
  const data = getData();

  if (playerId === -1) {
    throw HTTPError(400, 'Player ID is undefined');
  }
  // Validate message body length
  if (theMessage.length < 1 || theMessage.length > 100) {
    throw HTTPError(400, 'Message body must be between 1 and 100 characters');
  }

  let playerFound = false;
  let activeSessionFound = false;

  for (const quiz of data.quizzes) {
    for (const session of (quiz.sessions?.activeSessions || [])) {
      const player = session.players?.find(p => p.playerId === playerId);
      if (player) {
        playerFound = true;
        // Check if the session is active
        if (session.state !== SessionStates.END) {
          activeSessionFound = true;
          const newMessage: Message = {
            messageBody: theMessage,
            playerId: playerId,
            playerName: player.name,
            timeSent: Date.now()
          };
          session.messages.push(newMessage);
          break;
        }
      }
    }
    if (activeSessionFound) break;
  }

  // Check whether player is found
  if (!playerFound) {
    throw HTTPError(400, 'Player not found');
  }

  if (!activeSessionFound) {
    throw HTTPError(400, 'Player is not part of any active session');
  }

  setData(data);

  return {};
}

/**
* Returns playerId Object. Adds new player to quiz session.
* @param {number} sessionId - sessionId of the quiz
* @returns {Message: object | ErrorObject} - new playerId or Error
*/
export const playerChat = (playerid: number) => {
  const data = getData();
  const returnMessage: Message[] = [];
  let playerExists = false;
  let sessionid = 0;

  for (const quiz of data.quizzes) {
    if (quiz.sessions?.activeSessions) {
      for (const session of quiz.sessions.activeSessions) {
        const player = session.players.find(p => p.playerId === playerid);
        if (player) {
          playerExists = true;
          sessionid = session.sessionId;
          break;
        }
      }
    }
    if (playerExists) break;
  }
  if (!playerExists) {
    throw createHttpError(400, 'Player ID does not exist');
  }

  for (const quiz1 of data.quizzes) {
    for (const session1 of quiz1.sessions?.activeSessions || []) {
      if (session1.sessionId === sessionid) {
        for (const message of session1.messages) {
          if (message.playerId === playerid) {
            returnMessage.push(...session1.messages);
          }
        }
      }
    }
  }
  return { returnMessage };
};

/**
* Gets the status of a player that has joined a session
* @param {number} playerId - playerId that is on the session
* @param {number} questionPosition - question where the quiz is at
* @returns {object | Error} - status about a player
*/
export function playerQuestionInfo(playerId: number, questionPosition: number): object | Error {
  const data = getData();
  const thePlayer = data.players.find((p) => p.playerId === playerId);

  if (thePlayer === undefined) {
    throw HTTPError(400, 'Player Id does not exist');
  }

  let theSession: Session;
  let theQuiz: Quiz;
  for (const quiz of data.quizzes) {
    theQuiz = quiz;
    theSession = quiz.sessions.activeSessions.find((s) => s.sessionId === thePlayer.sessionId);
    if (theSession !== undefined) {
      break;
    }
  }

  if (theQuiz.numQuestions < questionPosition || questionPosition < 1) {
    throw HTTPError(400, 'Question position is not valid for the session this player is in');
  }

  if (theSession.currQuestion !== questionPosition) {
    throw HTTPError(400, 'Session is not currently on this question');
  }

  if (theSession.state === SessionStates.LOBBY || theSession.state === SessionStates.END) {
    throw HTTPError(400, 'Session is in LOBBY or END state');
  }

  return theQuiz.questions[questionPosition - 1];
}

/**
* Returns playerId Object. Adds new player to quiz session.
* @param {number} quizid- quizId of the quiz
* @param {number} sessionId - sessionId of the quiz
* @param { string } token - token of the quiz
* @returns {Message: object | ErrorObject} - new playerId or Error
*/
export const sessionResults = (quizId: number, sessionId: number, authUserId: number) => {
  const data = getData();

  if (isValidUserAndQuizOwner(authUserId, quizId) === 1) {
    throw HTTPError(401, 'Token is empty or invalid');
  } else if (isValidUserAndQuizOwner(authUserId, quizId) === 2) {
    throw HTTPError(403, 'Quiz ID does not refer to a quiz that this user owns');
  }

  const quiz = data.quizzes.filter((q: Quiz) => q.quizId === quizId).find((q: Quiz) => q.userId === authUserId);
  const session = quiz.sessions.activeSessions.find((s) => s.sessionId === sessionId);

  if (session === undefined) {
    throw createHttpError(400, 'SessionId does not refer to valid session in quiz');
  }
  if (session.state !== SessionStates.FINAL_RESULTS) {
    throw createHttpError(400, 'Session is not in FINAL_RESULTS state');
  }

  return {};
};

/**
 * Searches through all quizzes and their active sessions to find a session that includes the specified player.
 * It iterates over each quiz's active sessions and checks the list of players within each session.
 * If the player is found in a session, that session is returned.
 *
 * @param {number} playerId - playerId that is on the session
 * @returns {Session | undefined} - The session in which the player is found, or undefined
 */
function findPlayerSession(playerId: number): Session | undefined {
  const data = getData();
  for (const quiz of data.quizzes) {
    // Check within active sessions if they exist
    if (quiz.sessions?.activeSessions) {
      for (const session of quiz.sessions.activeSessions) {
        // Find the player in the session
        if (session.players.some(player => player.playerId === playerId)) {
          return session;
        }
      }
    }
  }
  return undefined;
}

/**
* Get the results for a particular question of the session a player is playing in.
* @param {number} playerId - playerId that is on the session
* @param {number} questionPosition - question where the quiz is at
* @returns {object | Error} - status about a player
*/
export function playerQuestionResults(playerId: number, questionPosition: number): object | Error {
  const data = getData();

  // Check if player ID exists
  const player = data.players.find(p => p.playerId === playerId);
  if (!player) {
    throw HTTPError(400, 'Player ID does not exist');
  }

  const session = findPlayerSession(playerId);
  if (!session || session.state !== SessionStates.ANSWER_SHOW) {
    throw HTTPError(400, 'Session is not in ANSWER_SHOW state or player not in session');
  }

  // Check if the question position is valid
  if (questionPosition < 1 || questionPosition > session.currQuestion) {
    throw HTTPError(400, 'Invalid question position for the session this player is in');
  }

  // Find the question based on the position
  const quiz = data.quizzes.find(q => q.quizId === session.metadata.quizId);
  if (!quiz || quiz.questions.length < questionPosition) {
    throw HTTPError(400, 'Question does not exist');
  }

  const question = quiz.questions[questionPosition - 1];

  if (!question) {
    throw HTTPError(400, 'Invalid question position for the session this player is in');
  }

  const questionResults = quiz.questionResults?.find(qr => qr.questionId === question.questionId);

  let averageAnswerTime = 0;
  // Calculate the average answer time if answerTime is an array of times
  if (questionResults === undefined) {
    quiz.questionResults.push(
      {
        questionId: quiz.questions[questionPosition - 1].questionId,
        averageAnswerTime: 0,
        playersCorrectList: [],
        percentCorrect: 0
      }
    );
  } else {
    averageAnswerTime = questionResults.averageAnswerTime / questionResults.playersCorrectList.length;
  }

  // Return the results
  return {
    questionId: quiz.questions[questionPosition - 1].questionId,
    playersCorrectList: questionResults.playersCorrectList,
    averageAnswerTime: averageAnswerTime,
    percentCorrect: questionResults.percentCorrect,
  };
}

/**
 * Allow the current player to submit answer(s) to the currently active question.
 * Handles the submission of one or more answers by a player for a specific question in a game or quiz session.
 * @param {number} playerId - playerId that is on the session
 * @param {number} questionPosition - question where the quiz is at
 * @param {number[]} answerIds - An array of IDs representing the answer(s) selected by the player.
 * @returns {object} - An empty object if the submission was successful.
 * @throws {Error} - Throws 400 error if invalid params.
 */
export function playerSubmitAnswer(playerId: number, questionPosition: number, answerIds: number[]) {
  const data = getData();

  const playerExists = data.players.find((player) => player.playerId === playerId);
  if (playerExists === undefined) {
    throw HTTPError(400, 'Player ID does not exist');
  }

  // Find the session that the player is part of
  const session = data.quizzes
    .flatMap(quiz => quiz.sessions?.activeSessions || [])
    .find(session => session.players.some(player => player.playerId === playerId));

  if (!session) {
    throw HTTPError(400, 'Player is not part of any active session');
  }

  if (session.state !== SessionStates.QUESTION_OPEN) {
    throw HTTPError(400, 'Session is not in QUESTION_OPEN state');
  }

  // Check if the question position is valid for the current session
  if (session.currQuestion !== questionPosition) {
    throw HTTPError(400, 'Invalid question position for the session');
  }

  if (answerIds.length === 0) {
    throw HTTPError(400, 'Less than 1 answer ID was submitted');
  }

  // Check if answer IDs are valid for the current question
  const currentQuestion = session.metadata.questions[questionPosition - 1];
  const validAnswerIds = currentQuestion.answers.map(answer => answer.answerId);
  const allAnswerIdsValid = answerIds.every(id => validAnswerIds.includes(id));
  if (!allAnswerIdsValid) {
    throw HTTPError(400, 'Answer IDs are not valid for this particular question');
  }

  // Check if there are any duplicate answer IDs
  const uniqueAnswerIds = new Set(answerIds);
  if (uniqueAnswerIds.size !== answerIds.length) {
    throw HTTPError(400, 'Duplicate answer IDs provided');
  }

  // PLACEHOLDER need the logic record the player's answers in dataStore
  // !?!?!?!??!?!!?
  // considering correct answer is the last one provided?

  /* SHOWING ERROR THE ONES BELOW
  const theAnswer: Answer = currentQuestion.answers.find((a) => a.answerId === answerIds[answerIds.length]);
  const toPush: PlayerResults = {
    questionPosition,
    answerId: answerIds[answerIds.length - 1],
    correct: theAnswer.correct,
  }

  playerExists.playerResults.push(toPush);
  let session1: Session;
  let theQuiz: Quiz;
  for (const quiz of data.quizzes) {
    session1 = quiz.sessions?.activeSessions?.find(s => s.players.some(p => p.playerId === playerId));
    theQuiz = quiz;
    if (session1 !== undefined) break;
  }

  const theResults = theQuiz.questionResults.find((r) => r.questionPosition === questionPosition);
  let empty: number[] = [];
  let toPush1: PlayerResults;
  if (theResults === undefined) {
    const toPush1 = {
      questionPosition: questionPosition,
      playersCorrectList: [playerExists.name],
      answerTime: empty, // --> NO IDEA HOW TO CAPTURE THIS BY THE WAY
      ttNumPlayers: 1,
    }
  } else {
    theResults.questionResults.playersCorrectList.push(playerExists.name);
    theResults.questionResults.answerTime.push(WhateverWePush);
    theResults.questionResults.ttNumPlayers++;
  }
  theResults.questionResults.percentCorrect: parseInt(playersCorrectList.length) / ttNumPlayers;
  theQuiz.questionResults.push(toPush1);
  */

  setData(data);
  return {};
}

/**
 * View Active and Inactive Sessions
 * Active sessions are sessions that are not in the END state.
 * Inactive sessions are sessions in the END state.
 * @param {number} authUserId
 * @param {number} quizId
 * @returns {error: string | Sessions}
 */

export function adminQuizSessionActivity(authUserId: number, quizId: number): SessionActivity | {error: string, errornum: number} {
  const data = getData();

  // Check if token is valid
  if (isValidUserAndQuizOwner(authUserId, quizId) === 1) {
    throw HTTPError(401, 'Token is empty or invalid');
  }

  const quiz = data.quizzes.find((q: Quiz) => q.quizId === quizId && q.userId === authUserId);
  if (quiz === undefined) {
    throw createHttpError(403, 'Valid token is provided, but the user is not an owner of this quiz');
  }

  const activeSessions = (quiz.sessions?.activeSessions ?? [])
    .filter(session => session.state !== SessionStates.END)
    .map(session => session.sessionId)
    .sort((a, b) => a - b);

  const inactiveSessions = (quiz.sessions?.inactiveSessions ?? [])
    .filter(session => session.state === SessionStates.END)
    .map(session => session.sessionId)
    .sort((a, b) => a - b);

  return {
    activeSessions,
    inactiveSessions,
  };
}

/**
 * Move a question from one particular position in the quiz to another
 * When this route is called, the timeLastEdited is updated
 * @param {number} quizId
 * @param {number} userId
 * @param {number} questionId,
 * @param {number} position
 * @returns {}
*/
export function adminQuizMoveQuestionv2 (quizId: number, authUserId: number, questionId: number,
  newPosition: number): Record<string, never> | ErrorObject {
  const data = getData();
  const user = data.users.find((u) => u.userId === authUserId);

  if (user === undefined) {
    throw HTTPError(401, 'Invalid Token');
  }

  const theQuiz = data.quizzes.find((q) => q.quizId === quizId && q.userId === authUserId);
  if (theQuiz === undefined) {
    throw HTTPError(403, 'QuizId is not owned by user');
  }

  const question = theQuiz.questions.find((q: Question) => q.questionId === questionId);
  if (question === undefined) {
    throw HTTPError(400, 'Question Id does not refer to a valid question');
  }

  if (newPosition < 0 || newPosition > theQuiz.questions.length - 1) {
    throw HTTPError(400, 'position is < 0 or > n - 1 QuizSize');
  }

  const questionPosition = theQuiz.questions.findIndex((q: Question) => q.questionId === question.questionId);

  if (questionPosition === newPosition) {
    throw HTTPError(400, 'NewPosition is the position of the current question');
  }

  theQuiz.questions.splice(questionPosition, 1);
  theQuiz.questions.splice(newPosition, 0, question);
  theQuiz.timeLastEdited = new Date().getTime();
  setData(data);

  return {};
}

/**
 * Restore a particular quiz from the trash back to an active quiz.
 * @param {number} userId
 * @param {number} quizId
 * @returns { Record<string, never> | ErrorObject }
*/
export function adminQuizRestorev2(quizId: number, authUserId: number): Record<string, never> | ErrorObject {
  const data = getData();
  // check if user ID is valid
  const theUser = data.users.find((id: User) => id.userId === authUserId);
  if (theUser === undefined) {
    throw HTTPError(400, 'AuthUserId is not a valid user');
  }

  // check if quiz belongs to this user
  const theQuiz = data.quizzes.find((qid: Quiz) => qid.quizId === quizId && qid.userId === authUserId);
  if (theQuiz === undefined) {
    throw HTTPError(403, 'Quiz ID does not refer to a quiz that this user owns');
  }

  const checkQuiz = data.quizzes.find((qid: Quiz) => qid.quizId === quizId);
  if (checkQuiz.isTrashed === undefined || checkQuiz.isTrashed === false) {
    throw HTTPError(400, 'Quiz ID refers to a quiz that is not currently in the trash');
  }
  // check if Quiz name of the restored quiz is already used by another active quiz
  if (checkQuiz.isTrashed === true) {
    const quizName = checkQuiz.name;
    const checkSameName = data.quizzes.find((Qname: Quiz) => Qname.name === quizName && Qname.isTrashed === false);
    if (checkSameName) {
      throw HTTPError(400, 'Quiz name of the restored quiz is already used by another active quiz');
    }
  }
  // Restore a quiz in trash
  if (checkQuiz) {
    checkQuiz.isTrashed = false;
  }
  setData(data);
  return {};
}
