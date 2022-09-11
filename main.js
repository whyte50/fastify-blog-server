// Require the framework and instantiate it
import Fastify from 'fastify';
import chalk from 'chalk';
// IP ADDRESS
import { networkInterfaces } from 'os';
import ip from 'ip'
import crypto from "crypto";
// CUSTOM SCHEMA && STRING FORMATTING
import Ajv from 'ajv';
import ajvErrors from 'ajv-errors';
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true, useDefaults: true });
ajvErrors(ajv); addFormats(ajv);

const fastify = Fastify({ logger: true })

fastify.setValidatorCompiler(({ schema, method, url, httpPart }) => {
  return ajv.compile(schema)
})

// INITIATE IP ADDRESS
const nets = networkInterfaces();
const results = Object.create(null); // Or just '{}', an empty object

// LOOP THROUGH ~NETWORKINTERFACE~ 
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
    // 'IPv4' is in Node <= 17, from 18 it's a number 4 or 6
    const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
    if (net.family === familyV4Value && !net.internal) {
      if (!results[name]) { results[name] = [] }
      results[name].push(net.address);
    }
  }
}

// convert the RESULTS object to a STRING
const newIP = JSON.parse(JSON.stringify(results));
const nextIP = Object.entries(newIP);
// console.info(nextIP);

// IP ADDRESS
const local = nextIP[0][1][0]
const network = nextIP[1][1][0];
const personal = ip.address();

const port = process.env.PORT || 3300
// const network = 'unavailbale';
// const local = 'unavailbale';

console.info(chalk.cyanBright(network, local, personal));
console.info(crypto.randomBytes(20).toString('hex'));
console.log(chalk.greenBright(new Date().toDateString()))
// Declare a route

fastify.register(import('@fastify/cors'), {
  credentials: true,
  origin: '*'
})
fastify.register(import('@fastify/auth'))
fastify.register(import("@fastify/jwt"), {
  secret: 'fbaadf3013fa3a47e93e743f87bdeeff147b22c2'
});
fastify.register(import('@fastify/cookie'), {
  secret:
  // '343d039aa2cb9172adde2777840a170207cc53b7'
  ['f30456d703df3aef09af5eb7a5bfc8f15d7acb79', 'a70b220dbb8e3d6082b5edb0a5f55b306a6ad6f2', 'df7610c3b529da604128a9e26fd7a4cc4ae5dd59']
})
fastify.register(import('./plugins/fastify-env.js'))
fastify.register(import('./plugins/view.js'))
fastify.register(import('./plugins/decorators.js'))
fastify.register(import('./plugins/mongodb.js'));
fastify.register(import('./plugins/graphql.js'))
fastify.register(import('./plugins/schema.js'))
fastify.register(import('./routes/paths.js'))
fastify.register(import('./routes/auth.js'))
fastify.register(import('./routes/blog.js'),{ prefix: '/v1' })
fastify.register(import('./routes/image.cloudinary.js'),{ prefix: '/image' })

fastify.listen({ port: port }, function (err, address) {
  if (err) { fastify.log.error(err); process.exit(1) }
  console.log(chalk.blue(`server listening on ${address} & `), chalk.blue(`ip ${network}`))
  fastify.log.info(`server listening on ${address}, ${network}`)
})