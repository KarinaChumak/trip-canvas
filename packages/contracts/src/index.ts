// What the web app and the server send each other over HTTP, outside the chat stream.
// One Zod schema per payload: the server types its responses with it, the web app
// parses what it receives with it, so the two can't drift apart.
export * from './places.js';
