import { Observable, of } from 'rxjs';

/**
 * Central class for pagination support. Holds typed collections that can be
 * paginated over.
 *
 * @author Gunnar Hillert
 */
export class Page<T> {
  totalPages: number;
  totalElements: number;
  pageNumber = 0;
  pageSize = 10;
  items: T[] = [];
  paginationId: 'pagination-instance';

  public getPaginationInstance() {
    return {
      id: this.paginationId,
      itemsPerPage: this.pageSize,
      currentPage: this.pageNumber + 1,
      totalItems: this.totalElements
    };
  }

  public getItemsAsObservable(): Observable<T[]> {
    return of(this.items);
  }

  public update(page: Page<T> ) {
    this.items.length = 0;
    this.items.push(...page.items);
    this.pageNumber = page.pageNumber;
    this.pageSize = page.pageSize;
    this.totalElements = page.totalElements;
    this.totalPages = page.totalPages;
  }

}
