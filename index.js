import express from 'express';
// graphql
import {ApolloServer} from 'apollo-server-express';
import {typeDefs} from './database/schema';
import {resolvers} from './database/resolvers'

const app = express();
const server = new ApolloServer({typeDefs, resolvers});

server.applyMiddleware({app});

app.listen({port: 4000}, () => console.log(`Servidor andando PERFEKTO. (${server.graphqlPath})`));