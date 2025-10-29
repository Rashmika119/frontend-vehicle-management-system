import { Component, signal } from '@angular/core';
import { VehicleComponent } from './vehicle/vehicle.component';
import { RouterModule } from '@angular/router';
import { ImportExportComponent } from './import-export/import-export';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'veh-root',
  standalone: true,
  imports: [VehicleComponent, RouterModule,ImportExportComponent,FormsModule,CommonModule],
  templateUrl: './app.html', 
  styleUrls: ['./app.scss'],   
})
export class App {
  title = signal('vehicle-application');
  showLogin: boolean = false;
  username: string = '';

  fullName(): string | null {
    return localStorage.getItem('clientName');
  }

  login() {
    if (!this.username.trim()) {
      alert('Please enter a name');
      return;
    }
    localStorage.setItem('clientName', this.username.trim());
    this.showLogin = false;
    this.username = '';
  }

  logout() {
    localStorage.removeItem('clientName');
  }
}
