import {genMockData} from './gen-mock-data.spec';
import {InFlight} from './inflight';
import {InFlightState} from './inflight-state';
import {PagedResults} from '../interfaces/paged-results';

import {take} from 'rxjs/operators';

describe('InFlight Basic', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });


  it('should initialize', (done) => {
    const inFlight = new InFlight();

    const state = new InFlightState();
    state.inFlight = false;
    state.dataLoaded = false;

    inFlight.stateObservable.pipe(take(1)).subscribe((st) => {
      expect(inFlight.state).toEqual(state);
      expect(st).toEqual(state);
      done();
    });
  });

  it('should start', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 23, 'Entity', 1000);
    });

    setTimeout(() => {
      inFlight.stateObservable.pipe(take(1)).subscribe((st) => {
        expect(st.dataLoaded).toBe(false);
        expect(st.inFlight).toBe(true);

        expect(inFlight.results).toEqual(new PagedResults());

        done();
      });
    }, 10);
  });

  it('should get data', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 23, 'Entity', 100);
    });

    setTimeout(() => {
      inFlight.stateObservable.pipe(take(1)).subscribe((st) => {
        expect(st.dataLoaded).toBe(true);
        expect(st.inFlight).toBe(false);

        expect(inFlight.results.page).toBe(1);
        expect(inFlight.results.total).toBe(23);

        done();
      });
    }, 200);
  });

  it('should get cancel', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 23, 'Entity', 50);
    });

    setTimeout(() => {
      expect(inFlight.state.dataLoaded).toBe(true);
      expect(inFlight.state.inFlight).toBe(false);

      inFlight.getNextPage();
      inFlight.clear(false);

      setTimeout(() => {
        expect(inFlight.state.dataLoaded).toBe(true);
        expect(inFlight.state.inFlight).toBe(false);
        expect(inFlight.state.hasMorePages).toBe(false);
        expect(inFlight.results.entities.length).toBeGreaterThan(0);
        done();
      }, 100);
    }, 100);
  });

  it('should get cancel with clear data', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 23, 'Entity', 50);
    });

    setTimeout(() => {
      expect(inFlight.state.dataLoaded).toBe(true);
      expect(inFlight.state.inFlight).toBe(false);

      inFlight.getNextPage();
      inFlight.clear(true);

      setTimeout(() => {
        expect(inFlight.state.dataLoaded).toBe(false);
        expect(inFlight.state.inFlight).toBe(false);
        expect(inFlight.state.hasMorePages).toBe(false);
        expect(inFlight.results.entities.length).toEqual(0);
        done();
      }, 100);
    }, 100);
  });

  it('should handle empty data', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 0, 'Entity', 100);
    });

    inFlight.stateObservable.pipe(take(1)).subscribe((st) => {
      expect(st.dataLoaded).toBe(false);
      expect(st.inFlight).toBe(true);
    });

    setTimeout(() => {
      inFlight.stateObservable.pipe(take(1)).subscribe((st) => {
        expect(st.dataLoaded).toBe(true);
        expect(st.inFlight).toBe(false);

        expect(inFlight.results.page).toBe(1);
        expect(inFlight.results.entities.length).toBe(0);
        expect(inFlight.results.total).toBe(0);

        done();
      });
    }, 200);
  });
});
