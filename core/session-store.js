const expressSession = require("express-session");
const KnexSessionStore = require("connect-session-knex")(expressSession);
const knex = require("../core/knex");

const store = new KnexSessionStore({
  knex,
  tablename: "sessions",
});

const config = {
  secret: process.env.SESSION_SECRET || "definetely-change-this",
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 60000, // 60 seconds, for testing
  },
  store,
};

const sessionMiddleware = expressSession(config);

module.exports = {
  session: sessionMiddleware,
  sessionStore: store,
};
