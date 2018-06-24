const knex = require('../../core/knex');
const passwordHash = require('../../core/password-hash');

const TABLE = 'users';
const FIELDS = [
  'id',
  'username',
  'email',
  'verified',
  'created_at',
  'created_by',
  'updated_at',
  'updated_by'
]

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
 * @param {number} [limit=100]  The number of results to return
 * @param {number} offset The number of results to skip
 * @return {Promise<Array<Object>>} A collection of users
 */

function getAll(limit = 100, offset = 0) {
  return knex(TABLE)
    .select(...FIELDS)
    .limit(limit)
    .offset(offset)
}

/**
 * Get a user by its id
 *
 * @param {number} id User's id
 * @return {Promise<Object>} A User or undefined
 */

function getById(id) {
  return knex(TABLE)
    .where({id})
    .select(...FIELDS);
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
    .then(hash => {
      model.password = hash;
      model.created_at = now;
      return model;
    })
    .then(model => knex(TABLE).insert(model))
    .then(results => getById(results[0]))
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
    .then(hash => {
      model.password = hash;
      model.updated_at = now;
      return model;
    })
    .then(model => knex(TABLE).where('id', model.id).update(model))
    .then(() => getById(model.id));
}

/**
 * Remove a user by its id
 *
 * @param {number} id User's id
 * @return {Promise}
 */

function remove(id) {
  return knex(TABLE).where({id}).del();
}

/**
 * Check if user with the given `username` already exists.
 *
 * @param {string} username
 * @return {Promise<boolean>}
 */

function exists(username) {
  return knex(TABLE).where({username}).limit(1).then(res => res.length > 0);
}

/**
 * Count the number of users in the database
 *
 * @return {Promise<number>} The number of users found.
 */

function count() {
  return knex(TABLE).count('id');
}

/**
 * Verify user password
 *
 * @param {number} id User's id
 * @param {string} password User's password
 * @return {Promise<boolean>}
 */

function verify(id, password) {
  return knex(TABLE).where({id}).select('password')
    .then(data => {
      if (data[0] === undefined) {
        throw new Error(`A user with id ${id} cannot be found.`);
      }
      return passwordHash.verify(password, data[0].password);
    })
}
