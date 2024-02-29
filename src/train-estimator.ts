import * as constant from './constants';
import { DiscountCard } from './enums/discountCard';
import { InvalidTripInputException } from './models/exceptions/invalidTripInputException';
import { Passenger } from './models/passenger';
import { TripRequest } from './models/tripRequest';

import { addHours, calculateDaysDifference } from './utils';
import {ApiException} from "./models/exceptions/apiException";

export class TrainTicketEstimator {
  async estimate(tripRequest: TripRequest): Promise<number> {
    this.validTripRequestInput(tripRequest);

    let basePrice: number;
    try {
      basePrice = await this.getPriceFromApi(
        tripRequest.details.from,
        tripRequest.details.to,
        tripRequest.details.when
      );
    } catch (error) {
      throw new ApiException('Get price from api error');
    }

    const passengers = tripRequest.passengers;
    let totalPrice = 0;

    totalPrice = this.getTotalPriceForPassengers(passengers, basePrice, totalPrice, tripRequest);

    return totalPrice;
  }

  protected async getPriceFromApi(from: string, to: string, when: Date): Promise<number> {
    throw new ApiException('Should not be call from a test');
  }

  private getTotalPriceForPassengers(passengers: Passenger[], basePrice: number, totalPrice: number, tripRequest: TripRequest) {
    console.log("passengers.length", passengers.length)
    for (let i = 0; i < passengers.length; i++) {
      let tmp = basePrice;
      const passenger = passengers[i];

      if (passenger.age < 1) {
        continue
      };

      const between1And4YearsOld = passenger.age < 4;
      const trainStroke = passenger.discounts.includes(DiscountCard.TrainStroke);

      if (between1And4YearsOld || trainStroke) {
        tmp = between1And4YearsOld ? constant.PRICES.AGE_BETWEEN_1_AND_4_YEARS_OLD : constant.PRICES.TRAIN_STROKE_DISCOUNT_CARD;
        totalPrice += tmp;
        continue;
      }

      const discountForAge = this.getDiscountByAge(passenger.age);
      console.log('discountForAge', discountForAge)
      const discountForDate = this.getDiscountByDate(tripRequest.details.when);
      console.log('discountForDate', discountForDate)
      const discountForDiscountCard = this.getDiscountByDiscountCard(passenger, passengers);
      console.log('discountForDiscountCard', discountForDiscountCard)

      console.log('tmp', basePrice+'*'+discountForAge+'+'+basePrice+'*'+discountForDate+'+'+basePrice+'*'+discountForDiscountCard)
      tmp += basePrice * discountForAge + basePrice * discountForDate + basePrice * discountForDiscountCard;
      totalPrice += tmp;
    }
    return totalPrice;
  }

  private validTripRequestInput(tripRequest: TripRequest) {
    if (tripRequest.passengers.length === 0) {
      return 0;
    }
    else if (tripRequest.details.from.length === 0) {
      throw new InvalidTripInputException('Start city is invalid');
    }
    else if (tripRequest.details.to.length === 0) {
      throw new InvalidTripInputException('Destination city is invalid');
    }
    else if (tripRequest.details.when <= new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0)) {
      throw new InvalidTripInputException('Date is invalid');
    }

    tripRequest.passengers.forEach((passenger) => {
      if (passenger.age < 0) {
        throw new InvalidTripInputException('Age is invalid');
      }
    });
  }

  private getDiscountByDate(tripDate: Date) {
    const date = new Date();
    const sixHoursAgo = addHours(date, 6);
    const thirtyDaysFromNow = new Date(date.setDate(date.getDate() + 30));
    const fiveDaysAgo = new Date(date.setDate(date.getDate() - 30 + 5));

    if (tripDate >= thirtyDaysFromNow) {
      return constant.TRIP_DATE_DISCOUNTS.MORE_THAN_30_DAYS;
    }

    if (tripDate > fiveDaysAgo && tripDate >= sixHoursAgo) {
      const diffDays = calculateDaysDifference(tripDate, new Date());
      return (20 - diffDays) * constant.TRIP_DATE_DISCOUNTS.BETWEEN_5_AND_30_DAYS;
    }

    if (tripDate < fiveDaysAgo && tripDate <= sixHoursAgo) {
      return constant.TRIP_DATE_DISCOUNTS.IN_LESS_THAN_6_HOURS;
    }
    else return 1;
  }

  private getDiscountByAge(age: number) {
    if (age <= 17) {
      return constant.AGE_DISCOUNTS.UNDER_17;
    }
    else if (age >= 70) {
      return constant.AGE_DISCOUNTS.OVER_70;
    }
    else {
      return constant.AGE_DISCOUNTS.OTHER;
    }
  }

  private getDiscountByDiscountCard(passenger: Passenger, passengers: Passenger[]) {
    let totalDiscount = 0;

    if (passenger.lastName) {
      if (passengers.some(p => p.discounts.includes(DiscountCard.Family) || p.lastName === passenger.lastName)) {
        return constant.DISCOUNT_CARDS.FAMILY;
      }
    }

    if (passenger.discounts.includes(DiscountCard.Senior) && passenger.age >= 70) {
      totalDiscount += constant.DISCOUNT_CARDS.SENIOR;
    }

    if (passengers.length == 1 && passenger.discounts.includes(DiscountCard.HalfCouple) && passenger.age >= 18) {
      totalDiscount += constant.DISCOUNT_CARDS.HALF_COUPLE;
    }

    if (passengers.length == 2) {
      if (passengers.some(p => p.discounts.includes(DiscountCard.Couple)) && passengers.some(p => p.age >= 18)) {
        totalDiscount -= constant.DISCOUNT_CARDS.COUPLE;
      }
    }

    return totalDiscount;
  }
}
