import { DiscountCard } from "src/enums/discountCard";

export class Passenger {
  constructor(
    readonly age: number,
    readonly discounts: DiscountCard[],
    readonly lastName?: string
  ) {}
}
