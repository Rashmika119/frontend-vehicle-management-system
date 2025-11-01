import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { interval, Subscription } from 'rxjs';
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

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  ageOfVehicle!: number;
  selectedFile: File | null = null;

  notificationMessage: string = '';
  downloadUrl: string = '';
  showDownloadPopup: boolean = false;
  jobId: string = '';
  countdown: number = 10;

  private sub!: Subscription;
  private countdownSub!: Subscription;

  constructor(
    private importExportService: importExportService,
    private socketService: SocketService,
    private cdr: ChangeDetectorRef
  ) { }

  get clientName(): string | null {
    return localStorage.getItem('clientName');
  }

  ngOnInit() {
    const clientName = localStorage.getItem('clientName');
    if (!clientName) return console.error('No clientName in localStorage');

    this.socketService.connectClient(clientName);

    this.sub = this.socketService.jobNotification$.subscribe(data => {
      console.log('Notification received in component:', data);
      
      if (data && data.message && data.message.includes('Export completed')) {
        console.log('Processing export notification...');
        
        this.notificationMessage = data.message;
        this.downloadUrl = data.fileUrl;
        this.jobId = data.jobId;
        this.showDownloadPopup = true;
        
        this.cdr.detectChanges();
        console.log('Popup should be visible now');
        
        this.startCountdown();
      } else if (data && data.message && data.message.includes('Import completed')) {
        console.log('Import completed');
        this.notificationMessage = 'Import completed successfully!';
        
        setTimeout(() => {
          this.notificationMessage = '';
          this.cdr.detectChanges();
        }, 5000);
        
        this.cdr.detectChanges();
      }
    });
  }

  startCountdown() {
    this.countdown = 10;
    
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
    }

    this.countdownSub = interval(1000).subscribe(() => {
      this.countdown--;
      console.log('Countdown:', this.countdown);
      
      if (this.countdown <= 0) {
        console.log('Auto-closing popup');
        this.closePopup();
      }
      
      this.cdr.detectChanges();
    });
  }

  closePopup() {
    this.showDownloadPopup = false;
    this.notificationMessage = '';
    this.countdown = 10;
    
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
    }
    
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
    }
  }

  handleFileInput(event: any) {
    const file = event.target.files[0];
    if (file) {

      if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Please select a valid CSV file');
        this.selectedFile = null;
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
        return;
      }
      
      const maxSize = 10 * 1024 * 1024; 
      if (file.size > maxSize) {
        alert('File is too large. Maximum size is 10MB');
        this.selectedFile = null;
        if (this.fileInput) {
          this.fileInput.nativeElement.value = '';
        }
        return;
      }
      
      this.selectedFile = file;
      console.log('File selected:', file.name, `(${(file.size / 1024).toFixed(2)} KB)`);
    }
  }

  async importCsv() {
    if (!this.selectedFile) {
      alert('Please select a CSV file');
      return;
    }

    if (!this.clientName) {
      alert('Please login first');
      return;
    }

    try {
      console.log('Uploading file:', this.selectedFile.name);
      this.notificationMessage = 'Uploading file...';
      
      await this.importExportService.importCsv(this.selectedFile);
      
      console.log('File uploaded successfully');
      this.notificationMessage = 'File uploaded successfully. Processing...';
      
      this.selectedFile = null;
      if (this.fileInput) {
        this.fileInput.nativeElement.value = '';
      }
      
      setTimeout(() => {
        this.notificationMessage = '';
        this.cdr.detectChanges();
      }, 5000);
      
    } catch (err) {
      console.error('Import failed:', err);
      this.notificationMessage = 'Import failed. Please try again.';
      
      setTimeout(() => {
        this.notificationMessage = '';
        this.cdr.detectChanges();
      }, 5000);
    }
  }

  exportCsv() {
    if (!this.ageOfVehicle || this.ageOfVehicle <= 0) {
      alert('Please enter a valid vehicle age');
      return;
    }

    if (!this.clientName) {
      alert('Please login first');
      return;
    }

    console.log('Exporting CSV for age >=', this.ageOfVehicle);
    
    this.notificationMessage = 'Export in progress...';
    
    this.importExportService.exportCsv(this.ageOfVehicle, this.clientName)
      .then(() => {
        console.log('Export request sent successfully');
      })
      .catch(err => {
        console.error('Export failed:', err);
        this.notificationMessage = 'Export failed. Please try again.';
        
        setTimeout(() => {
          this.notificationMessage = '';
          this.cdr.detectChanges();
        }, 5000);
      });
  }

  downloadCsv() {
    console.log('Downloading file...');
    const fileName = `export-${this.jobId}.csv`;
    this.importExportService.downloadCsv(this.jobId, fileName);
    this.closePopup();
  }
}