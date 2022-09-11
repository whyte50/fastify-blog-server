import chalk from 'chalk';
/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */

async function users (fastify, options) {
  const db = fastify.mongo.blog.db.collection('users');
   // AUTHENTICATE WITH COOKIES
   fastify.route({
    method: 'POST',
    url: '/cookie',
    schema: {
      body: {
        type: 'object',
        required: [ "passcode" ],
        properties: {
          passcode: { type: 'string' }
        }
      }
    },
    handler: async (request, reply) => {
      if (request.body.passcode !== fastify.config.SITE_PASSWORD_SECRET) {
        reply.status(401)
        return [{
          statusCode: reply.statusCode,
          message: "Authentication failed! incorrect passcode",
          prefix: "Incorrect passcode"
        }]
      }
      const payload = fastify.config.SITE_PASSWORD_SECRET;
      const { statusCode, message, prefix, token } = await fastify.authenticate_user(payload);
      if(statusCode === 400) {
          reply.status(statusCode)
          return [{
              statusCode: statusCode,
              message: message,
              prefix: prefix
          }]
      }
      reply
      .setCookie('auth', token, { path: '/' })
      .status(statusCode)
      .send([
        {
          statusCode: statusCode,
          message: 'Authentication successful',
          prefix: 'Cookie auth header set'
        }
      ])
    }
  })
}

export default users