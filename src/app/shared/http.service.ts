import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { lastValueFrom } from "rxjs";

@Injectable({
    providedIn:'root'
})

export class HttpService{
private baseUrl = 'http://localhost:3000/file'; // Import/download endpoints
  private jobUrl = 'http://localhost:3000/job';   // Export endpoint

  constructor(private http: HttpClient) {}

  // -------------------
  // CSV Import
  // -------------------
  async uploadCsv(file: File) {
    if (!file) throw new Error('No file selected');

    const formData = new FormData();
    formData.append('file', file, file.name);

    try {
      const response = await lastValueFrom(
        this.http.post(`${this.baseUrl}/import`, formData)
      );
      console.log('CSV uploaded successfully', response);
      return response;
    } catch (err) {
      console.error('Error uploading CSV:', err);
      throw err;
    }
  }

  async requestExport(ageOfVehicle: number, clientName: string) {
    const payload = { age_of_the_vehicle: ageOfVehicle, clientName };
    try {
      const response = await lastValueFrom(
        this.http.post(`${this.jobUrl}/export`, payload)
      );
      console.log('Export request sent', response);
      return response;
    } catch (err) {
      console.error('Error requesting export:', err);
      throw err;
    }
  }

  async downloadCsv(jobId: string, fileName?: string) {
    const url = `${this.jobUrl}/download/${jobId}`;
    console.log('download url',url)
    try {
      const blob = await lastValueFrom(
        this.http.get(url, { responseType: 'blob' })
      );

      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = fileName || `${jobId}.csv`;
      link.click();
      window.URL.revokeObjectURL(link.href);
      console.log('CSV download triggered');
    } catch (err) {
      console.error('Error downloading CSV:', err);
      throw err;
    }
  }
}