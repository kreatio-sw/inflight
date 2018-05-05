import {genMockData} from './gen-mock-data.spec';
import {InFlight} from './inflight';
import {InFlightState} from './inflight-state';
import {PagedResults} from '../interfaces/paged-results';

import 'rxjs/add/operator/take';

describe('InFlight Errors', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });


  it('should not load data in case of error', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 23, 'Entity', 100, () => true);
    });

    expect(inFlight.state.errored).toBe(false);
    expect(inFlight.state.hasMorePages).toBe(true);

    // Expect an error
    inFlight.errorObservable.subscribe((err) => {
      expect(inFlight.state.dataLoaded).toBe(false);
      expect(inFlight.state.inFlight).toBe(false);
      expect(inFlight.state.errored).toBe(true);
      expect(inFlight.state.hasMorePages).toBe(true);

      done();
    });
  });

  it('should allow retrying after error', (done) => {
    const inFlight = new InFlight();

    let tries = 1;

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 23, 'Entity', 100, () => {
        // Fail first time, succeed in subsequent try
        if (tries === 1) {
          tries++;
          return true;
        }

        return false;
      });
    });

    // Expect an error
    inFlight.errorObservable.subscribe((err) => {
      expect(inFlight.state.dataLoaded).toBe(false);
      expect(inFlight.state.inFlight).toBe(false);
      expect(inFlight.state.errored).toBe(true);

      // Retry
      inFlight.getNextPage();
      expect(inFlight.state.errored).toBe(false);

      setTimeout(() => {
        expect(inFlight.state.dataLoaded).toBe(true);
        expect(inFlight.state.inFlight).toBe(false);
        expect(inFlight.state.errored).toBe(false);

        expect(inFlight.results.page).toBe(1);
        expect(inFlight.results.entities.length).toBe(5);

        done();
      }, 200);
    });
  });

});
