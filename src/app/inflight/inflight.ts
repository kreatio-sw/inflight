import {BehaviorSubject, Subject, Subscription} from 'rxjs';

import {InFlightState} from './inflight-state';
import {PagedResults} from '../interfaces/paged-results';
import {GetPageFunc} from './get-page-func';

/**
 * Class to manage UI state changes within a component
 *
 * @description see README for details
 */
export class InFlight {
  private _state: InFlightState;

  /**
   * Will yield for each state change
   */
  public stateObservable: BehaviorSubject<InFlightState>;

  /**
   * Will yield all errors.
   *
   * In case of errors `errored` flag will be set in `state` as well.
   */
  public errorObservable: Subject<Error>;

  private _results: PagedResults;

  /**
   * Will yield whenever results change, i.e., new data arrives or data is cleared.
   */
  public resultsObservable: BehaviorSubject<PagedResults>;

  private _pageObsSubscription: Subscription;
  private _getPageFn: GetPageFunc;

  private _perPage: number;
  private _currentPage: number;

  /**
   * Create a new instance. You should create one for each component.
   */
  constructor() {
    this._state = new InFlightState();
    this.stateObservable = new BehaviorSubject<InFlightState>(this._state);

    this._results = new PagedResults();
    this.resultsObservable = new BehaviorSubject<PagedResults>(this._results);

    this.errorObservable = new Subject<Error>();
  }

  /**
   * Current value of results, it same as yielded by [resultsObservable]{@link InFlight#resultsObservable}
   *
   * @returns {PagedResults}
   */
  get results(): PagedResults {
    return this.resultsObservable.getValue();
  }

  /**
   * Directly update results
   *
   * When set, `resultsObservable` will yield the new results.
   * Sometimes the entities displayed in the UI may receive insert/updates/deletes
   * because of user actions. Occasionally there may be other notification mechanisms
   * that communicate these changes.
   *
   * You must understand that the results may get inconsistent when the loaded entities
   * are updated using this call and subsequent pages are loaded from external service.
   *
   * @param {PagedResults} value
   */
  set results(value: PagedResults) {
    this._results = value;
    this._triggerResultsChange();
  }

  /**
   * Current state, it same as yielded by [stateObservable]{@link InFlight#stateObservable}
   *
   * @returns {InFlightState}
   */
  get state(): InFlightState {
    return this.stateObservable.getValue();
  }

  /**
   * Initiate a switch. Call this to change the criteria that builds the list.
   *
   * `getPageFn` function will receive `pageNumber` and `perPage`.
   * It needs to return an `Observable` that will yield {@link PagedResults}.
   * This will typically be Angular HTTP `get` call, followed by `map`.
   * To add timeout and retry, use standard RxJS techniques at this stage.
   *
   * If requests are in flight when a switch is initiated, the pending request will be cancelled.
   * It is ensured that stale data will not show up.
   *
   * @param {number} perPage Number of entities per page
   * @param {boolean} clearData Whether to clear the results now,
   * if `false` current set of results will be retained till response is received
   * @param {GetPageFunc} getPageFn See description for details
   */
  public start(perPage: number, clearData: boolean, getPageFn: GetPageFunc) {

    if (clearData) {
      this.clearData();
    }

    this._currentPage = 0;
    this._perPage = perPage;
    this._getPageFn = getPageFn;

    this._state.hasMorePages = true;

    this.getNextPage();

    this._state.switchInProgress = true;
    this._triggerStateChange();
  }

  /**
   * Clear ongoing requests if any.
   *
   * This should be called as part of destruction process. For example onDestroy of a component.
   *
   * @param {boolean} clearData Whether to clear `results` as well.
   */
  public clear(clearData: boolean) {
    if (clearData) {
      this.clearData();
    }

    this._clearPageSubscription();

    this._state.hasMorePages = false;
    this._triggerStateChange();
  }

  /**
   * Clear results.
   */
  public clearData() {
    this._results = new PagedResults();
    this._triggerResultsChange();

    this._state.dataLoaded = false;
    this._triggerStateChange();
  }

  private _clearPageSubscription() {
    if (this._pageObsSubscription) {
      this._pageObsSubscription.unsubscribe();
      this._pageObsSubscription = null;

      this._state.inFlight = false;
      this._triggerStateChange();
    }
  }

  /**
   * Request next page of data.
   *
   * If it is first page, it will replace results.
   * If results are still in flight when this is called, the previous one will be canceled.
   */
  public getNextPage() {

    this._clearPageSubscription();

    this._state.errored = false;
    this._triggerStateChange();

    const nextPage = this._currentPage + 1;

    this._pageObsSubscription = this._getPageFn(nextPage, this._perPage)
      .subscribe(
        (data) => {
          this._clearPageSubscription();

          if (data.page !== nextPage) {
            // panic, should not happen
            // raise an error and discard the result
            this.errorObservable.next(new Error(`Expected page no ${nextPage} instead got page no ${data.page}`));
            return;
          }

          this._currentPage = data.page;

          // Replace entire result if it was first page otherwise concatenate received entities
          // reset flag switchInProgress when first page of data is arrived
          if (data.page === 1) {
            this._results = data;
            this._state.switchInProgress = false;
            this._triggerStateChange();
          } else {
            this._results.total = data.total;
            this._results.page = data.page;
            this._results.entities = this._results.entities.concat(data.entities);
          }

          if (data.entities.length < this._perPage || this._results.entities.length >= this._results.total) {
            this._results.total = this._results.entities.length;
            this._state.hasMorePages = false;
            this._triggerStateChange();
          }

          this._triggerResultsChange();

          this._state.dataLoaded = true;
          this._triggerStateChange();
        },
        (err) => {
          this._clearPageSubscription();
          this._state.errored = true;
          this._triggerStateChange();
          this.errorObservable.next(err);
        });

    this._state.inFlight = true;
    this._triggerStateChange();
  }

  private _triggerResultsChange() {
    this.resultsObservable.next(this._results);
  }

  private _triggerStateChange(): void {
    this.stateObservable.next(this._state);
  }
}
