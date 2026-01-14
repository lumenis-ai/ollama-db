import { Model, ModelsData, ModelFilter } from './types';
// Import the models data directly - will be bundled into the worker
import modelsData from '../data/models.json';

/**
 * DataLoader class for Cloudflare Workers
 * This version doesn't use fs module and loads data directly
 */
class DataLoaderWorker {
  private data: ModelsData;

  constructor() {
    // Load data directly from imported JSON
    this.data = modelsData as ModelsData;
  }

  /**
   * Get all models
   */
  getAllModels(): ModelsData {
    return this.data;
  }

  /**
   * Get a single model by exact name match
   */
  getModelByName(name: string): Model | null {
    const model = this.data.models.find(m => m.name === name);
    return model || null;
  }

  /**
   * Filter models based on provided criteria
   */
  filterModels(filter?: ModelFilter, limit?: number, offset?: number): Model[] {
    let filtered = [...this.data.models];

    if (filter) {
      // Filter by name (case-insensitive partial match)
      if (filter.nameContains) {
        const nameSearch = filter.nameContains.toLowerCase();
        filtered = filtered.filter(model =>
          model.name.toLowerCase().includes(nameSearch)
        );
      }

      // Filter by description (case-insensitive partial match)
      if (filter.descriptionContains) {
        const descSearch = filter.descriptionContains.toLowerCase();
        filtered = filtered.filter(model =>
          model.description.toLowerCase().includes(descSearch)
        );
      }

      // Filter by capabilities (must have ALL specified capabilities)
      if (filter.capabilities && filter.capabilities.length > 0) {
        filtered = filtered.filter(model =>
          filter.capabilities!.every(cap =>
            model.capabilities.includes(cap)
          )
        );
      }

      // Filter by sizes (must have at least ONE of the specified sizes)
      if (filter.sizes && filter.sizes.length > 0) {
        filtered = filtered.filter(model =>
          filter.sizes!.some(size =>
            model.sizes.includes(size)
          )
        );
      }
    }

    // Apply pagination
    const start = offset || 0;
    const end = limit ? start + limit : filtered.length;
    
    return filtered.slice(start, end);
  }

  /**
   * Get all unique capabilities across all models
   */
  getUniqueCapabilities(): string[] {
    const capabilitiesSet = new Set<string>();
    
    this.data.models.forEach(model => {
      model.capabilities.forEach(cap => capabilitiesSet.add(cap));
    });

    return Array.from(capabilitiesSet).sort();
  }

  /**
   * Get all unique sizes across all models
   */
  getUniqueSizes(): string[] {
    const sizesSet = new Set<string>();
    
    this.data.models.forEach(model => {
      model.sizes.forEach(size => sizesSet.add(size));
    });

    return Array.from(sizesSet).sort();
  }
}

// Export singleton instance
export const dataLoader = new DataLoaderWorker();
