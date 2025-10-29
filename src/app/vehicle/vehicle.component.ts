import { Component, OnDestroy, OnInit } from '@angular/core';
import { Vehicle } from './vehicle.model';
import { VehicleService } from './vehicle.service';
import { Observable, Subscription, take } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AsyncPipe, CommonModule,} from '@angular/common';

@Component({
  selector: 'veh-vehicle',
    imports: [
    FormsModule, 
    AsyncPipe,
    CommonModule,    
  ],
  standalone: true,
  templateUrl: './vehicle.component.html',
  styleUrl: './vehicle.scss',
})
export class VehicleComponent implements OnInit, OnDestroy {
  title: string = 'Employee Management Solution......';
  vehicles$!: Observable<Vehicle[]>;
  searchText: string = ''
  selectedModel: string = '';
  selectedVehicle: Vehicle | null = null;
  subscription!: Subscription;
  constructor(private vehicleService: VehicleService) { }

  ngOnInit(): void {

    this.loadVehicles();
  }

  loadVehicles(): void {
    this.vehicles$ = this.vehicleService.getVehicles()
  }

  searchVehiclesByModel(): void {
    if (!this.selectedModel) {
      this.loadVehicles();
    } else {
      this.vehicles$ = this.vehicleService.searchByModel(this.selectedModel);
    }
  }

  updateVehicle(): void {
    if (!this.selectedVehicle) return;
    this.vehicleService.updateVehicles(this.selectedVehicle.id, this.selectedVehicle)
      .subscribe({
        next: () => {
          this.loadVehicles();
          this.selectedVehicle = null;
        },
        error: err => console.error('Update failed', err)
      });
  }

  deleteVehicle(id: string): void {
    this.vehicleService.deleteVehicle(id)
      .pipe(take(1))
      .subscribe({
        next: () => this.loadVehicles(),
        error: err => console.error('Delete failed', err)
      });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

}
