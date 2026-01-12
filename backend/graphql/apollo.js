const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

async function setupApollo(app) {
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
  });
  await apolloServer.start();
  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ')
          ? authHeader.slice(7)
          : null;
        if (token) {
          try {
            const secret = process.env.JWT_SECRET || 'dev_secret_cambia_esto';
            const user = jwt.verify(token, secret);
            return { user };
          } catch (err) {}
        }
        return { user: null };
      },
    })
  );
  return apolloServer;
}

module.exports = {
  setupApollo,
};
