# In Flight

While switching a list view with data with different criteria
it becomes tricky to manage UI switch. This library facilitates the following:

- Blocks any requests that were made prior to the switch so
  that it does not show data from older request if that arrives late.
- Works even when one of the pages were getting loaded as part of
  infinite scroll.
- Provides clear state information on state which cane be used
  to provide proper indication to the user. Following flags are supported:
  - `dataLoaded` - will be set when data is loaded, this flag will help in
   distinguishing empty data from the state when no data is
   loaded yet.
  - `inFlight` - when data has been requested but not yet arrived.
  - `switchInProgress` - will provide additional
   qualification when data source/criteria is changing.
   This can be used to indicate the user that current data
   is stale or even putting a glass panel to block
   interaction.
  - `errored` - set to true when an error has occurred,
   will be cleared when a subsequent request is made.

## Install

Add npm package to your project.

## Usage

### Basic usage

```typescript
    const inFlight = new InFlight();

    // This will be passed to the function that gets actual data
    const perPage = 25;
    
    // If set to true it will clear the data before issuing next
    // request. Setting flase will cause the data to chnage when
    // first page of new request arrives.
    const clearData = true;
    
    inFlight.start(perPage, clearData, (page, perPage) => {
      return getAllImages(page, perPage);
    });
    
    inFlight.stateObservable.subscribe((state: InFlightState) => {
      // Will yield for every state change
    });
    
    // You can use state directly as a variable for binding
    let dataInFlight = inFlight.state.inFlight;
    let dataLoaded = inFlight.state.dataLoaded;
    
    inFlight.resultsObservable.subscribe((results:PagedResults) => {
      // Will yield whenever results change
      let totalResults = results.total;
      let currentPage = results.page;
      let entities = results.entities;
    });
    
    // Load additional page
    inFlight.getNextPage();
    
    // To switch the list entirely call start again with new criteria
    inFlight.start(5, true, (page, perPage) => {
      return getMyImages(page, perPage);
    });
```

### Implementing the data request function

It should return an `Observable` that should yield a `PagedResults`.
Typically it will be a `get` call on one of the Angular HTTP  classes
with potential chaining of `map` calls. The returned Observable should
support yield only once.              

## Developing

- src/app/inflight/gen-mock-data.spec.ts - part of testing framework, generates
  test data with an optional delay
- src/app/inflight/inflight-state.ts - structure for state
- src/app/inflight/inflight-*.spec.ts - test cases
- src/app/inflight/inflight.ts - main code
- src/app/interfaces/paged-results.ts - structure for paged results

Test cases have good coverage - has actually been more complex to develop than the
actual functionality. Mock Data Generator has test cases of its own which
are set to skip by default.

Beware test cases take significant time to run as these need to test delays
and errors.

```
$ ng test
```

