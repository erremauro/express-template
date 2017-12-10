const db = require('./connect');

module.exports = {
  SQL,
  exec,
  createTransaction,
};

////////////////////

/**
 * Compose a safe postgresql query for pg.Pool
 *
 * @param {Array<string>} parts  String template parts
 * @param {Array<string>} values String template values
 *
 * @return {ParametizedQuery} Pg parametrized query
 *
 * @example
 *
 * SQL`INSERT INTO Users (${username}, ${password})`
 */
function SQL(parts, ...values) {
  return {
    text: parts.reduce((prev, curr, i) => prev + '$' + i + curr),
    values
  };
}

/**
 * Execute a sql query with pg.Pool
 *
 * @param  {ParametizedQuery} sqlQuery Parametized pg query object
 * @return {Promise<Object>}           Resolve with query results
 *
 * @example
 *
 * const query = require('./query');
 * const SQL = query.SQL;
 *
 * const id = 2;
 *
 * query.exec(SQL`SELECT * FROM "Users" WHERE id = ${id}`)
 *   .then((result) => {
 *     console.log('User', result.rows[0])
 *   });
 */
function exec(sqlQuery) {
  return new Promise((resolve, reject) => {
    db.connect((err, client, done) => {
      if (err) {
        return reject(err);
      }

      client.query(sqlQuery, (err, result) => {
        done();
        if (err) {
          return reject(err);
        }
        resolve(result);
      });
    });
  });
}

/**
 * Create a PostgreSQL transaction for a given set of queries
 *
 * @param {Array<string>} queries A list of queries
 * @return {string} A transaction query
 *
 * @example
 *
 * const queries = [
 *   'INSERT INTO users (username) VALUES("gf10859");',
 *   'INSERT INTO users (username) VALUES("gf98764");',
 * ];
 *
 * Query.exec(createTransaction(queries));
 */

function createTransaction(queries) {
  return Array.isArray(queries)
    ? `BEGIN;\n${queries.join('\n')};\nCOMMIT;`
    : `BEGIN;\n${queries};\nCOMMIT;`;
}
