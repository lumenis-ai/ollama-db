import * as fs from 'fs';
import * as path from 'path';
import { Model, ModelsData, ModelFilter } from './types';

/**
 * DataLoader class for loading and filtering Ollama models data
 */
class DataLoader {
  private data: ModelsData | null = null;
  private dataPath: string;

  constructor() {
    // Path to models.json relative to the project root
    this.dataPath = path.join(__dirname, '..', 'data', 'models.json');
  }

  /**
   * Load data from models.json file
   */
  private loadData(): ModelsData {
    if (this.data) {
      return this.data;
    }

    try {
      const fileContent = fs.readFileSync(this.dataPath, 'utf-8');
      this.data = JSON.parse(fileContent) as ModelsData;
      return this.data;
    } catch (error) {
      console.error('Error loading models.json:', error);
      throw new Error('Failed to load models data');
    }
  }

  /**
   * Get all models
   */
  getAllModels(): ModelsData {
    return this.loadData();
  }

  /**
   * Get a single model by exact name match
   */
  getModelByName(name: string): Model | null {
    const data = this.loadData();
    const model = data.models.find(m => m.name === name);
    return model || null;
  }

  /**
   * Filter models based on provided criteria
   */
  filterModels(filter?: ModelFilter, limit?: number, offset?: number): Model[] {
    const data = this.loadData();
    let filtered = [...data.models];

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
    const data = this.loadData();
    const capabilitiesSet = new Set<string>();
    
    data.models.forEach(model => {
      model.capabilities.forEach(cap => capabilitiesSet.add(cap));
    });

    return Array.from(capabilitiesSet).sort();
  }

  /**
   * Get all unique sizes across all models
   */
  getUniqueSizes(): string[] {
    const data = this.loadData();
    const sizesSet = new Set<string>();
    
    data.models.forEach(model => {
      model.sizes.forEach(size => sizesSet.add(size));
    });

    return Array.from(sizesSet).sort();
  }

  /**
   * Reload data from file (useful for refreshing)
   */
  reloadData(): void {
    this.data = null;
    this.loadData();
  }
}

// Export singleton instance
export const dataLoader = new DataLoader();
