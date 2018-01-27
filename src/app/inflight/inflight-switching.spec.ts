import {genMockData} from './gen-mock-data.spec';
import {InFlight} from './inflight';
import {InFlightState} from './inflight-state';
import {PagedResults} from '../interfaces/paged-results';

import 'rxjs/add/operator/take';
import 'rxjs/add/operator/do';

describe('InFlight Switching', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });


  it('should switch with clear data', (done) => {
    const inFlight = new InFlight();

    expect(inFlight.state.dataLoaded).toBe(false);
    expect(inFlight.state.inFlight).toBe(false);

    inFlight.start(25, true, (page, perPage) => {
      return genMockData(page, perPage, 48, 'Entity A', 100);
    });

    expect(inFlight.state.dataLoaded).toBe(false);
    expect(inFlight.state.inFlight).toBe(true);

    setTimeout(() => {
      expect(inFlight.state.dataLoaded).toBe(true);
      expect(inFlight.state.inFlight).toBe(false);

      expect(inFlight.results.page).toBe(1);
      expect(inFlight.results.total).toBe(48);
      expect(inFlight.results.entities.length).toBe(25);
      expect(inFlight.results.entities[0].name).toEqual('Entity A 1');

      inFlight.start(15, true, (page, perPage) => {
        return genMockData(page, perPage, 10, 'Entity B', 100);
      });

      expect(inFlight.state.dataLoaded).toBe(false);
      expect(inFlight.state.inFlight).toBe(true);
      expect(inFlight.results.entities.length).toBe(0);

      setTimeout(() => {
        expect(inFlight.state.dataLoaded).toBe(true);
        expect(inFlight.state.inFlight).toBe(false);

        expect(inFlight.results.page).toBe(1);
        expect(inFlight.results.total).toBe(10);
        expect(inFlight.results.entities.length).toBe(10);
        expect(inFlight.results.entities[0].name).toEqual('Entity B 1');

        done();
      }, 200);

    }, 200);
  });

  it('should switch without clear data', (done) => {
    const inFlight = new InFlight();

    inFlight.start(25, true, (page, perPage) => {
      return genMockData(page, perPage, 48, 'Entity A', 100);
    });

    setTimeout(() => {
      const prevResults = inFlight.results;

      inFlight.start(15, false, (page, perPage) => {
        return genMockData(page, perPage, 10, 'Entity B', 100);
      });

      expect(inFlight.state.dataLoaded).toBe(true);
      expect(inFlight.state.inFlight).toBe(true);

      // This mode should retain the data until new data arrives
      expect(inFlight.results).toEqual(prevResults);

      setTimeout(() => {
        expect(inFlight.state.dataLoaded).toBe(true);
        expect(inFlight.state.inFlight).toBe(false);

        expect(inFlight.results.page).toBe(1);
        expect(inFlight.results.total).toBe(10);
        expect(inFlight.results.entities.length).toBe(10);
        expect(inFlight.results.entities[0].name).toEqual('Entity B 1');

        done();
      }, 200);
    }, 200);
  });

  it('should not yield stale data', (done) => {
    const inFlight = new InFlight();

    // Set a longer time, so that it arrives later
    inFlight.start(25, true, (page, perPage) => {
      return genMockData(page, perPage, 48, 'Entity A', 1000);
    });

    setTimeout(() => {
      // Switch to different request
      inFlight.start(15, false, (page, perPage) => {
        return genMockData(page, perPage, 10, 'Entity B', 100);
      });

      setTimeout(() => {
        expect(inFlight.results.page).toBe(1);
        expect(inFlight.results.total).toBe(10);
        expect(inFlight.results.entities.length).toBe(10);
        expect(inFlight.results.entities[0].name).toEqual('Entity B 1');

        done();
      }, 1500);
    }, 10);

  });

  it('should cancel stale request', (done) => {
    const inFlight = new InFlight();

    // This test works by ensuring that a function was not called during lifetime of the test
    // In this case because the associated Observable was unsubscribed
    // To ensure that the mechanism, please set the timeout for the first request to 0 - the test should fail
    let iWasCalled = false;

    // Set a longer time, so that it arrives later
    inFlight.start(25, true, (page, perPage) => {
      return genMockData(page, perPage, 48, 'Entity A', 1000).do((results) => {
        // This should not have been called
        iWasCalled = true;
      });
    });

    setTimeout(() => {
      // Switch to different request
      inFlight.start(15, false, (page, perPage) => {
        return genMockData(page, perPage, 10, 'Entity B', 100);
      });

      setTimeout(() => {
        expect(iWasCalled).toBe(false);

        done();
      }, 1500);
    }, 10);
  });

});
