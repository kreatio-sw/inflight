
export class PagedResults {
  total: number;
  page: number;
  entities: any[];

  constructor(total: number = null, page: number = null, entities: any[] = []) {
    this.total = total;
    this.page = page;
    this.entities = entities;
  }
}
