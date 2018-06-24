
exports.up = function(knex, Promise) {
  return knex.schema.createTable('users', table => {
    table.increments();
    table.string('username', 60);
    table.string('password', 60);
    table.string('email'); // 255 is the default value
    table.boolean('verified');
    table.integer('created_by').references('users.id');
    table.integer('updated_by').references('users.id');
    table.timestamps();
  });
};

exports.down = function(knex, Promise) {
  return knex.schema.dropTable('users');
};
