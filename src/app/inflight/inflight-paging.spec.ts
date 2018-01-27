import {genMockData} from './gen-mock-data.spec';
import {InFlight} from './inflight';
import {InFlightState} from './inflight-state';
import {PagedResults} from '../interfaces/paged-results';

import 'rxjs/add/operator/take';

describe('InFlight Pagination', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });
  it('should get two pages', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 23, 'Entity', 100, false);
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
      return genMockData(page, perPage, 23, 'Entity', 100, false);
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
        expect(results.entities.length).toBe(targetPages * 5);
        expect(results.entities[19].name).toBe('Entity 20');

        subs.unsubscribe();
        done();
      }
    });
  });

  describe('getNextPage while still inFlight should cancel current and re request', () => {

    it('for first page', (done) => {
      const inFlight = new InFlight();

      // This test works by ensuring that a function was not called during lifetime of the test
      // In this case because the associated Observable was unsubscribed
      // To ensure that the mechanism, please set the timeout for the first request to 0 - the test should fail
      let iWasCalledNTimes = 0;

      inFlight.start(5, true, (page, perPage) => {
        return genMockData(page, perPage, 23, 'Entity', 100, false).do(() => {
          iWasCalledNTimes++;
        });
      });

      setTimeout(() => {
        expect(inFlight.state.inFlight).toBe(true);

        // Issuing next page request while still inFlight
        inFlight.getNextPage();

        expect(inFlight.state.inFlight).toBe(true);
        expect(inFlight.state.dataLoaded).toBe(false);

        setTimeout(() => {
          expect(inFlight.state.inFlight).toEqual(false);
          expect(inFlight.state.dataLoaded).toEqual(true);

          expect(inFlight.results.page).toBe(1);
          expect(inFlight.results.entities.length).toBe(5);

          // Only one data request should hve been succeeded
          expect(iWasCalledNTimes).toBe(1);

          done();

        }, 300);

      }, 10);

    });

    it('for n-th page', (done) => {
      const targetPages = 4;

      const inFlight = new InFlight();

      // This test works by ensuring that a function was not called during lifetime of the test
      // In this case because the associated Observable was unsubscribed
      // To ensure that the mechanism, please set the timeout for the first request to 0 - the test should fail
      let iWasCalledNTimes = 0;

      inFlight.start(5, true, (page, perPage) => {
        return genMockData(page, perPage, 23, 'Entity', 100, false).do(() => {
          iWasCalledNTimes++;
        });
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

        // When requesting n-th page, re-request before the request is complete
        if (results.page === targetPages - 1) {

          setTimeout(() => {
            expect(inFlight.state.inFlight).toBe(true);

            // Issuing next page request while still inFlight
            inFlight.getNextPage();

            expect(inFlight.state.inFlight).toBe(true);
            expect(inFlight.state.dataLoaded).toBe(true);

            setTimeout(() => {
              expect(inFlight.state.inFlight).toEqual(false);
              expect(inFlight.state.dataLoaded).toEqual(true);

              expect(inFlight.results.page).toBe(targetPages);
              expect(inFlight.results.entities.length).toBe(targetPages * 5);

              // Only one data request each for targetPages should hve been succeeded
              expect(iWasCalledNTimes).toBe(targetPages);

              subs.unsubscribe();
              done();

            }, 300);

          }, 10);

        }
      });
    });

  });

});
