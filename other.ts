import {
  // ErrorObject,
  getData,
  setData,
  Token,
  Quiz
} from './dataStore';

/*
* Reset the state of the application back to the start.
* @param ()
* @returns { }
*/
export function clear() {
  const data = getData();
  data.users = [];
  data.quizzes = [];
  data.tokens = [];
  data.players = [];
  setData(data);
  return {};
}

/**
 * Creates and returns a token with userId and sessionId.
 * @param {number} authUserId
 * @returns {Token}
 */
export function tokenizing(authUserId: number): Token {
  const theSessionId = randomNum();
  const token = { sessionId: theSessionId, userId: authUserId };

  return token;
}

/**
 * Converts a token object into a string format and then encodes it for safe transmission over the web.
 * @param {Token} token - The token object to be encoded.
 * @returns {string} - The URL-safe encoded string representation of the token.
 */
export function encoding(token: Token): string {
  return encodeURIComponent(JSON.stringify(token));
}

/**
 * Decodes an encoded token string back into its original object format.
 * The function first decodes the URL-safe token and then parses it into an object.
 * @param {string} tokenEncoded - The URL-safe encoded token string.
 * @returns {Token | null } - The original token object or null invalid token.
 */
export function decoding(tokenEncoded: string): Token | null {
  try {
    JSON.parse(decodeURIComponent(tokenEncoded));
  } catch (err) {
    return null;
  }
  return JSON.parse(decodeURIComponent(tokenEncoded));
}

/**
 * checks whether token is registered
 */
export function tokenValid(token: string) : boolean {
  const data = getData();
  return data.tokens.includes(token);
}

// Function to get quizzes from trash
export const getTrashedQuizzes = () => {
  const data = getData();
  return data.quizzes.filter((q: Quiz) => q.isTrashed);
};

/**
 * generates an unique number
 * @returns {number}
 */
export const randomNum = () => {
  return Math.round(Date.now() + Math.random() * 10000000000001);
};

/**
  * returns string 'invalid' if undefined tokenString or invalid tokenString,
  * else, returns the userId attached to the token session
  * @param {string}  token - the token string input
  * @returns {number} | {string}- userId | 'invalid'
*
*/

export function decodeUserId(token: Record<never, never>): number | undefined {
  if (token === undefined) {
    return undefined;
  }

  if (typeof token !== 'string') {
    return undefined;
  }

  if (token.length === 0) {
    return undefined;
  }

  const returnType = decoding(token);
  if (returnType === null) {
    return undefined;
  }

  const { userId } = returnType;
  const check = String(userId);

  if (/^\d*$/.test(check)) {
    return userId;
  }

  return undefined;
}
