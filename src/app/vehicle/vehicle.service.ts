import { Injectable } from "@angular/core";
import { VehiclesGraphqlService } from "../shared/graphql.service";
import { Observable } from "rxjs";
import { Vehicle } from "./vehicle.model";

@Injectable({
    providedIn: 'root'
})
export class VehicleService {
    constructor(private graphService: VehiclesGraphqlService) { }

    getVehicles(): Observable<Vehicle[]> {
        return this.graphService.getVehicles();
    }

    updateVehicles(id: string, vehicle: Vehicle): Observable<any> {
        return this.graphService.updateVehicle(id, vehicle);
    }

    searchByModel(model: string): Observable<Vehicle[]> {
        return this.graphService.searchByModel(model);
    }

    deleteVehicle(id: string): Observable<any> {
        return this.graphService.deleteVehicle(id);
    }
}