/**
 * Represents current state of {@link InFlight}
 */
export class InFlightState {
  /**
   * Will be set when at least one page of results are available.
   * It will be set even if zero entities were received.
   * This flag will help in distinguishing empty data from
   * the state when no data is loaded yet.
   *
   * @type {boolean}
   */
  dataLoaded = false;

  /**
   * Will be set when request is in in-flight.
   *
   * @type {boolean}
   */
  inFlight = false;

  /**
   * Will be set when an error is raised while fetching results.
   * It will be reset when making a new request.
   *
   * @type {boolean}
   */
  errored = false;

  /**
   * Will be set when when data source/criteria is changing.
   * This can be used to indicate the user that current data
   * is stale or even putting a glass panel to block interaction.
   *
   * @type {boolean}
   */
  switchInProgress = false;
}
