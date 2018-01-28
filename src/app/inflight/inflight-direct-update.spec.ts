import {genMockData} from './gen-mock-data.spec';
import {InFlight} from './inflight';
import {InFlightState} from './inflight-state';
import {PagedResults} from '../interfaces/paged-results';

import 'rxjs/add/operator/take';
import 'rxjs/add/operator/skip';

describe('InFlight Direct Update', () => {
  beforeEach(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 10000;
  });

  it('should allow direct update of results', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 23, 'Entity', 10);
    });

    setTimeout(() => {
      const results = inFlight.results;

      const newName = 'New Name';

      results.entities[0].name = newName;
      inFlight.results = results;

      expect(inFlight.results.entities[0].name).toEqual(newName);

      done();
    }, 200);
  });

  it('should yield updated results', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 23, 'Entity', 10);
    });

    setTimeout(() => {
      const newName = 'New Name';

      inFlight.resultsObservable.skip(1).take(1).subscribe((res) => {
        expect(res.entities[0].name).toEqual(newName);

        done();
      });

      const results = inFlight.results;
      results.entities[0].name = newName;
      inFlight.results = results;

    }, 200);
  });

  it('should allow getting additional pages', (done) => {
    const inFlight = new InFlight();

    inFlight.start(5, true, (page, perPage) => {
      return genMockData(page, perPage, 23, 'Entity', 10);
    });

    setTimeout(() => {
      const newName = 'New Name';

      const results = inFlight.results;
      results.entities[3].name = newName;
      inFlight.results = results;

      inFlight.getNextPage();

      setTimeout(() => {
        expect(inFlight.results.entities.length).toBe(10);
        expect(inFlight.results.entities[3].name).toBe(newName);
        expect(inFlight.results.entities[8].name).toBe('Entity 9');

        done();
      }, 100);

    }, 200);
  });


});
