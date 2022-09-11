// ESM
import fastifyPlugin from 'fastify-plugin'
import fastifyMongo from '@fastify/mongodb'
import chalk from 'chalk'

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
*/

async function dbConnector (fastify, done) {
  fastify
  .register(fastifyMongo, {
    url: 'mongodb+srv://emmanuel:nHNRYJbkPF052lgC@lifestyle.yzax378.mongodb.net/sample_guides',
    name: 'guides'
  })
  .register(fastifyMongo, {
    url: 'mongodb+srv://emmanuel:nHNRYJbkPF052lgC@lifestyle.yzax378.mongodb.net/sample_analytics',
    name: 'users'
  })
  .register(fastifyMongo, {
    url: 'mongodb+srv://emmanuel:nHNRYJbkPF052lgC@lifestyle.yzax378.mongodb.net/lifestyle_blog',
    name: 'blog'
  })
  fastify.ready(err => {
    if(err) return done(new Error(err))
    console.log(chalk.greenBright(`mongoDB connected successfully`))
  })
}

// Wrapping a plugin function with fastify-plugin exposes the decorators
// and hooks, declared inside the plugin to the parent scope.
export default fastifyPlugin(dbConnector)