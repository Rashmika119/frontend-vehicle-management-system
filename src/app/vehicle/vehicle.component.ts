import { Component, OnDestroy, OnInit } from '@angular/core';
import { Vehicle } from './vehicle.model';

import { Observable, Subscription, take } from 'rxjs';
import { FormControl, FormGroup, FormsModule, Validators } from '@angular/forms';
import { AsyncPipe, CommonModule, DatePipe } from '@angular/common';
import { VehicleService } from './vehicle.service';

@Component({
  selector: 'veh-vehicle',
  imports: [
    FormsModule,
    AsyncPipe,
    CommonModule,
    DatePipe
  ],
  standalone: true,
  templateUrl: './vehicle.component.html',
  styleUrl: './vehicle.scss',
})
export class VehicleComponent implements OnInit, OnDestroy {
  title: string = 'Vehicle Management System';
  vehicles$!: Observable<Vehicle[]>;
  searchText: string = '';
  selectedModel: string = '';
  selectedVehicle: Vehicle | null = null;
  vehicleToDelete: Vehicle | null = null;
  currentPage:number=1;
  limit:number=20;
  totalItems:number=0;
  totalPages:number=0;
  // updateForm: FormGroup;

  private subscriptions: Subscription = new Subscription();
  constructor(private vehicleService: VehicleService) { }
  //           this.updateForm = new FormGroup({
  //           first_name: new FormControl('', Validators.required),
  //           last_name: new FormControl('', Validators.required),
  //           email: new FormControl('', Validators.required),
  //           car_model: new FormControl('', Validators.required),
  //           vin: new FormControl('', Validators.required),
  //           manufactured_date: new FormControl('', Validators.required),

  //       });
  // }

  ngOnInit(): void {
    this.loadTotalCount();
    this.loadVehicles();
  }

  loadVehicles(): void {
    console.log(`Loading vehicles for page ${this.currentPage}`);
    this.vehicles$ = this.vehicleService.getVehicles(this.currentPage,this.limit);
  }

  loadTotalCount():void{
    this.subscriptions.add(
      this.vehicleService.getAllVehicleVins().subscribe(result=>{
        this.totalItems=result.totalCount;
        this.totalPages=Math.ceil(this.totalItems/this.limit)
        console.log(`Total VINs: ${this.totalItems},Total Pages :${this.totalPages}`);
      })
    )
  }

goToPage(page: number): void {
  if (page < 1 || page > this.totalPages) {
    console.log("page is out of bound ", page);
    return;
  }
  this.currentPage = page;
  console.log("current page: ", this.currentPage);
  this.loadVehicles();
}

  getPageNumbers(): number[] {
  return Array.from({ length: this.totalPages }, (_, i) => i + 1);
}
  // changePage(page:number):void{
  //   if(page>=1 && page<=this.totalPages){
  //     this.currentPage=page;
  //     this.loadVehicles();
  //   }
  // }

  searchVehiclesByModel(): void {
    if (!this.selectedModel || this.selectedModel.trim() === '') {
      console.log('Clearing filter, loading all vehicles');
      this.loadVehicles();
    } else {
      console.log('Searching by model:', this.selectedModel);
      this.vehicles$ = this.vehicleService.searchByModel(this.selectedModel);
    }
  }

  clearFilter(): void {
    this.selectedModel = '';
    this.loadVehicles();
  }

  editVehicle(vehicle: Vehicle): void {
    console.log('Editing vehicle:', vehicle.id);
    this.selectedVehicle = { ...vehicle };
  }

  closeEditModal(): void {
    this.selectedVehicle = null;
  }

  updateVehicle(): void {
    if (!this.selectedVehicle) {
      console.error('No vehicle selected for update');
      return;
    }

    const requiredFields:(keyof Vehicle)[]=['first_name','last_name','email','car_model','vin','manufactured_date'];
    for(const field of requiredFields){
      if(!this.selectedVehicle[field] || this.selectedVehicle[field].toString().trim()===''){
          alert(`Please fill the ${field} field before updating.`);
          return;
      }
    }
    console.log('Updating vehicle:', this.selectedVehicle.id);

    const sub = this.vehicleService.updateVehicles(this.selectedVehicle.id, this.selectedVehicle)
      .subscribe({
        next: () => {
          console.log('Vehicle updated successfully');
          this.loadVehicles();
          this.selectedVehicle = null;
          alert('Vehicle updated successfully!');
        },
        error: err => {
          console.error(' Update failed:', err);
          alert('Failed to update vehicle. Please try again.');
        }
      });

    this.subscriptions.add(sub);
  }

  confirmDelete(vehicle: Vehicle): void {
    console.log('Confirming delete for vehicle:', vehicle.id);
    this.vehicleToDelete = vehicle;
  }

  cancelDelete(): void {
    this.vehicleToDelete = null;
  }

  deleteVehicle(): Boolean {
    if (!this.vehicleToDelete) {
      console.error('No vehicle selected for deletion');
      return false;
    }

    const vehicleId = this.vehicleToDelete.id;
    console.log('Deleting vehicle:', vehicleId);

    const sub = this.vehicleService.deleteVehicle(vehicleId)
      .pipe(take(1))
      .subscribe({
        next: success => {
          if (success) {
            console.log('Vehicle deleted successfully');
            this.vehicleToDelete = null;
            this.loadVehicles();
            alert('Vehicle deleted successfully!');
          } else {
            alert('Vehicle deletion failed.');
          }
        },
        error: err => {
          console.error('Delete failed:', err);
          alert('Failed to delete vehicle. Please try again.');
        }
      });

    this.subscriptions.add(sub);
    return true;
  }


  ngOnDestroy(): void {
    if (this.subscriptions) {
      this.subscriptions.unsubscribe();
      console.log('Subscriptions cleaned up');
    }
  }
}