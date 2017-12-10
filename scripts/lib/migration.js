const fs = require('fs-extra');
const path = require('path');
const paths = require('../../config/paths');
const humps = require('humps');
const glob = require('glob');
const Query = require('../../core/db/query');
const {
  MIGRATION_TEMPLATE,
  QUERY_SCHEMA_MIGRATION_EXISTS,
  QUERY_LAST_MIGRATION
} = require('./constants');

module.exports = {
  create,
  run,
  tearDown,
  getMigrations,
  getLatest,
  schemaExists
}

///////////////////////

/**
 * Create an empty migration template file in `db/migrations`.
 *
 * @param {string} name The migration name
 * @return {Promise<string>} Path to the file created
 */

function create(name) {
  const timestamp = getTimestamp();
  const tableName = humps.decamelize(name);
  const filename = `${timestamp}_${tableName}.js`;
  const destination = path.join(paths.migrations, filename);

  const pattern = /\$1/g;
  const template = MIGRATION_TEMPLATE.replace(pattern, tableName).trim();

  return fs.ensureDir(paths.migrations)
    .then(() => fs.writeFile(destination, template))
    .then(() => destination)
    .catch(err => new Error(`Can't create migration. ${err.message}`));
}

/**
 * Run all migrations then save all applied migrations to the database. If
 * a `latest` migration timestamp is specified, it will only apply migrations
 * after the one specified.
 *
 * @param {Array<Object>} migrations Migrations object
 * @param {string} [latest] Latest timestamp applied
 *
 * @return {Promise<Array<string>>} Applied migration filenames
 */

function run(migrations, latest) {
  const appliedTimestamps = [];
  const appliedMigration = [];
  const timestamps = Object.keys(migrations);

  const queries = timestamps.reduce((queries, timestamp) => {
    if (timestamp > latest) {
      const migrationFile = migrations[timestamp];
      const { up } = require(migrationFile);

      queries.push(up);

      appliedTimestamps.push(timestamp);
      appliedMigration.push(migrationFile);
    }
    return queries;
  }, []);

  return Query.exec(Query.createTransaction(queries))
    .then(() => save(appliedTimestamps))
    .then(() => appliedMigration);
}

/**
 * Tear down the latest applied migrations and update the database.
 *
 * @param {Object} migrations Migrations object
 * @param {string} latest Last applied migration
 * @return {Promise<Array<string>>} Rolledback migration filenames
 */

function tearDown(migrations, latest) {
  const rolledbackTimestamps = [];
  const rolledbackMigrations = [];
  const timestamps = Object.keys(migrations);

  const queries = timestamps.reduce((queries, timestamp) => {
    if (timestamp >= latest) {
      const migrationFile = migrations[timestamp];
      const { down } = require(migrationFile);

      queries.push(down);

      rolledbackTimestamps.push(timestamp);
      rolledbackMigrations.push(migrationFile)
    }
    return queries;
  }, []);

  return Query.exec(Query.createTransaction(queries))
    .then(() => remove(rolledbackTimestamps))
    .then(() => rolledbackMigrations);
}

/**
 * Get a migration object that contains a list of migration filepaths
 * with migration's timestamps as key. When a `timestamp` parameter is
 * specified, returns only migrations until that timestamp. Use the `reverse`
 * parameter to get migrations in reverse order, starting by the most recent.
 * This is useful for getting migrations that should be rolledback.
 *
 * @param {string} timestamp Get migrations until timestamp
 * @param {boolean} reverse Define if migrations order should be reversed
 * @return {Object} Migration list object
 *
 * @example
 *
 *  getMigrations().then((migrations) => console.log(migrations))
 *  // => {20161102233710: './my/mig1.js', 20161102233713: './my/mig2.js', ...}
 */

function getMigrations(timestamp, reverse = false) {
  return new Promise((resolve, reject) => {
    glob(`${paths.migrations}/*[0-9_]*.js`, (err, filenames) => {
      if (err) return reject(err);

      if (reverse) filenames.reverse();

      const migrations = filenames.reduce((migrations, filepath) => {
        const filename = path.basename(filepath, '.js');
        const fileTimestamp = filename.split('_')[0];

        if (!timestamp) {
          migrations[fileTimestamp] = filepath;
          return migrations;
        }

        if (fileTimestamp <= timestamp) {
          migrations[fileTimestamp] = filepath;
        }

        return migrations;
      }, {});

      resolve(migrations);
    })
  });
}

/**
 * Get the version of the latest applied migration from database.
 *
 * @return {Promise<Number>} Migration version or null
 */

function getLatest() {
  return Query.exec(QUERY_LAST_MIGRATION)
    .then(({rows}) => {
      if (rows[0]) {
        return rows[0].version;
      }
      return -1;
    });
}

/**
 * Check if a migration schema table exists in the database.
 *
 * @return {Promise<bool>} True if table exists, otherwise false.
 */

function schemaExists() {
  return Query.exec(QUERY_SCHEMA_MIGRATION_EXISTS)
    .then(({rows}) => {
      return rows[0].exists;
    });
}

/**
 * Add all provided migration's versions to the
 * database' schema_migrations table.
 *
 * @private
 *
 * @param {Number|Array<Number>} timestamps Migration timestamps to save in the db
 * @return {Promise<Object>} DB Query results
 */

function save(timestamps) {
  if (!Array.isArray(timestamps)) {
    timestamps = [timestamps];
  }

  const queries = timestamps.map((timestamp) => {
    return `INSERT INTO "schema_migrations" VALUES (${timestamp});`
  });

  return Query.exec(Query.createTransaction(queries));
}

/**
 * Remove all provided migration's timestamps from
 * the database's schema_migrations table.
 *
 * @private
 *
 * @param {Number|Array<Number>} timestamps Migration timestamps to remove from db
 * @return {Promise<Object>} DB Query results
 */

function remove(timestamps) {
  if (!Array.isArray(timestamps)) {
    timestamps = [timestamps];
  }

  const queries = timestamps.map((timestamp) => {
    return `DELETE FROM "schema_migrations" WHERE version = '${timestamp}';`
  });

  return Query.exec(Query.createTransaction(queries));
}

/**
 * Generate a migration timestamp in the form YYYYMMDDHHMMSS base on the
 * current UTC date and time;
 *
 * @private
 *
 * @return {string} Migration timestamp with format YYYYMMDDHHMMSS
 */

function getTimestamp() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = normalize(now.getUTCMonth() + 1);
  const day = normalize(now.getUTCDate());
  const hours = normalize(now.getUTCHours());
  const minutes = normalize(now.getUTCMinutes());
  const seconds = normalize(now.getUTCSeconds());

  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

/**
 * Normalize a number to a two digit number string.
 *
 * @private
 *
 * @param  {Number} number The number that should be normalized
 * @return {String}        Normalized number
 */

function normalize(number) {
  return number > 0 && number < 10 ? `0${number}` : number
}

