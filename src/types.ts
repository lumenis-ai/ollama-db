/**
 * Model interface representing an Ollama model
 */
export interface Model {
  name: string;
  description: string;
  capabilities: string[];
  sizes: string[];
  url: string;
}

/**
 * Structure of the models.json data file
 */
export interface ModelsData {
  last_updated: string;
  total_pages: number;
  total_models: number;
  models: Model[];
}

/**
 * Filter criteria for searching models
 */
export interface ModelFilter {
  nameContains?: string;
  descriptionContains?: string;
  capabilities?: string[];
  sizes?: string[];
}

/**
 * Response type for models query
 */
export interface ModelsResponse {
  lastUpdated: string;
  totalPages: number;
  totalModels: number;
  models: Model[];
}
