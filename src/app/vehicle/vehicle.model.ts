import { VehicleRecord } from "../record/record.model";

export interface Vehicle {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    car_make: string;
    car_model: string;
    vin: string;
    manufactured_date: string | Date; 
    age_of_the_vehicle?: number;

    vehicleRecords?: VehicleRecord[];
}