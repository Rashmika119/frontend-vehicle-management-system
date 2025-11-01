import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { Vehicle } from '../vehicle/vehicle.model'; // Assuming location
import { VehicleRecord } from './record.model'; // Assuming location
import { VehicleRecordService } from './record.service';
import { CommonModule, DatePipe } from '@angular/common';
 // Assuming location

@Component({
    selector: 'veh-record',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './record.html',
  styleUrls: ['./record.scss'],

})
export class RecordComponent implements OnInit {
  // --- Properties for VIN Search Section (Top Card) ---
  vinValue: string = '';
  searched: boolean = false;
  vehicle$!: Observable<Vehicle | null>;

  // --- Properties for Manage Records Section (Bottom Card) ---
  vins: string[] = []; // This array is what the dropdown binds to.
  selectedVin: string | null = null;
  
  // Storage for all records of the currently selected VIN, used for local filtering
  allRecordsForSelectedVin: VehicleRecord[] = []; 
  filteredRecords: VehicleRecord[] = [];
  isVinsLoading: boolean = true;
  loading: boolean = false; // For the records spinner
  
  // Reactive Form for filtering
  filterForm: FormGroup;
  private vinSubscription: Subscription | undefined;
  private recordsSubscription: Subscription | undefined;

  constructor(private recordService: VehicleRecordService) {
    // Initialize the filter form
    this.filterForm = new FormGroup({
      category: new FormControl(''),
      description: new FormControl(''),
    });
  }

  // 👇 FIX: Fetch VINs when the component loads
  ngOnInit(): void {
this.recordService.getAllVins().subscribe({
        next: (vinsArray: string[]) => {
            this.vins = vinsArray;
            this.isVinsLoading = false; // <-- Set to false on success
        },
        error: (err) => {
            console.error('Error fetching VINs for dropdown:', err);
            this.isVinsLoading = false; // <-- Set to false on error
        }
    });    this.vinSubscription = this.recordService.getAllVins().subscribe({
      next: (vinsArray: string[]) => {
        this.vins = vinsArray;
      },
      error: (err) => {
        console.error('Error fetching VINs for dropdown:', err);
      }
    });

    // 2. Subscribe to filter form changes to automatically apply the filter
    this.filterForm.valueChanges.subscribe(() => {
        this.applyFilter();
    });
  }
  
  // Ensure we clean up subscriptions on destroy
  ngOnDestroy(): void {
    this.vinSubscription?.unsubscribe();
    this.recordsSubscription?.unsubscribe();
  }

  // --- Methods for Manage Records Section ---
  
  // Called when the user selects a VIN from the dropdown
  onVinSelect(): void {
    // Clear previous records and show loading state
    this.allRecordsForSelectedVin = [];
    this.filteredRecords = [];
    this.loading = false;
    this.recordsSubscription?.unsubscribe(); // Unsubscribe from previous fetch

    if (this.selectedVin) {
      this.loading = true; // Show loading spinner
      
      // Fetch the records for the selected VIN
      this.recordsSubscription = this.recordService.getRecordsByVin(this.selectedVin).subscribe({
        next: (records: VehicleRecord[]) => {
          this.allRecordsForSelectedVin = records;
          this.applyFilter(); // Apply any existing filter after fetching
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching records by VIN:', err);
          this.loading = false;
        }
      });
    }
  }

  // Applies the local filter based on the form inputs
  applyFilter(): void {
    if (!this.allRecordsForSelectedVin.length) {
      this.filteredRecords = [];
      return;
    }

    const { category, description } = this.filterForm.value;
    const lowerCategory = (category || '').toLowerCase();
    const lowerDescription = (description || '').toLowerCase();

    this.filteredRecords = this.allRecordsForSelectedVin.filter(record => {
      const categoryMatch = !lowerCategory || record.category.toLowerCase().includes(lowerCategory);
      const descriptionMatch = !lowerDescription || record.description.toLowerCase().includes(lowerDescription);
      return categoryMatch && descriptionMatch;
    });
  }
  
  // A required method for better performance with *ngFor
  trackById(index: number, item: VehicleRecord): string | undefined {
    return item.id; 
  }

  // --- Other Methods (for completeness, assuming they are implemented) ---
  
  findVehicleByVin(): void {
    this.searched = true;
    this.vehicle$ = this.recordService.findVehicleByVin(this.vinValue);
  }

  clearSearch(): void {
    this.vinValue = '';
    this.searched = false;
    this.vehicle$ = new Observable<Vehicle | null>(); // Clear the observable
  }
  
  onUpdate(record: VehicleRecord): void {
    // Implementation for update logic (e.g., open a modal)
    console.log('Update record:', record);
  }

  onDelete(record: VehicleRecord): void {
    if (record.id) {
        this.recordService.deleteRecord(record.id).subscribe({
            next: (success) => {
                if (success) {
                    console.log(`Record ${record.id} deleted.`);
                    // Re-fetch or locally remove the record to update the UI
                    this.onVinSelect(); // Easiest way to refresh the list
                }
            },
            error: (err) => console.error('Delete failed:', err)
        });
    }
  }
}