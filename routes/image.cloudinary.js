import chalk from 'chalk';

/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 * 
 * 
*/

async function cloudinary_images (fastify, options) {

    // POST NEW IMAGE
    fastify.route({
        method: 'POST',
        url: '/upload',
        preHandler: fastify.upload(),
        handler: async function(request, reply) {
            console.log(request.file.path);
            console.log(request.body.folder);
            const { url, id, statusCode, message, prefix } = await fastify.cloudinary({
                file: request.file,
                destination: request.body.folder
            })
            if(statusCode) {
                reply
                .status(400)
                .send([{
                    statusCode: reply.statusCode,
                    message: message,
                    prefix: prefix
                }])
            }
            reply.code(200).send({ url: url, id: id })
        },
    })

    // DESTROY IMAGE
    fastify.route({
        method: 'DELETE',
        url: '/destroy',
        schema: {
            body: {
                type: 'object',
                required: ["fileId"],
                properties: {
                    fileId: { type: 'string' }
                },
                errorMessage: "Missing file id"
            }
        },
        preHandler: fastify.auth([ fastify.verifyUser ]),
        handler: async function(request, reply) {
            const { statusCode, message, prefix } = await fastify.cloudinary({
                method: "destroy", imageId: request.body.fileId
            })
            if(statusCode) {
                reply
                .status(400)
                .send([{
                    statusCode: reply.statusCode,
                    message: message,
                    prefix: prefix
                }])
            }
            reply.code(200).send({
                statusCode: reply.statusCode,
                message: message
            })
        },
    })

    fastify.route({
        method: 'POST',
        url: '/upload-experiment',
        preHandler: fastify.upload(),
        handler: async function(request, reply) {
            console.log(request.file);
            console.log(request.body.folder);
            reply.code(200).send({ request: request.body.folder, file: request.file.path })
        },
    })
}

export default cloudinary_images;