# In Flight

*Please read this documentation at https://kreatio-sw.github.io/inflight/*

## Motivation

Single Page Applications (SPA) pose unique issues which conventional applications did not face.
In an SPA, quite often the following situation is faced:

- There is a list of entities to be displayed.
- There are several links that will impact the selection criteria.
- There may be a search box that will further impact the selection criteria.

A pragmatic approach can be as follows: 

- When switching selection criteria, the previous query, which may still be
  in flight, needs to be canceled.
- Even the it could not be canceled it needs to be ensured that stale data
  does not show up in the UI (may happen if not implemented correctly).
- Regarding entries already displayed, while switching there may be several scenarios:

    - clear the current entries as soon a switch is requested.
    - do not clear, but prevent users from interacting with these.
    - do not clear, let users interact as well.
    - indicate users that a switch is in progress.

- Needs to simplify loading subsequent pages:

    - should indicate when a page is getting loaded.
    - should manage a switch even when a page is getting loaded.
    - must load pages in order.
    - should not load the same page twice.

- Ideally distinguish when no data has arrived from no entities matched the criteria.

- Allows updating entities locally:

    - updating some attributes.
    - adding new entities.
    - deleting entities.

Well, this library targets to simplify the above in simple and consistent ways.

## Supported State Flags

See [InFlightState](classes/InFlightState.html) for more details:

- [dataLoaded](classes/InFlightState.html#dataLoaded) - will be set 
 when data is loaded, this flag will help in
 distinguishing empty data from the state when no data is
 loaded yet.
- [inFlight](classes/InFlightState.html#inFlight) - when data 
 has been requested but not yet arrived.
- [switchInProgress](classes/InFlightState.html#switchInProgress) - will
 provide additional
 qualification when data source/criteria is changing.
 This can be used to indicate the user that current data
 is stale or even putting a glass panel to block
 interaction.
- [errored](classes/InFlightState.html#errored) - set to true when an error has occurred,
 will be cleared when a subsequent request is made.

## Considerations for local updates

*These issues are not specific to this library and not solved by
this library.*

Local updates when combined with pagination can get quite tricky.


Consider the cases when not all entities are loaded in the UI yet.

- Inserts:

    - Where to place the newly created entries
        - beginning
        - end
        - in the correct sort order (may not be possible as all
          matching entities are not loaded yet)
            
    - what to do if newly created entity does not match the current
      selection criteria
    
    - what to do if the newly added entities shows up on a subsequently added page

- Update:

    - what if the update changes the position of the entity as per the sort order
    - what if the entity no longer matches the selection criteria

- Delete:

    - will the pagination still work (i.e. subsequent pages will load correctly)
    - what if the entities get reloaded even before the delete got carried out in
      the data store.

## Install

Add npm package to your Angular4/Angular5 project:

```bash
$ npm -i @kreatio/inflight

# or

$ yarn add @kreatio/inflight
```

All classes are plain typescript classes, so you need not mention or provide any of these
in your project.

## Usage

See the following for API details:

- [InFlight](classes/InFlight.html) - main utility class
- [InFlightState](classes/InFlightState.html)
- [PagedResults](classes/PagedResults.html)
- [GetPageFunc](interfaces/GetPageFunc.html) - function template to fetch actual data

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
    
    // Load additional page if there are more pages
    if(inFlight.state.hasMorePages) {
      inFlight.getNextPage();
    }
    
    // To switch the list entirely call start again with new criteria
    inFlight.start(5, true, (page, perPage) => {
      return getMyImages(page, perPage);
    });
```

### Implementing the data request function

It should return an `Observable` that should yield a `PagedResults`.
Typically it will be a `get` call on one of the Angular HTTP  classes
with potential chaining of `map` calls. The returned Observable should
yield only once.              

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

