const express = require('express')
const http = require('http')
const { ApolloServer } = require('apollo-server-express')
const { PubSub } = require('apollo-server-express')
const { PrismaClient } = require('@prisma/client')
const { getUserId } = require('./utils')

const Query = require('./resolvers/Query')
const Mutation = require('./resolvers/Mutation')
const Subscription = require('./resolvers/Subscription')
const User = require('./resolvers/User')
const Link = require('./resolvers/Link')
const Vote = require('./resolvers/Vote')

const fs = require('fs')
const path = require('path')
const prisma = new PrismaClient()
const pubsub = new PubSub()

async function startApolloServer() {

  const resolvers = {
    Query,
    Mutation,
    Subscription,
    User,
    Link,
    Vote
  }

  const server = new ApolloServer({
    typeDefs: fs.readFileSync(
      path.join(__dirname, 'schema.graphql'),
      'utf8'
    ),
    resolvers,
    context: ({ req }) => {
      return {
        ...req,
        prisma,
        pubsub,
        userId: req && req.headers.authorization ? getUserId(req) : null
      }
    },
  })
  await server.start();

  const app = express();
  server.applyMiddleware({ app });
  
  const httpServer = http.createServer(app);
  server.installSubscriptionHandlers(httpServer);

  await new Promise(resolve => httpServer.listen({ port: 4000 }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`);
  return { server, app };
}

startApolloServer();