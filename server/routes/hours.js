var Joi = require('Joi');
var Boom = require('Boom');
var Path = require('path');
var db = require(Path.join(__dirname, '../data/db.js'));
var schemas = require('../data/schemas.js');

routes = [
  {
    method: 'GET',
    path: '/hours',
    handler: function (request, reply) {
      var offset = request.query.offset;
      var limit = request.query.limit;
      var items = db.hours.chain().sortBy('id').slice(offset, offset + limit).value();
      reply({
        items: items,
        size: items.length,
        total: db.hours.size(),
        offset: offset,
        limit: limit
      });
    },
    config: {
      validate: {
        query: {
          offset: Joi.number().integer().min(0).max(100).default(0),
          limit: Joi.number().integer().min(1).max(100).default(10)
        }
      },
      description: 'list hours',
      notes: '<p>This method use pagination.</p>' +
      '<p>Query parameters:' +
      '<ul>' +
      '<li>offset: offset used (default 0)</li>' +
      '<li>limit: max items returned (default 10)</li></br></p>',
      tags: ['api', 'hours'],
      response: {
        schema: schemas.hours,
        status: {
          400: schemas.validationError
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/hours/{id}',
    handler: function (request, reply) {
      var session = db.hours.getById(request.params.id);
      if (session) {
        reply(session);
      } else {
        reply(Boom.notFound());
      }
    },
    config: {
      description: 'get hour by id',
      tags: ['api', 'hours'],
      response: {
        schema: schemas.hour,
        status: {
          404: schemas.error
        }
      }
    }
  }
];

exports.routes = function (server) {
  server.route(routes);
};