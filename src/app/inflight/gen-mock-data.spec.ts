import {Observable} from 'rxjs/Observable';

import {PagedResults} from '../interfaces/paged-results';
import {Observer} from 'rxjs/Observer';


export function genMockData(page: number, perPage: number, totalResults: number,
                            prefix: string, delay: number, err: boolean): Observable<PagedResults> {
  return Observable.create(
    (obs: Observer<PagedResults>) => {
      const timerHandle = setTimeout(() => {
        if (err) {
          obs.error(new Error('Unable to connect'));
        } else {
          const entities = [];

          const firstEntityNo = (page - 1) * perPage + 1;

          let i = firstEntityNo;

          for (; i < firstEntityNo + perPage && i <= totalResults; i++) {
            entities.push({name: `${prefix} ${ i }`});
          }

          const results = new PagedResults(
            totalResults,
            page,
            entities
          );

          obs.next(results);
          obs.complete();
        }
      }, delay);

      return () => {
        clearTimeout(timerHandle);
      };
    });
}


xdescribe('genMockData', () => {
  let totalResults: number;
  let perPage: number;
  let err: boolean;
  let delay: number;
  let prefix: string;
  let page: number;

  beforeEach(() => {
    page = 1;
    prefix = 'Entity';
    delay = 0;
    perPage = 5;
    totalResults = 32;
    err = false;
  });

  it('should get first page of results', (done) => {
    prefix = 'Objects';

    genMockData(page, perPage, totalResults, prefix, delay, err).subscribe((result: PagedResults) => {
      expect(result.page).toBe(page);
      expect(result.total).toBe(totalResults);
      expect(result.entities.length).toBe(perPage);
      expect(result.entities[0].name).toBe(`${prefix} 1`);
      done();
    });
  });

  it('should generate error', (done) => {
    prefix = 'Objects';
    delay = 100;
    err = true;

    genMockData(page, perPage, totalResults, prefix, delay, err).subscribe((result: PagedResults) => {
      expect(false).toBe(true);
    }, (error) => {
      done();
    });
  });

  it('should get fifth page of results', (done) => {
    page = 5;

    genMockData(page, perPage, totalResults, prefix, delay, err).subscribe((result: PagedResults) => {
      expect(result.page).toBe(page);
      expect(result.total).toBe(totalResults);
      expect(result.entities.length).toBe(perPage);
      expect(result.entities[0].name).toBe(`${prefix} 21`);
      done();
    });
  });

  it('should get last page of results', (done) => {
    page = 7;

    genMockData(page, perPage, totalResults, prefix, delay, err).subscribe((result: PagedResults) => {
      expect(result.page).toBe(page);
      expect(result.total).toBe(totalResults);
      expect(result.entities.length).toBe(2);
      expect(result.entities[0].name).toBe(`${prefix} 31`);
      expect(result.entities[1].name).toBe(`${prefix} 32`);
      done();
    });
  });

  it('should return empty page of results beyond totalResults', (done) => {
    page = 8;

    genMockData(page, perPage, totalResults, prefix, delay, err).subscribe((result: PagedResults) => {
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

    genMockData(page, perPage, totalResults, prefix, delay, err).subscribe((result: PagedResults) => {
      expect(result.page).toBe(page);
      expect(result.total).toBe(totalResults);
      expect(result.entities.length).toBe(perPage);
      expect(result.entities[0].name).toBe(`${prefix} 21`);
      expect(new Date().getTime() - start).toBeGreaterThanOrEqual(2);
      done();
    });
  });

  it('should allow canceling', (done) => {
    page = 4;
    delay = 1500;

    const subs = genMockData(page, perPage, totalResults, prefix, delay, err).subscribe((result: PagedResults) => {
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
