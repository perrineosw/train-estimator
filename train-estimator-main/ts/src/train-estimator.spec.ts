// Importez les classes nécessaires depuis les chemins corrects
import { TrainTicketEstimator } from './train-estimator';
import { Passenger } from './model/trip.request';
import { ApiException, DiscountCard, InvalidTripInputException, TripRequest, TripDetails } from './model/trip.request';

describe('TrainTicketEstimator', () => {
    let estimator: TrainTicketEstimator;

    beforeAll(() => {
        // Simulez global.fetch ici si nécessaire
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ price: 100 }),
            })
        ) as jest.Mock;
    });

    beforeEach(() => {
        estimator = new TrainTicketEstimator();
    });

    it('devrait renvoyer 0 si aucun passager n\'est fourni', async () => {
        const tripRequest = new TripRequest(new TripDetails('Paris', 'Lyon', new Date()), []);
        await expect(estimator.estimate(tripRequest)).resolves.toBe(0);
    });

   it('devrait lancer une exception InvalidTripInputException pour une ville de arrivé invalide', async () => {
        const tripRequest = new TripRequest(new TripDetails('Paris', '', new Date()), [new Passenger(25, [])]);
        await expect(estimator.estimate(tripRequest)).rejects.toThrow("Destination city is invalid");
   });

   it('Verifie la date', async () => {
        const tripRequest = new TripRequest(new TripDetails('Paris', 'Lyon', new Date('2021-01-01')), [new Passenger(25, [])]);
        await expect(estimator.estimate(tripRequest)).rejects.toThrow("Date is invalid");
   });

    it('devrait lancer une exception InvalidTripInputException pour une ville de départ invalide', async () => {
        const tripRequest = new TripRequest(new TripDetails('', 'Lyon', new Date()), [new Passenger(25, [])]);
        await expect(estimator.estimate(tripRequest)).rejects.toThrow("Start city is invalid");
    });

    // Ajoutez ici d'autres tests pour couvrir les cas d'utilisation, comme les réductions pour seniors,
    // les passagers avec des cartes de réduction, les dates invalides, etc.

    afterEach(() => {
        jest.clearAllMocks();
    });
});
