import {genMockData} from './gen-mock-data.spec';
import {InFlight} from './inflight';
import {InFlightState} from './inflight-state';
import {PagedResults} from '../interfaces/paged-results';

import 'rxjs/add/operator/take';

describe('InFlight', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 5000;
  });


  it('should initialize', (done) => {
    const inFlight = new InFlight();

    const state = new InFlightState();
    state.inFlight = false;
    state.dataLoaded = false;

    inFlight.stateObservable.take(1).subscribe((st) => {
      expect(inFlight.state).toEqual(state);
      expect(st).toEqual(state);
      done();
    });
  });

  it('should start', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 23, 1000, false);
    });

    setTimeout(() => {
      inFlight.stateObservable.take(1).subscribe((st) => {
        expect(st.dataLoaded).toBe(false);
        expect(st.inFlight).toBe(true);

        expect(inFlight.results).toEqual(new PagedResults());

        done();
      });
    }, 10);
  });

  it('should get first page', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 23, 100, false);
    });

    setTimeout(() => {
      inFlight.stateObservable.take(1).subscribe((st) => {
        expect(st.dataLoaded).toBe(true);
        expect(st.inFlight).toBe(false);

        expect(inFlight.results.page).toBe(1);
        expect(inFlight.results.total).toBe(23);

        done();
      });
    }, 200);
  });

  it('should get two pages', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 23, 100, false);
    });

    setTimeout(() => {
      inFlight.getNextPage();

      expect(inFlight.state.inFlight).toBe(true);
      expect(inFlight.state.dataLoaded).toBe(true);

      setTimeout(() => {
        expect(inFlight.state.inFlight).toEqual(false);
        expect(inFlight.state.dataLoaded).toEqual(true);

        expect(inFlight.results.page).toBe(2);
        expect(inFlight.results.total).toBe(23);
        expect(inFlight.results.entities.length).toBe(10);
        expect(inFlight.results.entities[8].name).toBe('Entity 9');

        done();
      }, 300);
    }, 200);
  });

  it('should get n-th page', (done) => {
    const targetPages = 4;

    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 23, 100, false);
    });

    const subs = inFlight.resultsObservable.subscribe((results) => {
      // Nothing to do, already first page is in flight
      if (!results.page) {
        return;
      }

      // Request next page till we reach the n-th page
      if (results.page < targetPages) {
        inFlight.getNextPage();
      }

      if (results.page === targetPages) {
        expect(results.total).toBe(23);
        expect(results.entities.length).toBe(20);
        expect(inFlight.results.entities[19].name).toBe('Entity 20');

        subs.unsubscribe();
        done();
      }
    });
  });

});
