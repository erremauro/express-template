const express = require('express');
const router = express.Router();
const HttpStatus = require('../../core/http-status');
const JsonResponse = require('../../core/json-response');
const Users = require('../repos/Users');

/* GET user listing */
router.get('/', (req, res, next) => {
  Users.getAll()
    .then(users => {
      JsonResponse.OK(res, users);
    })
    .catch(err => {
      JsonResponse.ServerError(res, err.message);
    })
});

/* GET user by id. */
router.get('/:id', (req, res, next) => {
  Users.getById(req.params.id)
    .then(user => {
      if (!user) {
        return JsonResponse.NotFound(res,
          `A user with id ${req.params.id} cannot be found.`
        );
      }
      JsonResponse.OK(res, user);
    })
    .catch(err => {
      JsonResponse.ServerError(res, err.message);
    });
});

module.exports = router;
