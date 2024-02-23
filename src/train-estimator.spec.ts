import { TrainTicketEstimator } from "./train-estimator";
import { Passenger } from "./models/passenger";
import { TripDetails } from "./models/tripDetails";
import { InvalidTripInputException } from "./models/exceptions/invalidTripInputException";
import { TripRequest } from "./models/tripRequest";
const STARTING_PRICE = 40;

class TrainTicketEstimatorOverload extends TrainTicketEstimator {
  protected async getPriceFromApi(
    from: string,
    to: string,
    when: Date
  ): Promise<number> {
    return await Promise.resolve(STARTING_PRICE);
  }
}

describe("train estimator", function () {
  let alice: Passenger;
  let trainTicketEstimator: TrainTicketEstimatorOverload;
  let departureCity: string;
  let cityOfArrival: string;

  beforeAll(() => {
    alice = new Passenger(20, []);
    trainTicketEstimator = new TrainTicketEstimatorOverload();
    departureCity = "Bordeaux";
    cityOfArrival = "Paris";
  });

  describe("exceptions thrown", function () {
    it("should throw an exception when the starting city is invalid", async function () {
      const tripDetails = new TripDetails("", cityOfArrival, new Date());
      const tripRequest = new TripRequest(tripDetails, [alice]);

      await expect(
        async () => await trainTicketEstimator.estimate(tripRequest)
      ).rejects.toEqual(new InvalidTripInputException("Start city is invalid"));
    });

    it("should throw an exception when destination city is invalid", async function () {
      const tripDetails = new TripDetails(departureCity, "", new Date());
      const tripRequest = new TripRequest(tripDetails, [alice]);

      await expect(
        async () => await trainTicketEstimator.estimate(tripRequest)
      ).rejects.toEqual(
        new InvalidTripInputException("Destination city is invalid")
      );
    });

    it("should throw an exception when the date is invalid", async function () {
      const badDate = new Date();
      badDate.setDate(badDate.getDay() - 10);
      const tripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        badDate
      );
      const tripRequest = new TripRequest(tripDetails, [alice]);

      await expect(
        async () => await trainTicketEstimator.estimate(tripRequest)
      ).rejects.toEqual(new InvalidTripInputException("Date is invalid"));
    });
  });

  describe("no exceptions thrown for valid inputs", function () {
    it("should not throw an exception when the starting city is valid", async function () {
      const tripDetails = new TripDetails(departureCity, cityOfArrival, new Date());
      const tripRequest = new TripRequest(tripDetails, [alice]);

      await expect(trainTicketEstimator.estimate(tripRequest)).resolves.not.toThrow();
    });
  });

});
