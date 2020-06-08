import {importSchema} from 'graphql-import';

const typeDefs = importSchema('database/schema.graphql');

export {typeDefs};