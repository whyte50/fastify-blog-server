// ESM
import fastifyPlugin from 'fastify-plugin'
import mercurius from 'mercurius'
import chalk from 'chalk'
import { ObjectId } from '@fastify/mongodb';

/**
 * @param {FastifyInstance} fastify
 * @param {Object} options
*/

async function graphQL (fastify, done) {
    const db = fastify.mongo.guides.db.collection('planets');
    const usersDB = fastify.mongo.users.db.collection('customers');
    
    const schema = `

        interface Details {
            _id: String!
        }

        type Temp {
            min: String
            max: String
            mean: String!
        }

        type Surface implements Details {
            orderFromSun: Int!
            name: String!
            hasRings: Boolean!
            _id: String!
            surfaceTemperatureC: Temp!
        }

        type MainAtmos implements Details {
            orderFromSun: Int!
            name: String!
            hasRings: Boolean!
            _id: String!
            mainAtmosphere: [String]
        }

        type User implements Details {
            _id: String!
            username: String!
            active: Boolean!
            email: String!
            accounts: [String]
        }

        union SearchResult = Surface | User

        type Query {
            add(x: Int, y: Int): Int
            planets: [MainAtmos]
            single_planet(id: String!): Surface
            search(text: String!): [SearchResult!]
            searchUsers(text:String!): [User]
        }
    `
    const resolvers = {
        Query: {
            add: async (_, { x, y }) => x + y,
            planets: async (_, args, context, info) => {
                const result = await db.find().toArray();
                return result
            },
            single_planet: async (_, args, context, info) => {
                const result = await db.findOne({ _id: ObjectId(args.id) })
                return result
            },
            search: async (_, { text }, context, info) => {
                const result = await db.aggregate([{
                    '$search': {
                      'index': 'default',
                      'text': {
                        'query': text,
                        'path': {
                          'wildcard': '*'
                        }
                      }
                    }
                  }]).toArray();

                const response = await usersDB.aggregate([{
                    '$search': {
                      'index': 'customers',
                      'text': {
                        'query': text,
                        'path': {
                          'wildcard': '*'
                        }
                      }
                    }
                  }]).toArray();
                // return result
                const finalResponse = [...result, ...response];
                return finalResponse
            },
            searchUsers: async (_, { text }, context, info) => {
                const response = await usersDB.aggregate([{
                    '$search': {
                      'index': 'customers',
                      'text': {
                        'query': text,
                        'path': {
                          'wildcard': '*'
                        }
                      }
                    }
                }]).toArray();
                return response
            }
        },
        SearchResult: {
          resolveType: (parameter, context, info) => {
            // return username ? 'User' : 'Surface'
            if (parameter.hasRings) {
              return 'Surface';
            }

            if (parameter.username) {
              return 'User';
            }
          }
        },
    }

    fastify.register(mercurius, {schema, resolvers})
    fastify.ready(err => {
        if(err) return done(new Error(err))
        console.log(chalk.red(`GraphQl initialized successfully`))
    })
}

// Wrapping a plugin function with fastify-plugin exposes the decorators
// and hooks, declared inside the plugin to the parent scope.
export default fastifyPlugin(graphQL)