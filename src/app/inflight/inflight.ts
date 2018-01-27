import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {Observable} from 'rxjs/Observable';
import {Subject} from 'rxjs/Subject';
import {Subscription} from 'rxjs/Subscription';

import {InFlightState} from './inflight-state';
import {PagedResults} from '../interfaces/paged-results';

type getPageFnType = (page: number, perPage: number) => Observable<PagedResults>;

export class InFlight {
  private _state: InFlightState;
  public stateObservable: BehaviorSubject<InFlightState>;

  public errorObservable: Subject<Error>;

  private _results: PagedResults;
  public resultsObservable: BehaviorSubject<PagedResults>;

  private _pageObsSubscription: Subscription;
  private _getPageFn: getPageFnType;

  private _perPage: number;
  private _currentPage: number;

  constructor() {
    this._state = new InFlightState();
    this.stateObservable = new BehaviorSubject<InFlightState>(this._state);

    this._results = new PagedResults();
    this.resultsObservable = new BehaviorSubject<PagedResults>(this._results);

    this.errorObservable = new Subject<Error>();
  }

  get results(): PagedResults {
    return this.resultsObservable.getValue();
  }

  get state(): InFlightState {
    return this.stateObservable.getValue();
  }

  public start(perPage: number, clearData: boolean, getPageFn: getPageFnType) {

    if (clearData) {
      this.clearData();
    }

    this._currentPage = 0;
    this._perPage = perPage;
    this._getPageFn = getPageFn;

    this.getNextPage();
  }

  public clear(clearData: boolean) {
    if (clearData) {
      this.clearData();
    }

    this._clearPageSubscription();
  }

  public clearData() {
    this._results = new PagedResults();
    this.resultsObservable.next(this._results);

    this._state.dataLoaded = false;
    this.stateObservable.next(this._state);
  }

  private _clearPageSubscription() {
    if (this._pageObsSubscription) {
      this._pageObsSubscription.unsubscribe();
      this._pageObsSubscription = null;

      this._state.inFlight = false;
      this._triggerStateChange();
    }
  }

  public getNextPage() {

    this._clearPageSubscription();

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

          // Replace entire result if it was first page otherwise concatenante received entities
          if (data.page === 1) {
            this._results = data;
          } else {
            this._results.total = data.total;
            this._results.page = data.page;
            this._results.entities = this._results.entities.concat(data.entities);
          }

          this.resultsObservable.next(this._results);

          this._state.dataLoaded = true;
          this._triggerStateChange();
        },
        (err) => {
          this._clearPageSubscription();
          this.errorObservable.next(err);
        });

    this._state.inFlight = true;
    this._triggerStateChange();
  }

  private _triggerStateChange(): void {
    this.stateObservable.next(this._state);
  }
}
