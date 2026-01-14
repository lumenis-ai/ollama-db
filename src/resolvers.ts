import { dataLoader } from './data-loader';
import { ModelFilter } from './types';

/**
 * GraphQL Resolvers
 */
export const resolvers = {
  Query: {
    /**
     * Query all models with optional filtering and pagination
     */
    models: (
      _parent: unknown,
      args: {
        filter?: ModelFilter;
        limit?: number;
        offset?: number;
      }
    ) => {
      const { filter, limit, offset } = args;
      const allData = dataLoader.getAllModels();
      const filteredModels = dataLoader.filterModels(filter, limit, offset);

      return {
        lastUpdated: allData.last_updated,
        totalPages: allData.total_pages,
        totalModels: filteredModels.length,
        models: filteredModels,
      };
    },

    /**
     * Query a single model by exact name
     */
    model: (
      _parent: unknown,
      args: { name: string }
    ) => {
      return dataLoader.getModelByName(args.name);
    },

    /**
     * Get all unique capabilities
     */
    capabilities: () => {
      return dataLoader.getUniqueCapabilities();
    },

    /**
     * Get all unique sizes
     */
    sizes: () => {
      return dataLoader.getUniqueSizes();
    },
  },
};
