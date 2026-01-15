import { ApolloServer } from '@apollo/server';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';
import { startServerAndCreateCloudflareWorkersHandler } from '@as-integrations/cloudflare-workers';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default'


const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, 
  plugins: [ApolloServerPluginLandingPageLocalDefault()],
})

export default {
  fetch: startServerAndCreateCloudflareWorkersHandler(server),
};