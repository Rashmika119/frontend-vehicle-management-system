import { Injectable } from "@angular/core";
import { Vehicle } from "../vehicle/vehicle.model";
import { CreateRecordDTO, UpdateRecordDTO, VehicleRecord } from "./record.model";
import { VehiclesGraphqlService } from "../shared/graphql.service";
import { Observable } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class VehicleRecordService {
    constructor(private graphService: VehiclesGraphqlService) { }

    getVehicles(): Observable<Vehicle[]> {
        return this.graphService.getVehicles();
    }

    updateVehicles(id: string, vehicle: Vehicle): Observable<any> {
        return this.graphService.updateVehicle(id, vehicle);
    }

    findVehicleByVin(vin: string): Observable<Vehicle | null> {
        return this.graphService.findVehicleByVin(vin);
    }

    deleteVehicle(id: string): Observable<boolean> {
        return this.graphService.deleteVehicle(id);
    }

    getAllVins(): Observable<string[]> {
        return this.graphService.getAllUniqueVins();
    }

    getRecordsByVin(vin: string): Observable<VehicleRecord[]> {
        return this.graphService.getRecordByVin(vin);
    }

    createRecord(recordData: CreateRecordDTO): Observable<VehicleRecord> {
        return this.graphService.createVehicleRecord(recordData);
    }

    updateRecord(id: string, updateData: UpdateRecordDTO): Observable<VehicleRecord> {
        return this.graphService.updateVehicleRecord(id, updateData);
    }

    deleteRecord(id: string): Observable<boolean> {
        return this.graphService.deleteVehicleRecord(id);
    }
}