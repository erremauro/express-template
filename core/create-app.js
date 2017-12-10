const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const cors = require('cors');
const logger = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const index = require('../routes/index');
const users = require('../routes/users');

module.exports = createApp;

/////////////////////////////

function createApp(opts) {
  const app = express();

  // view engine setup
  app.set('views', path.join(__dirname, '../views'));
  app.set('view engine', 'pug');

  // uncomment after placing your favicon in /public
  //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

  if (opts.verbose) {
    app.use(logger('dev'));
  }

  if (opts.gzip) {
    app.use(compression());
  }

  // enable cors if specified. For more information about cors options
  // see: https://github.com/expressjs/cors
  if (opts.cors) {
    let corsOptions = { optionsSuccessStatus: 200 };
    if (typeof opts.cors === 'string') {
      console.log('CORS Allowed Headers: ' + opts.cors);
      corsOptions = Object.assign(corsOptions, { allowedHeaders: opts.cors });
    }
    app.use(cors(corsOptions));
  }

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, '../public')));

  app.use('/', index);
  app.use('/users', users);

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  // error handler
  app.use((err, req, res, next) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
  });

  app.set('port', opts.port, opts.address);

  return app;
}
