// pg client pooling ready
// read more: https://github.com/brianc/node-postgres#client-pooling
const config = {
  user: process.env.DB_USER || 'express',
  password: process.env.DB_PASSWORD || 'express',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'express',
  // max number of clients in the pool
  max: 10,
  // how long a client is allowed to remain idle before being closed
  idleTimeoutMillis: 30000,
};

module.exports = config;
