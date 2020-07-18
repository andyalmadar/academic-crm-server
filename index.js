import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { typeDefs } from './database/schema';
import { resolvers } from './database/resolvers'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config({
    path: "variables.env"
});

const app = express();
const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async({ req }) => {
        // Obtener lo que establecí en setContext en el App.js del cliente
        const token = req.headers['authorization'];

        if (token !== "null") {
            try {
                // Verifico el token del cliente (del lado del front)
                const usuarioActual = await jwt.verify(token, process.env.SECRETO);
                // Agrego a cada request el usuario actual
                req.usuarioActual = usuarioActual;

                return {
                    usuarioActual
                }
            } catch(error) {
                console.error(error);
            }
        }
    }
});

server.applyMiddleware({app});

app.listen({port: 4000}, () => console.log(`Servidor andando PERFEKTO. (${server.graphqlPath})`));