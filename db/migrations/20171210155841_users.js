/**
 * Apply database changqes.
 */

const up = `
  DROP TABLE IF EXISTS users;
  CREATE TABLE users (
    id serial PRIMARY KEY,
    username varchar(50) UNIQUE,
    password varchar(60) NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
  );
  CREATE INDEX username_idx ON users (username);
`;

/**
 * Revert database changes.
 */

const down = `
  DROP TABLE IF EXISTS users;
`;

module.exports = { up, down };
