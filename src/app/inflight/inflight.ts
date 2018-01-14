import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { InFlightState } from './inflight-state';
import { PagedResults } from '../interfaces/paged-results';
import { Subject } from 'rxjs/Subject';

export class InFlight {
  public state: InFlightState;
  public stateObservable: Subject<InFlightState>;

  public errorObservable: Subject<Error>;

  public results: PagedResults;
  public resultsObservable: Subject<PagedResults>;

  private _mainObsSubscription: Subscription;
  private _pageObsSubscription: Subscription;

  constructor() {
    this.state = new InFlightState();
    this.stateObservable = new BehaviorSubject<InFlightState>(this.state);
    this.resultsObservable = new Subject<PagedResults>();
  }

  public clear() {
    this._clearData();
    this._clearMainSubscription();
    this._clearPageSubscription();
  }

  private _clearData() {
    this.results = new PagedResults();
    this.resultsObservable.next(this.results);
  }

  private _clearMainSubscription() {
    if (this._mainObsSubscription) {
      this._mainObsSubscription.unsubscribe();
      this._mainObsSubscription = null;

      this.state.changeInFlight = false;
      this.stateObservable.next(this.state);
    }
  }

  private _clearPageSubscription() {
    if (this._pageObsSubscription) {
      this._pageObsSubscription.unsubscribe();
      this._pageObsSubscription = null;

      this.state.pageInFlight = false;
      this.stateObservable.next(this.state);
    }
  }

  public start(obs: Observable<PagedResults>) {
    this.clear();

    this._mainObsSubscription = obs
      .subscribe(
        (data) => {
          this.results = data;
          this.resultsObservable.next(this.results);
        },
        (err) => {
          this._clearMainSubscription();
          this.errorObservable.next(err);
        });
  }

  public addPage(obs: Observable<PagedResults>) {
    this._pageObsSubscription = obs
      .subscribe(
        (data) => {
          this.results.total = data.total;
          this.results.page = data.page;
          this.results.entities.concat(data.entities);

          this.resultsObservable.next(this.results);
        },
        (err) => {
          this._clearPageSubscription();
          this.errorObservable.next(err);
        });

  }
}
