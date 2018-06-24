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
  - [Hashing Passwords](#hashing-passwords)

## Installation

To install Express Template type:

	git clone https://github.com/erremauro/express-pg-template <PROJECT_DIR>
	cd <PROJECT_DIR> && rm -rf .git && yarn install

### Cleaning up the examples

Express Template has some example files to show you how to setup your
project that you might want to remove after checking them out.

Here's a list of these files:

- `migrations/20180624160314_users.js`, a migration example
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

You can customize your database configurations by editing `./knexfile.js`.

## Database

Express Template support PostgreSQL and uses [knex](https://knexjs.org) to
manage database migrations and build queries.

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


