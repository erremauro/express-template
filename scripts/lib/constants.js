/**
 * Define the migration content template.
 */

const MIGRATION_TEMPLATE = `
/**
 * Apply database changqes.
 */

const up = \`
  DROP TABLE IF EXISTS $1;
  CREATE TABLE $1 (
    id serial PRIMARY KEY,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
  );
\`;

/**
 * Revert database changes.
 */

const down = \`
  DROP TABLE IF EXISTS $1;
\`;

module.exports = { up, down };
`;

/**
 * Define a SQL query that check for 'schema_migrations' table existance.
 */

const QUERY_SCHEMA_MIGRATION_EXISTS = `
SELECT EXISTS (
  SELECT 1
  FROM   information_schema.tables
  WHERE  table_name = 'schema_migrations'
);
`;

/**
 * Define a SQL query that get the last migration version available in the
 * database
 */

const QUERY_LAST_MIGRATION = `
SELECT   version
FROM     "schema_migrations"
ORDER BY version DESC
LIMIT    1;
`;

module.exports = {
  MIGRATION_TEMPLATE,
  QUERY_SCHEMA_MIGRATION_EXISTS,
  QUERY_LAST_MIGRATION
};


