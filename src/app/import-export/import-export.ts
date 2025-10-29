import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { importExportService } from './import-export.service';
import { SocketService } from '../shared/socket.service';

@Component({
  selector: 'veh-import-export',
  templateUrl: './import-export.html',
  styleUrl: './import-export.scss',
  imports: [CommonModule, FormsModule],
  standalone: true
})
export class ImportExportComponent implements OnInit, OnDestroy {

  ageOfVehicle!: number;
  selectedFile!: File;

  notificationMessage: string = '';
  downloadUrl: string = '';
  showDownloadPopup: boolean = false;

  private sub!: Subscription;

  constructor(
    private importExportService: importExportService,
    private socketService: SocketService
  ) { }

  // Change to getter - this fixes the refresh issue
  get clientName(): string | null {
    return localStorage.getItem('clientName');
  }

ngOnInit() {
  const clientName = localStorage.getItem('clientName'); // <-- key
  if (!clientName) return console.error('No clientName in localStorage');

  this.socketService.connectClient(clientName);

  this.socketService.jobNotification$.subscribe(data => {
    console.log('Notification received in component:', data);
    if (data?.message?.includes('Export completed')) {
      this.notificationMessage = data.message;
      this.downloadUrl = data.fileUrl;
      this.showDownloadPopup = true;
    }
  });
}
  ngOnDestroy(): void {
    if (this.sub) this.sub.unsubscribe();
  }

  handleFileInput(event: any) {
    this.selectedFile = event.target.files[0];
  }

  importCsv() {
    if (!this.selectedFile) return alert('Please select a CSV file');

    this.importExportService.importCsv(this.selectedFile)
      .then(() => alert('File uploaded and processing started'))
      .catch(err => console.error(err));
  }

  exportCsv() {
    if (!this.ageOfVehicle) return alert('Enter age of vehicle');
    if (!this.clientName) return alert('Please login first');

    this.importExportService.exportCsv(this.ageOfVehicle, this.clientName)
      .then(() => console.log('Export requested'))
      .catch(err => console.error(err));
  }

  downloadCsv() {
    const jobId = this.downloadUrl.split('/').pop() || '';
    this.importExportService.downloadCsv(jobId);
    this.showDownloadPopup = false;
  }
}