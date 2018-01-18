import {Observable} from 'rxjs/Observable';

import {PagedResults} from '../interfaces/paged-results';
import {Observer} from 'rxjs/Observer';


export function genMockData(page: number, perPage: number, totalResults: number,
                  delay: number, err: boolean): Observable<PagedResults> {
  return Observable.create(
    (obs: Observer<PagedResults>) => {
      const timerHandle = setTimeout(() => {
        const entities = [];

        const firstEntityNo = (page - 1) * perPage + 1;

        let i = firstEntityNo;

        for (; i < firstEntityNo + perPage && i <= totalResults; i++) {
          entities.push({name: `Entity ${ i }`});
        }

        const results = new PagedResults(
          totalResults,
          page,
          entities
        );

        obs.next(results);
      }, delay);

      return () => {
        clearTimeout(timerHandle);
      };
    });
}


xdescribe('genMockData', () => {
  let page = 1;
  const perPage = 5;
  const totalResults = 32;
  let delay = 0;
  let err = false;

  it('should get first page of results', (done) => {
    genMockData(page, perPage, totalResults, delay, err).subscribe((result: PagedResults) => {
      expect(result.page).toBe(page);
      expect(result.total).toBe(totalResults);
      expect(result.entities.length).toBe(perPage);
      expect(result.entities[0].name).toBe('Entity 1');
      done();
    });
  });

  it('should get fifth page of results', (done) => {
    page = 5;

    genMockData(page, perPage, totalResults, delay, err).subscribe((result: PagedResults) => {
      expect(result.page).toBe(page);
      expect(result.total).toBe(totalResults);
      expect(result.entities.length).toBe(perPage);
      expect(result.entities[0].name).toBe('Entity 21');
      done();
    });
  });

  it('should get last page of results', (done) => {
    page = 7;

    genMockData(page, perPage, totalResults, delay, err).subscribe((result: PagedResults) => {
      expect(result.page).toBe(page);
      expect(result.total).toBe(totalResults);
      expect(result.entities.length).toBe(2);
      expect(result.entities[0].name).toBe('Entity 31');
      expect(result.entities[1].name).toBe('Entity 32');
      done();
    });
  });

  it('should return empty page of results beyond totalResults', (done) => {
    page = 8;

    genMockData(page, perPage, totalResults, delay, err).subscribe((result: PagedResults) => {
      expect(result.page).toBe(page);
      expect(result.total).toBe(totalResults);
      expect(result.entities.length).toBe(0);
      done();
    });
  });

  it('should implement delay', (done) => {
    page = 5;
    delay = 2500;

    const start = new Date().getTime();

    genMockData(page, perPage, totalResults, delay, err).subscribe((result: PagedResults) => {
      expect(result.page).toBe(page);
      expect(result.total).toBe(totalResults);
      expect(result.entities.length).toBe(perPage);
      expect(result.entities[0].name).toBe('Entity 21');
      expect(new Date().getTime() - start).toBeGreaterThanOrEqual(2);
      done();
    });
  });

  it('should allow canceling', (done) => {
    page = 4;
    delay = 1500;

    const subs = genMockData(page, perPage, totalResults, delay, err).subscribe((result: PagedResults) => {
      // It should not be called
      expect(false).toBe(true);
    });

    setTimeout(() => {
      subs.unsubscribe();
    }, 500);

    setTimeout(() => {
      done();
    }, 2500);
  });
});
