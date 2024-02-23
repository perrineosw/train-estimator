import { TrainTicketEstimator } from "./train-estimator";
import { Passenger } from "./models/passenger";
import { TripDetails } from "./models/tripDetails";
import { InvalidTripInputException } from "./models/exceptions/invalidTripInputException";
import { TripRequest } from "./models/tripRequest";
import { DiscountCard } from "./enums/discountCard";

import { addHours } from "./utils";

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

    it("should throw an exception when a passenger age is invalid", async function () {
      const fakePassengerWithBadAge = new Passenger(-1, []);
      const tripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        new Date()
      );
      const tripRequest = new TripRequest(tripDetails, [
        fakePassengerWithBadAge,
      ]);

      await expect(
        async () => await trainTicketEstimator.estimate(tripRequest)
      ).rejects.toEqual(new InvalidTripInputException("Age is invalid"));
    });
  });

  describe("no exceptions thrown for valid inputs", function () {
    it("should not throw an exception when the starting city is valid", async function () {
      const tripDetails = new TripDetails(departureCity, cityOfArrival, new Date());
      const tripRequest = new TripRequest(tripDetails, [alice]);

      await expect(trainTicketEstimator.estimate(tripRequest)).resolves.not.toThrow();
    });

    it("should not throw an exception when the destination city is valid", async function () {
      const tripDetails = new TripDetails(departureCity, cityOfArrival, new Date());
      const tripRequest = new TripRequest(tripDetails, [alice]);

      await expect(trainTicketEstimator.estimate(tripRequest)).resolves.not.toThrow();
    });

    it("should not throw an exception when the date is valid", async function () {
      const validDate = new Date();
      validDate.setDate(validDate.getDate() + 10); // Future date, hence valid
      const tripDetails = new TripDetails(departureCity, cityOfArrival, validDate);
      const tripRequest = new TripRequest(tripDetails, [alice]);

      await expect(trainTicketEstimator.estimate(tripRequest)).resolves.not.toThrow();
    });

    it("should not throw an exception when all passenger ages are valid", async function () {
      const validPassenger = new Passenger(25, []); // Assuming this is a valid age
      const tripDetails = new TripDetails(departureCity, cityOfArrival, new Date());
      const tripRequest = new TripRequest(tripDetails, [validPassenger]);

      await expect(trainTicketEstimator.estimate(tripRequest)).resolves.not.toThrow();
    });
  });


  describe("static prices", function () {
    it("should return 0 when no passengers", async function () {
      const tripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        new Date()
      );
      const tripRequest = new TripRequest(tripDetails, []);
      const result = await trainTicketEstimator.estimate(tripRequest);

      expect(result).toBe(0);
    });

    it("should return 0 for a passenger under 1 year old", async function () {
      const passenger = new Passenger(0, []);
      const tripDetails: TripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        new Date()
      );
      const tripRequest: TripRequest = new TripRequest(tripDetails, [
        passenger,
      ]);

      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(0);
    });

    it("should return 9 for a passenger under 4 years old", async function () {
      const passenger = new Passenger(2, []);
      const tripDetails: TripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        new Date()
      );
      const tripRequest: TripRequest = new TripRequest(tripDetails, [
        passenger,
      ]);

      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(9);
    });

    it("should return 48 for a passenger more 4 years old and under 17 years", async function () {
      const passenger = new Passenger(6, []);
      const tripDetails: TripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        new Date()
      );
      const tripRequest: TripRequest = new TripRequest(tripDetails, [
        passenger,
      ]);

      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(48);
    });

    it("should return 16 due to Senior reduction", async function () {
      const passenger = new Passenger(70, [DiscountCard.Senior]);
      const tripDetails: TripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        new Date()
      );

      const tripRequest: TripRequest = new TripRequest(tripDetails, [
        passenger,
      ]);

      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(16);
    });

    it("should return 1 due to TrainStroke reduction", async function () {
      const passenger = new Passenger(70, [DiscountCard.TrainStroke]);
      const tripDetails: TripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        new Date()
      );

      const tripRequest: TripRequest = new TripRequest(tripDetails, [
        passenger,
      ]);


      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(1);
    });

    it("should return 24 due to Couple reduction", async function () {
      const passenger = new Passenger(70, [DiscountCard.Couple]);
      const tripDetails: TripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        new Date()
      );

      const tripRequest: TripRequest = new TripRequest(tripDetails, [
        passenger,
      ]);

      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(24);
    });

    it("should return 24 due to HalfCouple reduction", async function () {
      const passenger = new Passenger(70, [DiscountCard.HalfCouple]);
      const tripDetails: TripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        new Date()
      );

      const tripRequest: TripRequest = new TripRequest(tripDetails, [
        passenger,
      ]);
      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(20);
    });

    it("should return 24 due to Family reduction", async function () {
      const passenger = new Passenger(70, [DiscountCard.Family]);
      const tripDetails: TripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        new Date()
      );

      const tripRequest: TripRequest = new TripRequest(tripDetails, [
        passenger,
      ]);
      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(24);
    });
  });

  describe("dynamic prices", function () {
    let currentDate: Date;

    beforeAll(() => {
      currentDate = new Date();
    });

    it("should apply discount : 17 years, travel in 45 days", async function () {
      const tripDate = new Date();
      tripDate.setDate(currentDate.getDate() + 45);

      const passenger = new Passenger(17, []);
      const tripDetails: TripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        tripDate
      );

      const tripRequest: TripRequest = new TripRequest(tripDetails, [
        passenger,
      ]);

      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(48);
    });

    it("should apply discount : 65 years, travel in 20 days, Senior discount", async function () {
      const tripDate = new Date();
      tripDate.setDate(currentDate.getDate() + 20);

      const passenger = new Passenger(65, [DiscountCard.Senior]);
      const tripDetails: TripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        tripDate
      );

      const tripRequest: TripRequest = new TripRequest(tripDetails, [
        passenger,
      ]);

      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(48);
    });

    it("should apply increase : 22 years, travel in 4 days, HalfCouple discount", async function () {
      const tripDate = new Date();
      tripDate.setDate(currentDate.getDate() + 4);

      const passenger = new Passenger(22, [DiscountCard.HalfCouple]);
      const tripDetails: TripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        tripDate
      );

      const tripRequest: TripRequest = new TripRequest(tripDetails, [
        passenger,
      ]);

      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(84);
    });

    it("should apply discount : over 70 years and less 4 years, travel in 30 days", async function () {
      const tripDate = new Date();
      tripDate.setDate(currentDate.getDate() + 30);

      const passenger = new Passenger(72, [DiscountCard.Family]);
      const passenger2 = new Passenger(3, [DiscountCard.Family]);
      const tripDetails: TripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        tripDate
      );

      const tripRequest: TripRequest = new TripRequest(tripDetails, [
        passenger,
        passenger2,
      ]);


      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(33);
    });

    it("should apply discount : only if last name is given and last name is the same, Family discount", async function () {
      const tripDate = new Date();
      tripDate.setDate(currentDate.getDate() + 30);

      const tom = new Passenger(25, [DiscountCard.Family], "Dupont");
      const lala = new Passenger(24, [], "Dupont");
      const jaq = new Passenger(22, []);
      const tripDetails: TripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        tripDate
      );

      const tripRequest: TripRequest = new TripRequest(tripDetails, [
        tom,
        lala,
        jaq,
      ]);

      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(96);
    });

    it("should apply discount : travel in 6 hours, 20% increase (passenger age > 18)", async function () {
      const tripDate = addHours(currentDate, 6);

      const tom = new Passenger(25, []);
      const tripDetails: TripDetails = new TripDetails(
        departureCity,
        cityOfArrival,
        tripDate
      );

      const tripRequest: TripRequest = new TripRequest(tripDetails, [tom]);

      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(40);
    });
  });

  describe("more complex tests", function () {
    let bob: Passenger;
    let eve: Passenger;

    beforeAll(() => {
      bob = new Passenger(30, [DiscountCard.Senior]);
      eve = new Passenger(45, [DiscountCard.Family]);
    });

    it("should handle multiple passengers with different discount cards correctly", async function () {
      const tripDetails = new TripDetails(departureCity, cityOfArrival, new Date());
      const tripRequest = new TripRequest(tripDetails, [bob, eve]);
      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(80);
    });

    it("should apply no discounts when passengers do not qualify for any", async function () {
      const passenger = new Passenger(25, []); // No discounts
      const tripDetails = new TripDetails(departureCity, cityOfArrival, new Date());
      const tripRequest = new TripRequest(tripDetails, [passenger]);
      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(STARTING_PRICE);
    });

    it("should apply a group discount for more than 5 passengers", async function () {
      const passengers = Array(6).fill(new Passenger(25, []));
      const tripDetails = new TripDetails(departureCity, cityOfArrival, new Date());
      const tripRequest = new TripRequest(tripDetails, passengers);
      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(240);
    });

    it("should return the correct price for a last-minute booking", async function () {
      const passenger = new Passenger(30, []);
      const tripDate = addHours(new Date(), 1); // Booking 1 hour before departure
      const tripDetails = new TripDetails(departureCity, cityOfArrival, tripDate);
      const tripRequest = new TripRequest(tripDetails, [passenger]);

      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(40);
    });

    it("should correctly apply discounts for early bookings", async function () {
      const tripDate = new Date(new Date().setDate(new Date().getDate() + 30)); // Booking 30 days in advance
      const passenger = new Passenger(40, []);
      const tripDetails = new TripDetails(departureCity, cityOfArrival, tripDate);
      const tripRequest = new TripRequest(tripDetails, [passenger]);
      expect(await trainTicketEstimator.estimate(tripRequest)).toBe(40);
    });
  });

});
