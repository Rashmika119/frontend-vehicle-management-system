export interface VehicleRecord {
    id?: string;
    vin: string;
    category: string;
    repair_date: Date | string; 
    description: string;
}
export interface CreateRecordDTO {
    vin: string;
    category: string;
    repair_date: string;
    description: string;
}

export interface UpdateRecordDTO {
    category?: string;
    repair_date?: string;
    description?: string;
}