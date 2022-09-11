import { ObjectId } from '@fastify/mongodb';
import chalk from 'chalk';
/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 */

async function routes (fastify, options) {
  const collection = fastify.mongo.guides.db.collection('planets')
  const db = fastify.mongo.blog.db.collection('blog_post');

  // fastify.addHook('preHandler', fastify.auth([
  //   fastify.verifyAdmin
  // ]))

  fastify.get('/', async (request, reply) => {
    return reply.view("pages/index.ejs")
  })

  fastify.get('/about', async (request, reply) => {
    return reply.view("pages/about.ejs")
  })

  fastify.get('/post/:id', async (request, reply) => {
    const response = await fastify.get_post(request.params.id, db)
    console.log(response)
    return reply.view("pages/single-post.ejs", { data: response })
  })

  // server.get('/vite', async (req, reply) => {
  //   reply.html(await reply.render())
  // })

  fastify.get('/all-planets', async (request, reply) => {
    const result = await collection.find().toArray()
    if (result.length === 0) {
      throw new Error('No documents found')
    }
    return result
  })

  const listingSchema = {
    schema: {
      queryString: {
        type: 'object',
        properties: {
          hasRings: {
            type: 'boolean',
            default: false
          },
          name: {
            type: 'string',
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            name: { type: 'object' },
            orderFromSun: { type: 'number'}
          }
        }
      }
    }
  }

  fastify.get('/planets', { listingSchema }, async (request, reply) => {
    const query = JSON.parse(JSON.stringify(request.query))
    const result = await collection.find({ hasRings: query.hasRings === "true" ? true : false }).toArray()
    if (!result) {
      console.log(chalk.yellow('Listing not found'))
      console.log(query)
      reply.code(404)
      throw new Error('Listing not found');
    }
    console.log(Boolean(query.hasRings))
    console.log(chalk.redBright(result))
    return result
  })

  // TESTING GRAPHQL FOR BACKEND
  fastify.get('/graph', async function (req, reply) {
    const query = '{ planets{ name, orderFromSun } }'
    return reply.graphql(query)
  })
}

export default routes