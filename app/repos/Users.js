const {camelizeKeys} = require('humps');
const passwordHash = require('../../core/password-hash');
const { SQL, exec, createTrasaction } = require('../../core/db/query');

/**
 * Users Database Repository.
 * Manages database operations with user models.
 */

module.exports = {
  getAll,
  getById,
  insert,
  update,
  remove,
  exists,
  count,
  verify
}

////////////////////

/**
 * Get all users.
 *
 * @param {number} limit The number of results to return
 * @param {number} offset The number of results to skip
 * @return {Promise<Array<Object>>} A collection of users
 */

function getAll(limit, offset) {
  let i = 0;
  let values = [];
  let query = 'SELECT id, username, created_at, updated_at FROM users';

  if (limit) {
    i++;
    query += ' LIMIT $' + i;
    values.push(limit);
  }

  if (offset) {
    i++;
    query += ' OFFSET $' + i;;
    values.push(offset);
  }

  return exec({text: query, values})
    .then(({rows}) => rows.map(row => camelizeKeys(row)));
}

/**
 * Get a user by its id
 *
 * @param {number} id User's id
 * @return {Promise<Object>} A User or undefined
 */

function getById(id) {
  return exec(SQL`
    SELECT id, username, created_at, updated_at
    FROM   users
    WHERE  id = ${id}`
  )
  .then(({rows}) => camelizeKeys(rows[0]));
}

/**
 * Inser a new user
 *
 * @param {Object} model User model
 * @return {Promise}
 */

function insert(model) {
  const now = new Date();
  return passwordHash.generate(model.password)
    .then(hash => SQL`
      INSERT INTO users (username, password, created_at, updated_at)
      VALUES(${model.username}, ${hash}, ${now}, ${now})
      RETURNING id;
    `)
    .then(query => exec(query))
    .then(({rows}) => rows[0].id);
}

/**
 * Update a user
 *
 * @param {Object} model User model
 * @return {Promise}
 */

function update(model) {
  const now = new Date();
  return passwordHash.generate(model.password)
    .then(hash => SQL`
      UPDATE users
      SET    password = ${hash},
             updated_at = ${now}
      WHERE  id = ${model.id}
    `)
    .then(query => exec(query));
}

/**
 * Remove a user by its id
 *
 * @param {number} id User's id
 * @return {Promise}
 */

function remove(id) {
  return exec(SQL`DELETE FROM users WHERE id = ${id}`);
}

/**
 * Check if user with the given `username` already exists.
 *
 * @param {string} username
 * @return {Promise<boolean>}
 */

function exists(username) {
  return exec(SQL`
    SELECT EXISTS (
      SELECT 1
      FROM   users
      WHERE  username = ${username}
    );
  `).then(({rows}) => rows[0].exists);
}

/**
 * Count the number of users in the database
 *
 * @return {Promise<number>} The number of users found.
 */

function count() {
  return exec(SQL`SELECT COUNT(*) FROM users`)
    .then(({rows}) => rows[0].count);
}

/**
 * Verify user password
 *
 * @param {number} id User's id
 * @param {string} password User's password
 * @return {Promise<boolean>}
 */

function verify(id, password) {
  return exec(SQL`SELECT password FROM users WHERE id = ${id}`)
    .then(({rows}) => {
      if (rows[0] === undefined) {
        throw new Error(`A user with id ${id} cannot be found.`);
      }

      return passwordHash.verify(password, rows[0].password);
    });
}
