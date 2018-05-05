import {genMockData} from './gen-mock-data.spec';
import {InFlight} from './inflight';
import {InFlightState} from './inflight-state';
import {PagedResults} from '../interfaces/paged-results';

import 'rxjs/add/operator/take';
import 'rxjs/add/operator/map';

describe('InFlight hasMorePages', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  it('should mark for just initialized InFlight', () => {
    const inFlight = new InFlight();

    expect(inFlight.state.hasMorePages).toEqual(false);
  });

  it('should mark correctly for empty results', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 0, 'Entity', 50);
    });

    // It should initially be set
    expect(inFlight.state.hasMorePages).toEqual(true);

    setTimeout(() => {
      expect(inFlight.state.hasMorePages).toEqual(false);
      done();
    }, 100);
  });

  it('should mark correctly for multi-page results', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 8, 'Entity', 5);
    });

    setTimeout(() => {
      expect(inFlight.state.hasMorePages).toEqual(true);
      inFlight.getNextPage();

      setTimeout(() => {
        expect(inFlight.state.hasMorePages).toEqual(false);
        done();
      }, 100);
    }, 10);
  });

  it('should mark correctly for multi-page results - exact multiple', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 10, 'Entity', 5);
    });

    setTimeout(() => {
      expect(inFlight.state.hasMorePages).toEqual(true);
      inFlight.getNextPage();

      setTimeout(() => {
        expect(inFlight.state.hasMorePages).toEqual(false);
        done();
      }, 100);
    }, 10);
  });

  it('should set correct total when no more pages', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      // Simulate a backend that returns incorrect (inflated) count of results
      // The following will say 11 items while actually return only 9
      return genMockData(page, perPage, 9, 'Entity', 5).map((results) => {
        results.total = results.total + 2;
        return results;
      });
    });

    setTimeout(() => {
      expect(inFlight.state.hasMorePages).toEqual(true);
      // Should have inflated count
      expect(inFlight.results.total).toEqual(11);
      inFlight.getNextPage();

      setTimeout(() => {
        expect(inFlight.state.hasMorePages).toEqual(false);
        // Should have correct count
        expect(inFlight.results.total).toEqual(9);
        done();
      }, 100);
    }, 10);
  });

});
