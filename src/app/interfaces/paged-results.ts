/**
 * Results
 */
export class PagedResults {
  /**
   * Total number of entities, not all of these may have been loaded.
   * Check `entities.length` to get number of entities loaded.
   */
  total: number;

  /**
   * Number of pages loaded.
   */
  page: number;

  /**
   * Array of entities
   */
  entities: any[];

  /**
   * Create new instance
   */
  constructor(total: number = null, page: number = null, entities: any[] = []) {
    this.total = total;
    this.page = page;
    this.entities = entities;
  }
}
