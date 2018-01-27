import {genMockData} from './gen-mock-data.spec';
import {InFlight} from './inflight';
import {InFlightState} from './inflight-state';
import {PagedResults} from '../interfaces/paged-results';

import 'rxjs/add/operator/take';

describe('InFlight Basic', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
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
      return genMockData(page, perPage, 23, 'Entity', 1000, false);
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

  it('should get data', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 23, 'Entity', 100, false);
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

  it('should handle empty data', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 0, 'Entity', 100, false);
    });

    inFlight.stateObservable.take(1).subscribe((st) => {
      expect(st.dataLoaded).toBe(false);
      expect(st.inFlight).toBe(true);
    });

    setTimeout(() => {
      inFlight.stateObservable.take(1).subscribe((st) => {
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
