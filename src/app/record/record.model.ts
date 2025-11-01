export interface VehicleRecord {
    id?: string;
    vin: string;
    category: string;
    repair_date: Date | string; 
    description: string;
}