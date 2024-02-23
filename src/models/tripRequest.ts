import { Passenger } from "./passenger";
import { TripDetails } from "./tripDetails";

export class TripRequest {
  constructor(
    readonly details: TripDetails,
    readonly passengers: Passenger[]
  ) {}
}
