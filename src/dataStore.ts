// YOU SHOULD MODIFY THIS OBJECT BELOW
import fs from 'fs';
import { HttpError } from 'http-errors';
// import createHttpError from 'http-errors';
export enum SessionStates {
  LOBBY = 'LOBBY',
  QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN',
  QUESTION_OPEN = 'QUESTION_OPEN',
  QUESTION_CLOSE = 'QUESTION_CLOSE',
  ANSWER_SHOW = 'ANSWER_SHOW',
  FINAL_RESULTS = 'FINAL_RESULTS',
  END = 'END'
}

export enum SessionActions {
  NEXT_QUESTION = 'NEXT_QUESTION',
  SKIP_COUNTDOWN = 'SKIP_COUNTDOWN',
  GO_TO_ANSWER = 'GO_TO_ANSWER',
  GO_TO_FINAL_RESULTS = 'GO_TO_FINAL_RESULTS',
  END = 'END'
}

export interface ReturnUserId {
  authUserId: number,
}

export interface ErrorObject{
  error: string,
  errornum: number,
}

export interface QuizBrief{
  quizId: number,
  name: string,
}

export interface Answer{
  answerId?: number,
  answer: string,
  colour?: string,
  correct: boolean,
}

export interface Question{
  questionId: number,
  question: string,
  duration: number,
  points: number,
  answers: Array<Answer>,
  thumbnailURL?: string,
}

export interface User{
  userId: number,
  nameFirst: string,
  nameLast: string,
  email: string,
  password: string,
  numSuccessfulLogins: number,
  numFailedPasswordsSinceLastLogin: number,
  passwords: Array<string>,
}

export interface Message{
  messageBody: string,
  playerId: number,
  playerName: string,
  timeSent: number
}

export interface Player{
  playerId: number,
  name: string,
  sessionid?: number
}

export interface QuizNoSession{
  quizId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  numQuestions: number,
  questions: Array<Question>,
  duration: number,
  thumbnailURL?: string,
}

export interface Session{
  sessionId: number,
  state: SessionStates,
  autoStartNum: number
  messages: Message[],
  players: Player[],
  metadata: QuizNoSession,
  currQuestion: number
}

export interface Sessions{
  activeSessions?: Session[],
  inactiveSessions?: Session[],
}

export interface SessionActivity {
  activeSessions: number[];
  inactiveSessions: number[];
}

export interface Quiz{
  quizId: number,
  userId: number,
  name: string,
  timeCreated: number,
  timeLastEdited: number,
  description: string,
  numQuestions: number,
  questions: Array<Question>,
  duration: number,
  isTrashed?: boolean,
  thumbnailURL?: string,
  sessions?: Sessions,
  questionResults?: QuestionResults[],
}

export interface QuestionResults{
  questionId: number;
  playersCorrectList: string[];
  averageAnswerTime: number;
  percentCorrect: number;
}

export interface PlayerResults{
  questionPosition: number,
  answerId: number,
  correct: boolean,
}

export interface Token{
  sessionId: number,
  userId: number,
}

export interface Players{
  sessionId: number,
  playerId: number,
  name: string,
  playerResults?: PlayerResults[],
}

export interface QuizResponse {
  quizzes: QuizBrief[];
}

interface DataStore {
  users: Array<User>,
  quizzes: Array<Quiz>,
  tokens: Array<string>,
  players: Array<Players>,
}

// Use get() to access the data
export function getData() {
  const jsonStr = fs.readFileSync('./src/data.json');
  const data: DataStore = JSON.parse(String(jsonStr));
  return data;
}

// Use set(newData) to pass in the entire data object, with modifications made
export function setData(newData: DataStore) {
  const FileSystem = require('fs');
  FileSystem.writeFileSync('./src/data.json', JSON.stringify(newData), (error: HttpError) => {
    if (error) throw error;
  });
}

// YOU SHOULDNT NEED TO MODIFY THE FUNCTIONS BELOW IN ITERATION 1

/*
Example usage
    let store = getData()
    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Rando'] }

    names = store.names

    names.pop()
    names.push('Jake')

    console.log(store) # Prints { 'names': ['Hayden', 'Tam', 'Rani', 'Giuliana', 'Jake'] }
    setData(store)
*/
