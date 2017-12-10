#! /usr/bin/env node
const path = require('path');
const program = require('commander');
const migration = require('./lib/migration');
const Query = require('../core/db/query');
const logger = require('rear-logger')('db-script', {
  levels: {
    created: 'green',
    migrated: 'blue',
    rolledback: 'blue'
  }
});

if (require.main === module) {
  Main(process.argv);
}

/////////////////////////////////

function Main(args) {
  program
    .command('setup')
    .description('Setup the database')
    .action(setupDatabase);

  program
    .command('generate')
    .arguments('<name>')
    .description('Generate a new migration')
    .action(createMigration);

  program
    .command('migrate')
    .description('Run migrations')
    .option('-t, --timestamp [timestamp]')
    .action(migrate);

  program
    .command('rollback')
    .description('Rollback migrations')
    .option('-t, --timestamp [timestamp]')
    .action(rollback);

  program.parse(args);
}

/**
 * Initialize the database with the query specified in `./db/setup`
 *
 * @return {void}
 */

function setupDatabase() {
  const queryText = require('../db/setup');

  Query.exec(queryText)
    .then(() => {
      logger.success('Database initialized.');
      process.exit(0);
    })
    .catch((err) => {
      logger.error('Database connection failed. ' + err.message);
      process.exit(0);
    });
}

/**
 * Create a new migration
 *
 * @param {string} name Migration name
 * @return {void}
 */

function createMigration(name) {
  migration.create(name)
    .then(filename => {
      logger.created('./' + path.relative(process.cwd(), filename));
    })
    .catch(err => {
      logger.error(err.message);
    });
}

/**
 * Run all migrations not yet applied. When a timestamp options is provided
 * it will run only migration up until the timestamp specified.
 *
 * @param {object} options Commander options
 * @return {void}
 */

function migrate(options) {
  const {timestamp} = options;
  let migrations;

  migration.getMigrations(timestamp)
    .then((results) => {
      if (Object.keys(results).length === 0) {
        logger.info('Nothing to migrate.');
        process.exit(0);
      }

      migrations = results;

      return migration.schemaExists();
    })
    .then((exists) => {
      if (!exists) {
        logger.warn(
          'Schema migrations table could not be found. ' +
          'Run "yarn db-setup" before running "yarn db-migrate"');
        process.exit(0);
      }

      return migration.getLatest();
    })
    .then(latest => {
      if (timestamp <= latest) {
        logger.warn(
          'You are trying to run migrations already applied. Your latest ' +
          'applied migration has a timestamp of "' + latest + '". Rollback ' +
          'your migrations before trying to apply them again.'
        );
        process.exit(0);
      }

      return migration.run(migrations, latest)
    })
    .then((applied) => {
      applied.map(migration => logger.migrated(path.basename(migration)));

      if (applied.length == 0) {
        logger.info('Already up to date.');
      } else {
        logger.success('Migrations applied.');
      }

      process.exit(0);
    })
    .catch((err) => {
      logger.error(`Database migration failed. ${err.message}`);
      process.exit(0);
    });
}

/**
 * Rollback the last applied migration. When a timestamp options is provided
 * it will rollback migrations up until the timestamp specified.
 *
 * @param {object} options Commander options
 * @return {void}
 */

function rollback(options) {
  const {timestamp} = options;
  let targetTimestamp;

  migration.schemaExists()
    .then(exists => {
      if (!exists) {
        logger.warn(
          'Schema migrations table could not be found. ' +
          'Run "yarn db-setup" before running "yarn db-migrate".'
        );
        process.exit(0);
      }

      return migration.getLatest();
    })
    .then(latest => {
      if (latest === -1) {
        logger.info('Nothing to rollback.');
        process.exit(0);
      }

      if (timestamp > latest) {
        logger.warn(
          'You are trying to rollback a migrations not yet applied. Your ' +
          'latest applied migration has a timestamp of "' + latest + '". '
        );
        process.exit(0);
      }

      targetTimestamp = timestamp ? timestamp : latest;

      return migration.getMigrations(latest, true);
    })
    .then(migrations => migration.tearDown(migrations, targetTimestamp))
    .then(rolledback => {
      rolledback.forEach(migration => {
        logger.rolledback(path.basename(migration))
      });

      if (rolledback.length == 0) {
        logger.info('Already up to date.');
      } else {
        logger.success('Migrations rolledback.');
      }

      process.exit(0);
    })
    .catch((err) => {
      logger.error(`Database migration rollback failed. ${err.message}`);
      process.exit(0);
    });
}
