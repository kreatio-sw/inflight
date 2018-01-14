
export class InFlightState {
  dataLoaded = false;
  changeInFlight = false;
  pageInFlight = false;

  public inFligt() {
    return this.changeInFlight || this.pageInFlight;
  }
}
