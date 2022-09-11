import fastifyPlugin from 'fastify-plugin';
import chalk from 'chalk'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url';
import ejs from 'ejs';

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
*/

async function render (fastify, done) {

    const __dirname = dirname(fileURLToPath(import.meta.url));
    console.log(chalk.redBright(path.join(__dirname, "src/pages")))

    fastify.register(import("@fastify/view"), {
        engine: {
          ejs: ejs,
        },
        root: path.join(__dirname, "../", "src"),
        layout: "layouts/default"
    });

    fastify.register(import('@fastify/static'), {
        root: path.join(__dirname, "../", "src"),
        prefix: '/public/',
    })

    fastify.ready(err => {
        if(err) return done(new Error(err))
        console.log(chalk.blueBright(`EJS initialized successfully`))
    })
}

export default fastifyPlugin(render)