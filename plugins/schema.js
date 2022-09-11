import fastifyPlugin from 'fastify-plugin';
import chalk from 'chalk';
// import localize from 'ajv-i18n';

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
*/

async function schema (fastify, done) {

    // GLOBAL CUSTOM ERROR
    fastify.setErrorHandler(function (error, request, reply) {
        if (error.validation) {
        //   localize.en(error.validation)
            reply.status(400)
            const newError = []
            error.validation.forEach((item) => {
                newError.push({
                    statusCode: reply.statusCode,
                    message:item.message,
                    prefix: item.params.errors ? item.params.errors[0].message : item.params.missingProperty
                })
            });
            reply.send(newError)
            return
        }
        reply.send(error)
    })

    // BODY SCHEMA FOR BLOG POST
    fastify.addSchema({
        $id: "blog_POST",
        type: 'object',
        required: ['details', 'content'],
        allOf: [
            {
                properties: {
                    author: { type: 'string', },
                    views: { type: 'integer', default:0 },
                    date: {
                        type: 'object',
                        default: {
                            toRender: new Date().toDateString(),
                            time: new Date().toLocaleTimeString()
                        },
                        properties: {
                            toRender: { type: 'string' },
                            time: { type: 'string' }
                        }
                    },
                    details: {
                        type: 'object',
                        required: ["title", "description", "tags", "category", "placeholder"],
                        properties: {
                            title: {
                                type: 'string', minLength: 5,
                                errorMessage: 'Title must be more than 5 characters long'
                            },
                            description: {
                                type: 'string', minLength: 70,
                                errorMessage: 'Description must be more than 70 characters long'
                            },
                            tags: {
                                type: 'array', maxItems: 5,
                                uniqueItems: true, minItems: 2,
                                items: { type: "string" },
                                errorMessage: "must be at least 2 and 5 maximum tags, current value is ${/details/tags}"
                            },
                            category: {
                                type: 'string',
                                errorMessage: "must have one category"
                            },
                            placeholder: {
                                type: 'object', 
                                required: ["url", "id"],
                                allOf: [{
                                    properties: {
                                        url: { type: 'string', format: "uri"},
                                        id: { type: 'string' }
                                    },
                                }],
                                errorMessage: "Didn't get that, please upload your image again"
                            }
                        }
                    },
                    content: {
                        type: 'object',
                        properties: {
                            markup: { type: 'string', pattern: "<.+?>" },
                            copy: { type: 'string' }
                        }
                    }
                },
                additionalProperties: false,
            }
        ],
        errorMessage: {
            // type: "invalid request, request must be an object",
            properties: {
                details: "Missing one of 'title', 'description', 'tags' and 'category' fields",
                content: "Wasn't able to upload post, please try again later"
            },
            // _: "Invalid request, request cannot be empty"
        }
    })

    // QUERYSTRING SCHEMA TO FETCH ALL POSTS FROM DATABASE
    fastify.addSchema({
        $id: "fetch_posts",
        type: "object",
        properties: {
            limit: { type: "string", default:"0" },
            offset: { type: "string", default:"0" },
            tag: { type: "string" }
        }
    })

    // SCHEMA FOR PATCH REQUEST: UPDATE BLOG POST
    fastify.addSchema({
        $id: "patch_post",
        body: {
            type: "object",
            properties: {
                details: {
                    type: 'object',
                    properties: {
                        title: {
                            type: 'string', minLength: 5,
                            errorMessage: 'Title must be more than 5 characters long'
                        },
                        description: {
                            type: 'string', minLength: 70,
                            errorMessage: 'Description must be more than 70 characters long'
                        },
                        tags: {
                            type: 'array', maxItems: 5,
                            uniqueItems: true, minItems: 2,
                            items: { type: "string" },
                            errorMessage: "tags cannot be less than 2"
                        },
                        placeholder: {
                            type: 'string', format: "uri",
                            errorMessage: "Didn't get that, please upload your image again"
                        }
                    }
                },
                content: {
                    type: 'object',
                    properties: {
                        markup: { type: 'string', pattern: "<.+?>" },
                        copy: { type: 'string' }
                    }
                }
            },
            additionalProperties: false,
        },
        querystring: {
            type: "object",
            properties: {
                views: {
                    type: 'string',
                    enum: ['true', 'false'],
                    default: "false"
                }
            }
        }
    })

    fastify.ready(err => {
        if(err) return done(new Error(err))
        console.log(chalk.blueBright(`Schema initialized successfully`))
    })
}

export default fastifyPlugin(schema)