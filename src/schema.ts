import { gql } from 'graphql-tag';

/**
 * GraphQL Schema definition
 */
export const typeDefs = gql`
  """
  Represents an Ollama model
  """
  type Model {
    name: String!
    description: String!
    capabilities: [String!]!
    sizes: [String!]!
    url: String!
  }

  """
  Response type for models query with metadata
  """
  type ModelsResponse {
    lastUpdated: String!
    totalPages: Int!
    totalModels: Int!
    models: [Model!]!
  }

  """
  Input filter criteria for searching models
  """
  input ModelFilter {
    """
    Filter models by name (case-insensitive partial match)
    """
    nameContains: String

    """
    Filter models by description (case-insensitive partial match)
    """
    descriptionContains: String

    """
    Filter models that have ALL of the specified capabilities
    """
    capabilities: [String!]

    """
    Filter models that have at least ONE of the specified sizes
    """
    sizes: [String!]
  }

  """
  Root Query type
  """
  type Query {
    """
    Search and filter models with optional pagination
    """
    models(
      filter: ModelFilter
      limit: Int
      offset: Int
    ): ModelsResponse!

    """
    Get a single model by exact name
    """
    model(name: String!): Model

    """
    Get all available capabilities across all models
    """
    capabilities: [String!]!

    """
    Get all available sizes across all models
    """
    sizes: [String!]!
  }
`;
