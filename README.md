# express-pg-template

An Express Template with PostgreSQL support.

## Table of contents

- [Installation](#installation)
  - [Cleaning up the examples](#cleaning-up-the-examples)
- [Running the application](#running-the-application)
  - [Running in development mode](#running-in-development-mode)
- [Configurations](#configurations)
  - [Server configurations](#server-configurations)
  - [Database configurations](#database-configurations)
- [Database](#database)
  - [Migrations](#migrations)
  	- [Creating a migration](#creating-a-migrations)
  	- [Using the up and down statements](#using-the-up-and-down-statements)
  - [The Query object](#the-query-object)
    - [Queries](#queries)
    - [Transaction](#transactions)
  - [Hashing Passwords](#hashing-passwords)

## Installation

To install Express Template type:

	git clone https://github.com/erremauro/express-pg-template <PROJECT_DIR>
	cd <PROJECT_DIR> && rm -rf .git && yarn install

### Cleaning up the examples

Express Template has some example files to show you how to setup your
project that you might want to remove after checking them out.

Here's a list of these files:

- `migrations/20171210155841_users.js`, a migration example
- `app/repos/Users.js`, a database repository example
- `app/routes/users.js`, an api route example
- `core/json-response.js`, a json response utility

## Running the application

The application server can be run with `./bin/www [options]`. To view a
complete list of options, type:

	$ ./bin/www --help

	Usage: www [options]


	Options:

	-V, --version            output the version number
	-p, --port [port]        Port to use (default: 3001)
	-a, --address [address]  Address to use (default: 0.0.0.0)
	-R, --cors [headers]     Enable CORS. Optionally provide cors headers separated by commas
	-S, --ssl                Enable https
	-C, --cert [path]        Path to ssl cert file (default: ./cert.pem)
	-K, --key [path]         Path to ssl key file (default: ./key.pem)
	-g, --gzip [value]       Serve gzip files when possible (default: true)
	-q, --quiet              Turn off logging completely
	-v, --verbose            Turn on server logging
	-h, --help               output usage information

### Running in development mode

To start the application in development mode, type:

	yarn start [options]

This will start your server and watch your current working directory for 
changes. If any change is detected the server will be automatically restarted
so you don't have to do it.

## Configurations

Configurations can be specified in the form of environment variables or in 
using `.env` file placed in the root of your project directory. You can use 
environment specific files and local files (i.e. `.env.development`, 
`.env.test.local`). Local files have precedence over environment specific files.

Additional configurations can be found in the `./config` directory.

### Server configurations

| Option      | Default   | Description                  |
|-------------|-----------|------------------------------|
| HOST        | localhost | Set the application address  |
| PORT        | 3001      | Specify the default PORT     |
| SSL         | false     | Enable https                 |
| CERT        |           | Set the ssl certificate path |
| KEY         |           | Set the ssl private key path |

### Database configurations

Additional configurations can be found in `./config/database.js`.

| Option      | Default   | Description                  |
|-------------|-----------|------------------------------|
| DB_HOST     | localhost | Set the database host        |
| DB_PORT     | 5432      | Set the database port        |
| DB_NAME     | express   | Set the database name        |
| DB_USER     | express   | Set the database username    |
| DB_PASSWORD | express   | Set the database password    |

## Database

Express Template support PostgreSQL and offers utilities to manage database 
migrations and execute parametized queries as template literals.

### Migrations

Migrations are a convenient way to alter you database over time in a consistent
and easy way.

You can think of each migration as being a new 'version' of the database. 
A schema starts off with nothing in it, and each migration modifies it to add 
or remove tables, columns, or entries.

Here's an example of a migration:

```javascript
/**
* Apply database changes.
*/

const up = `
  DROP TABLE IF EXISTS users;
  CREATE TABLE users (
    id serial PRIMARY KEY,
    username varchar(50),
    password varchar(128),
    created_at timestamp with time zone,
    updated_at timestamp with time zone
  );
`;

/**
* Revert database changes.
*/

const down = `
  DROP TABLE IF EXISTS users;
`;

module.exports = { up, down };
```

#### Creating a migration

Migrations are stored as files in the `./db/migrations` directory. The name of
the file is of the form `YYYYMMDDHHMMSS_create_users.js` that is to say a UTC
timestamp identifying the migration followed by and underscore followed by the
name of the migration. Express Template uses the timestamp to determine which
migration should be run and in what order, so if you're copying a migration
from another application or generate a file yourself, be aware of its position
in the order.

To generate a migration type:

	`yarn db-generate <MIGRATION_NAME>`

That will create an empty but appropriately named migration.

#### Using the up and down statements

The `up` statement should contain a query with the transformation you'd like to
make to your schema, and the `down` statements of your migration should revert 
the trasformation done by the up statements. In other words, the database schema 
should be unchanged if you do an `up` followed by a `down`.

#### Applying migrations

Express Template provides a set of scripts to run migrations and reverting them.
To apply any migration that was not already applied to the database schema, run:

	yarn db-migrate

To apply migrations until a specific migration timestamp run:

	yarn db-migrate -t <TIMESTAMP>

#### Reverting migrations

A common task is to rollback the last migration. For example, if you made a 
mistake in it and wish to correct it. 

	yarn db-rollback

To rollback migrations until a specific migration timestamp run:

	yarn db-rollback -t <TIMESTAMP>

### The Query object

To query the database you can use the `Query` object. The `Query` object let
you write parametized queries using 
[template literals](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals) 
that already sanitized against query injection. It uses 
[node-postgres](https://node-postgres.com) under the hood and will returns 
results from `node-postgres` queries., so you should read more about how 
`node-postgres` works to learn how to parse your results.

#### Queries

Here's an example of how composing and executing a template literal query 
with parameters:

```javascript
const Query = require('../core/db/query');
const passwordHash = require('../core/password-hash');

/**
 * Create a new user.
 *
 * @param  {string} username
 * @param  {string} password
 * @return {Promise<Object>} Query result object
 */

function createUser(username, password) {
  const hash = passwordHash.generate(password);
  const query = Query.SQL`
  	INSER INTO users (username, password) VALUES(${username}, ${hash});
  `;
  return Query.exec(query)
  	.catch(err => new Error(`User creation failed: ${err.message}`));
}
```

#### Transactions

An easy way to create a transaction is to use the `createTransaction` method
from the `Query` object. Just pass an array of queries (or even a single
query if you need to) to `createTransaction` and execute its result:

```javascript
const { SQL, exec, createTransaction } = require('../core/db/query');

/**
 * Save articles in the database.
 *
 * @param {Array<Object>} articles
 * @return {Promise<object>}
 */

function inserAll(articles) {
  const queries = articles.reduce((queries, article) => {
  	const {name, price} = article;
  	queries.push(
  	  SQL`INSERT INTO articles (name, price) VALUES(${name}, ${price})`;
	);
	return queries;
  }, []);

  const transaction = createTransaction(queries);

  return exec(transaction)
  	.catch(err => new Error('Unable to save articles: ${err.message}'));
}
```

### Hashing Passwords

Express Template has a little utility to hash passwords that can be found in
`core/password-hash`. Here's how to use it:

```javascript
const passwordHash = require('password-hash');

const password = 'my-secret-password';
const hash = passwordHash.generate(password);

// returns true
const valid = passwordHash.verify(password, hash);

// returns false
const invalid = passwordHash.verify('wrong-password', hash);
```

Since it uses [bcrypt](https://www.npmjs.com/package/bcrypt) you can pass 
`bcrypt` options when generating an hash, like the number of salt rounds:

```javascript
const config = { saltRounds: 2 };
const password = passwordHash.generate('my-password', config);
```


