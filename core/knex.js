const knex = require('knex');
const env = require('../config/env');
const config = require('../knexfile.js');

console.log('ENV: ', env.NODE_ENV)
console.log('config: ', config[env.NODE_ENV])

module.exports = knex(config[env.NODE_ENV]);
