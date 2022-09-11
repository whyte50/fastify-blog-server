import fastifyPlugin from 'fastify-plugin';
import { v2 as cloudinary } from 'cloudinary'
import chalk from 'chalk';

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
*/

async function fastifyEnv (fastify, done) {
    
    const schema = {
        type: 'object',
        properties: {
            CLOUDINARY_CLOUD: {
                type: 'string',
                // default: 'whytewebart'
            },
            CLOUDINARY_KEY: {
                type: 'string',
                // default: '846796132435827'
            },
            CLOUDINARY_SECRET: {
                type: 'string',
                // default: 'YKba4lRQOW8BvM8tW-LJSZMpSg0'
            },
            SITE_PASSWORD_SECRET: {
                type: 'string'
            },
            PORT: {
                type: 'number',
                default: 3300
            }
        }
    }
    const options = {
        confKey: 'config',
        dotenv: true,
        schema: schema,
        data: process.env
    }

    fastify.register(import("@fastify/env"), options);
    fastify.ready(err => {
        if(err) return done(new Error(err))
        console.log(chalk.blueBright(`ENV initialized successfully`))
    })
}

export default fastifyPlugin(fastifyEnv)