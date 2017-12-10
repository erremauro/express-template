const home = require('./home');
const users = require('./users');

module.exports = configureRoutes;

//////////////////////////////////

function configureRoutes(app) {
  app.use('/', home);
  app.use('/users', users);
}
