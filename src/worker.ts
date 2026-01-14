import { ApolloServer } from '@apollo/server';
import { typeDefs } from './schema';
import { resolvers } from './resolvers.worker';

/**
 * Cloudflare Workers handler for Apollo GraphQL Server
 */

// Create Apollo Server instance
const server = new ApolloServer({
  typeDefs,
  resolvers,
  introspection: true, // Enable GraphQL introspection for GraphiQL
});

// Start the server (required for Apollo Server 4)
await server.start();

/**
 * Cloudflare Workers fetch handler
 */
export default {
  async fetch(request: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Serve GraphiQL interface on GET /
    if (request.method === 'GET' && url.pathname === '/') {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ollama Models GraphQL API</title>
  <style>
    body {
      height: 100%;
      margin: 0;
      width: 100%;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    #graphiql {
      height: 100vh;
    }
  </style>
  <script
    crossorigin
    src="https://unpkg.com/react@18/umd/react.production.min.js"
  ></script>
  <script
    crossorigin
    src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
  ></script>
  <link rel="stylesheet" href="https://unpkg.com/graphiql/graphiql.min.css" />
</head>
<body>
  <div id="graphiql">Loading...</div>
  <script
    src="https://unpkg.com/graphiql/graphiql.min.js"
    type="application/javascript"
  ></script>
  <script>
    const fetcher = GraphiQL.createFetcher({
      url: '/graphql',
    });
    
    const root = ReactDOM.createRoot(document.getElementById('graphiql'));
    root.render(
      React.createElement(GraphiQL, {
        fetcher,
        defaultQuery: \`# Welcome to Ollama Models GraphQL API
# 
# Type queries below and press Ctrl+Enter to execute.
# 
# Example queries:

# 1. List all models (first 10)
query ListModels {
  models(limit: 10) {
    lastUpdated
    totalModels
    models {
      name
      description
      capabilities
      sizes
      url
    }
  }
}

# 2. Search models by name
query SearchByName {
  models(filter: { nameContains: "qwen" }) {
    totalModels
    models {
      name
      description
    }
  }
}

# 3. Get a specific model
query GetModel {
  model(name: "qwen2.5-coder:32b") {
    name
    description
    capabilities
    sizes
    url
  }
}

# 4. Get all available capabilities
query GetCapabilities {
  capabilities
}

# 5. Get all available sizes
query GetSizes {
  sizes
}
\`,
      })
    );
  </script>
</body>
</html>
      `.trim();

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Handle GraphQL requests
    if (request.method === 'POST' && url.pathname === '/graphql') {
      try {
        const body = await request.json();
        
        // Execute GraphQL query using Apollo Server
        const response = await server.executeOperation(body as any, {
          contextValue: { request, env, ctx },
        });

        // Handle errors
        if (response.body.kind === 'single' && 'errors' in response.body.singleResult) {
          return new Response(
            JSON.stringify(response.body.singleResult),
            {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }

        // Return successful response
        return new Response(
          JSON.stringify(response.body.kind === 'single' ? response.body.singleResult : response.body),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ 
            errors: [{ 
              message: error instanceof Error ? error.message : 'Internal server error' 
            }] 
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // Handle GET requests to /graphql (for GraphiQL compatibility)
    if (request.method === 'GET' && url.pathname === '/graphql') {
      const query = url.searchParams.get('query');
      if (!query) {
        return new Response('GET requests to /graphql require a ?query parameter', {
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' },
        });
      }

      try {
        const variablesParam = url.searchParams.get('variables');
        const response = await server.executeOperation({
          query,
          variables: variablesParam ? JSON.parse(variablesParam) : undefined,
        } as any, {
          contextValue: { request, env, ctx },
        });

        return new Response(
          JSON.stringify(response.body.kind === 'single' ? response.body.singleResult : response.body),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      } catch (error) {
        return new Response(
          JSON.stringify({ 
            errors: [{ 
              message: error instanceof Error ? error.message : 'Internal server error' 
            }] 
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }
    }

    // 404 for other routes
    return new Response('Not Found', {
      status: 404,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  },
};
