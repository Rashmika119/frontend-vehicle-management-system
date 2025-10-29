import { Injectable } from "@angular/core";
import { VehiclesGraphqlService } from "../shared/graphql.service";
import { Observable } from "rxjs";
import { HttpService } from "../shared/http.service";


@Injectable({
    providedIn: 'root'
})
export class importExportService {
    constructor(private httpService: HttpService) { }

    importCsv(file: File): Promise<any> {
        return this.httpService.uploadCsv(file);
    }
    exportCsv(ageOfVehicle: number, clientName: string): Promise<any> {
        return this.httpService.requestExport(ageOfVehicle, clientName);
    }
    downloadCsv(jobId: string, fileName?: string): Promise<void> {
        return this.httpService.downloadCsv(jobId, fileName);
    }
}