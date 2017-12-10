/**
 * Drop and create "Migrations" table to keep track of applied
 * database migrations.
 */

const createMigrationsTable = `
  DROP TABLE IF EXISTS "schema_migrations";
  CREATE TABLE "schema_migrations" ("version" varchar NOT NULL PRIMARY KEY);
`;

/**
 * Compose a setup query. Add other queries here to bootstrap your database.
 */

const setupQuery = `
  ${createMigrationsTable}
`;

module.exports = setupQuery;
