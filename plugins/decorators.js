import fastifyPlugin from 'fastify-plugin';
import cloudinary from 'cloudinary';
import multer from 'fastify-multer'
import chalk from 'chalk';
/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 * 
 * 
*/

async function decorators (fastify, options) {

    cloudinary.config({ 
        cloud_name: fastify.config.CLOUDINARY_CLOUD, 
        api_key: fastify.config.CLOUDINARY_KEY, 
        api_secret: fastify.config.CLOUDINARY_SECRET
    });

    fastify.decorate('cloudinary', async function ({ file, destination, method, imageId }) {
        if(method === 'upload' || method === undefined) {
            const response = await cloudinary.uploader.upload(file.path, (err, result) => { console.log(err) }, {
                folder: destination
            })
            if(!response) {
                return ({
                    message: "check your internet connection and try again",
                    prefix: "Failed to upload image",
                    statusCode: 400
                });
            }
            console.log(response);
            return {
                url: response.url,
                id: response.public_id
            }
        }
        if(method === 'destroy'){
            const response = await cloudinary.uploader.destroy(imageId)
            if(!response) {
                return ({
                    message: "check your internet connection and try again",
                    prefix: "Failed to delete image",
                    statusCode: 400
                });
            }
            console.log(response);
            return { message: "Image deleted successfully" }
        } 
    })

    fastify.decorate('get_post', async (objectId, client) => {
        return await client.findOne({ _id: objectId })
    })

    fastify.decorate('verifyUser', async function (request, reply, done) {
        if(!request.cookies.auth){
            reply
            .status(401)
            .send([
                {
                    statusCode: reply.statusCode,
                    message: 'Your are not authenticated, login and try again',
                    prefix: 'Request blocked! No auth token available'
                }
            ])
        }
        fastify.jwt.verify(request.cookies.auth, (err, decoded) => {
            if (err) {
                fastify.log.error(err);
                reply
                .status(403)
                return [
                    {
                        statusCode: reply.statusCode,
                        message: 'Your session token is invalid! Please login and try again',
                        prefix: 'Unauthoried request! Invalid auth token'
                    }
                ]
            }
            console.log(decoded)
        })
        done()
    })

    fastify.decorate('authenticate_user', (payload) => {
        const token =  fastify.jwt.sign({ payload })
        console.log(chalk.whiteBright(payload))
        console.log(chalk.magentaBright(token))

        if(!token) {
            return {
                statusCode: 400,
                message: 'Failed to authorize token',
                prefix: 'Authentication failed'
            }
        }

        return {
            statusCode: 200,
            token: token,
        }
    })
    
    fastify.decorate('upload', () => {
        const upload = multer({ dest: 'uploads/' })
        return upload.single('image');
    })

    fastify.register(multer.contentParser)
    fastify.ready(err => {
        if(err) return done(new Error(err))
        console.log(chalk.blueBright(`All decorators initialized successfully`))
    })
}

export default fastifyPlugin(decorators);