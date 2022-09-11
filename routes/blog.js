import chalk from 'chalk';
/**
 * Encapsulates the routes
 * @param {FastifyInstance} fastify  Encapsulated Fastify Instance
 * @param {Object} options plugin options, refer to https://www.fastify.io/docs/latest/Reference/Plugins/#plugin-options
 * 
*/

async function blog_post_routes (fastify, options) {
    const db = fastify.mongo.blog.db.collection('blog_post');
    const categories = fastify.mongo.blog.db.collection('categories')

    // FETCH ALL POST WITH OPTIONAL FILTERS
    fastify.route({
        method: 'GET',
        url: '/posts',
        schema: {
            querystring: fastify.getSchema("fetch_posts")
        },
        handler: async (request, reply) => {
            console.log(request.query)
            const response = await db.find(
            request.query.tag ? { "details.tags": { '$in': [request.query.tag] } } : {},
            { limit: Number(request.query.limit), skip: Number(request.query.offset)}).toArray()

            if (response.length === 0) {
                console.log(request.query.tag)
                reply.code(404)
                return [
                    {
                        statusCode: reply.statusCode,
                        message: 'No documents found',
                        prefix: 'create a new post'
                    }
                ]
            }
            return response
        }
    })

    // CREATE NEW POST
    fastify.route({
        method: 'POST',
        url: '/post',
        schema: {
            body: fastify.getSchema("blog_POST")
        },
        preHandler: fastify.auth([ fastify.verifyUser ]),
        handler: async (request, reply) => {
            const documentExists = await db.findOne({ _id: request.body.details.title.toLowerCase().replace(/\s/g, "-") })
            if(documentExists) {
                reply.code(409)
                const error = {
                    statusCode: reply.statusCode,
                    message: 'This document already exists',
                    prefix: 'Attempting duplicate'
                }
                return [error]
            }

            const lowerTags = request.body.details.tags.map(f => f.toLowerCase())
            request.body.details.tags = lowerTags;
            console.log(lowerTags)

            const id = request.body.details.title.toLowerCase().replace(/\s/g, "-");

            const response = await db.insertOne({
                _id: id,
                author: request.body.author,
                date: request.body.date,
                details: request.body.details,
                content: request.body.content,
                views: request.body.views
            })
            return [{
                ...response,
                ...request.body.details
            }]
        }
    })

    // GET POST BY ID
    fastify.route({
        method: 'GET',
        url: '/post/:id',
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                }
            }
        },
        handler: async (request, reply) => {
            const doc = await db.findOne({ _id: request.params.id })
            if(!doc) {
                reply.status(404)
                return [
                    {
                        statusCode: reply.statusCode,
                        message: 'Wrong path or Document does not exist',
                        prefix: 'Document not found',
                    }
                ]
            }
            reply
            .status(200)
            // .send([
            //     {
            //         statusCode: reply.statusCode,
            //         message: `Document with title '${doc.details.title}' has been fetched`,
            //         prefix: 'Document successfully fetched',
            //         document: doc
            //     }
            // ])
            .send(doc)
        }
    })

    // UPDATE POST BY ID
    fastify.route({
        method: 'PUT',
        url: '/post/:id',
        schema: fastify.getSchema("patch_post"),
        preHandler: fastify.auth([ fastify.verifyUser ]),
        handler: async (request, reply) => {
            const body = request.body;

            /* CHECK IF CATEGORY_EXISTS: FEATURE ON HOLD
            const categoryExists = await categories.findOne({ title: request.body.details.category })
            if(!categoryExists) {
                const availableCategories = await categories.find().toArray();
                console.log(availableCategories)
                reply.code(400)
                return [
                    {
                        statusCode: reply.statusCode,
                        message: 'No such category found',
                        prefix: 'create new category first'
                    }
                ]
            }
            */

            // CHECK IF DOCUMENT EXISTS
            const documentDB = await db.findOne({ _id: request.params.id })
            if(!documentDB) {
                reply.status(404)
                return [
                    {
                        statusCode: reply.statusCode,
                        message: 'Wrong path or Document does not exist',
                        prefix: 'Document not found',
                    }
                ]
            }
            // INCREMENT VIEWS
            let views = documentDB.views; const newViews = views++;
            console.log(views); console.log(body)

            const doc = await db.updateOne(
            { _id: request.params.id },
            {
                $set: {
                    views: request.query.views === false || "false" ? documentDB.views : request.query.views === true || "true" && documentDB.views > 0 ? views : 1,
                    "details.title": body ?. details ?. title ? body.details.title : documentDB.details.title,
                    "details.tags": body ?. details ?. tags ? body.details.tags : documentDB.details.tags,
                    "details.description": body ?. details ?. description ? body.details.description : documentDB.details.description,
                    "details.placeholder": body ?. details ?. placeholder ? body.details.placeholder : documentDB.details.placeholder,
                }
            })

            if(!doc) {
                reply.status(404)
                return [
                    {
                        statusCode: reply.statusCode,
                        message: `Wasn't able to update post! Check back and try again`,
                        prefix: 'Update failed',
                    }
                ]
            }
            reply
            .status(200)
            .send([
                {
                    statusCode: reply.statusCode,
                    message: 'Document has been updated',
                    prefix: 'Document successfully fetched',
                    document: doc
                }
            ])
        }
    })

    // DELETE POST BY ID
    fastify.route({
        method: 'DELETE',
        url: '/post/:id',
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                }
            }
        },
        preHandler: fastify.auth([ fastify.verifyUser ]),
        handler: async (request, reply) => {
            const doc = await db.findOne({ _id: request.params.id })
            if(!doc) {
                reply.status(404)
                return [
                    {
                        statusCode: reply.statusCode,
                        message: 'Wrong path or Document does not exist',
                        prefix: 'Document not found',
                    }
                ]
            }
            const response = await db.deleteOne({ _id: request.params.id });
            reply
            .status(200)
            .send([
                {
                    statusCode: reply.statusCode,
                    message: 'Document with title has been deleted',
                    prefix: 'Document deleted successfully'
                }
            ])
        }
    })

    // SEARCH BLOG POST DATABASE
    fastify.route({
        method: 'GET',
        url: '/search',
        schema: {
            querystring: {
                type: 'object',
                required: [ "query" ],
                properties: {
                    query: { type: 'string'},  
                },
                anyOf: [
                    {
                        properties: {
                            path: {
                                type: 'array',
                                items: { type: "string" },
                                uniqueItems: true,
                            },
                        }
                    },
                    {
                        properties: {
                            path: { type: 'string' }
                        }
                    }
                ]
            }
        },
        handler: async (request, reply) => {
            console.log(request.query)
            const result = await db.aggregate([
                {
                    "$search": {
                        "index": 'searchByTitle',
                        "text": {
                            "query": request.query.query,
                            "path": ["details.tags", "details.title", "details.description", "content.copy"]
                        }
                    }
                }
            ]).toArray()

            if (result.length === 0) {
                console.log(request.query.query)
                reply.code(404)
                return [
                    {
                        statusCode: reply.statusCode,
                        message: `No documents found for query: ${request.query.query}`,
                        prefix: 'Choose new search term'
                    }
                ]
            }
            
            reply
            .status(200)
            .send(result)
        }
      })

    // LIST ALL AVAILABLE TAGS IN THE ENTIRE DATABASE
    fastify.route({
        method: 'GET',
        url: '/tags',
        handler: async (request, reply) => {
            const cursor = await db.distinct("details.tags");
            console.dir(cursor);
            reply.status(200).send(cursor)
        }
    })
    
}

export default blog_post_routes;