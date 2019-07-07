import {Observable} from 'rxjs';

import {PagedResults} from '../interfaces/paged-results';

/**
 * Function template to fetch data
 *
 * The function will receive `pageNumber` and `perPage`.
 * It needs to return an `Observable` that will yield {@link PagedResults}.
 * This will typically be Angular HTTP `get` call, followed by `map`.
 * To add timeout and retry, use standard RxJS techniques at this stage.
 */
export interface GetPageFunc {
  /**
   * The function will receive `pageNumber` and `perPage`.
   * It needs to return an `Observable` that will yield {@link PagedResults}.
   * This will typically be Angular HTTP `get` call, followed by `map`.
   * To add timeout and retry, use standard RxJS techniques at this stage.
   *
   */
  (page: number, perPage: number): Observable<PagedResults>;
}

