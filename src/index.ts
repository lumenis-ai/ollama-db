import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { typeDefs } from './schema';
import { resolvers } from './resolvers';

/**
 * Initialize and start the Apollo Server
 */
async function startServer() {
  // Create Apollo Server instance
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true, // Enable GraphQL introspection
  });

  // Start the standalone server
  const { url } = await startStandaloneServer(server, {
    listen: { port: Number(process.env.PORT) || 4000 },
  });

  console.log(`🚀 GraphQL Server ready at: ${url}`);
  console.log(`📊 Query your Ollama models database at: ${url}`);
  console.log(`\n💡 Example queries:`);
  console.log(`   - List all models: { models { models { name } } }`);
  console.log(`   - Search by name: { models(filter: { nameContains: "qwen" }) { models { name } } }`);
  console.log(`   - Get capabilities: { capabilities }`);
}

// Start the server
startServer().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});
