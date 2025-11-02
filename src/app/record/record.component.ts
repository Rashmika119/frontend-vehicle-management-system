import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { Vehicle } from '../vehicle/vehicle.model';
import { CreateRecordDTO, UpdateRecordDTO, VehicleRecord } from './record.model';
import { VehicleRecordService } from './record.service';
import { CommonModule, DatePipe } from '@angular/common';

@Component({
    selector: 'veh-record',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe],
    templateUrl: './record.html',
    styleUrls: ['./record.scss'],
})
export class RecordComponent implements OnInit, OnDestroy {
    // Search Section
    searchVin: string = '';
    searchedVehicle: Vehicle | null = null;
    searchedRecords: VehicleRecord[] = [];
    searchLoading: boolean = false;
    searchPerformed: boolean = false;

    // Dropdown Section
    vins: string[] = [];
    selectedVin: string | null = null;
    dropdownRecords: VehicleRecord[] = [];

    // Update Modal
    isUpdateModalOpen: boolean = false;
    selectedRecordId: string | null = null;
    updateForm: FormGroup;

    // Create Modal
    isCreateModalOpen: boolean = false;
    createForm: FormGroup;

    private subscriptions: Subscription = new Subscription();

    constructor(
        private recordService: VehicleRecordService,
        private cdr: ChangeDetectorRef
    ) {
        // Initialize Update Form
        this.updateForm = new FormGroup({
            category: new FormControl('', Validators.required),
            repair_date: new FormControl('', Validators.required),
            description: new FormControl('', Validators.required)
        });

        // Initialize Create Form
        this.createForm = new FormGroup({
            vin: new FormControl('', Validators.required),
            category: new FormControl('', Validators.required),
            repair_date: new FormControl('', Validators.required),
            description: new FormControl('', Validators.required)
        });
    }

    ngOnInit(): void {
        this.loadVins();
    }

    // Load all VINs for dropdown
    loadVins(): void {
        const sub = this.recordService.getAllVins().subscribe({
            next: (vins) => {
                this.vins = vins;
                console.log('VINs loaded:', this.vins);
            },
            error: (err) => {
                console.error('Failed to load VINs:', err);
                alert('Failed to load VINs.');
            }
        });
        this.subscriptions.add(sub);
    }

    // SEARCH SECTION
    searchVehicle(): void {
        if (!this.searchVin || this.searchVin.trim() === '') {
            alert('Please enter a VIN to search.');
            return;
        }

        this.searchLoading = true;
        this.searchPerformed = false;

        const sub = this.recordService.findVehicleByVin(this.searchVin.trim()).subscribe({
            next: (vehicle) => {
                this.searchedVehicle = vehicle;
                if (vehicle) {
                    this.loadSearchRecords(this.searchVin.trim());
                } else {
                    this.searchedRecords = [];
                    this.searchLoading = false;
                    this.searchPerformed = true;
                }
            },
            error: (err) => {
                console.error('Error searching vehicle:', err);
                alert('Error occurred while searching.');
                this.searchLoading = false;
                this.searchPerformed = true;
                this.searchedVehicle = null;
                this.searchedRecords = [];
            }
        });
        this.subscriptions.add(sub);
    }

    loadSearchRecords(vin: string): void {
        const sub = this.recordService.getRecordsByVin(vin).subscribe({
            next: (records) => {
                this.searchedRecords = records;
                this.searchLoading = false;
                this.searchPerformed = true;
            },
            error: (err) => {
                console.error('Error loading search records:', err);
                this.searchedRecords = [];
                this.searchLoading = false;
                this.searchPerformed = true;
            }
        });
        this.subscriptions.add(sub);
    }

    clearSearch(): void {
        this.searchVin = '';
        this.searchedVehicle = null;
        this.searchedRecords = [];
        this.searchPerformed = false;
    }

    // DROPDOWN SECTION
    onVinSelect(): void {
        if (!this.selectedVin) {
            this.dropdownRecords = [];
            return;
        }

        const sub = this.recordService.getRecordsByVin(this.selectedVin).subscribe({
            next: (records) => {
                this.dropdownRecords = records;
            },
            error: (err) => {
                console.error('Error fetching records:', err);
                alert('Failed to load records for selected VIN.');
                this.dropdownRecords = [];
            }
        });
        this.subscriptions.add(sub);
    }

    // UPDATE OPERATIONS
    openUpdateModal(record: VehicleRecord): void {
        this.selectedRecordId = record.id || null;
        
        const repairDate = record.repair_date instanceof Date
            ? record.repair_date.toISOString().split('T')[0]
            : record.repair_date;

        this.updateForm.patchValue({
            category: record.category,
            repair_date: repairDate,
            description: record.description
        });

        this.isUpdateModalOpen = true;
    }

    closeUpdateModal(): void {
        this.isUpdateModalOpen = false;
        this.updateForm.reset();
        this.selectedRecordId = null;
    }

    saveUpdate(): void {
        if (!this.selectedRecordId || this.updateForm.invalid) {
            alert('Please fill all required fields.');
            return;
        }

        const updateData: UpdateRecordDTO = this.updateForm.value;

        const sub = this.recordService.updateRecord(this.selectedRecordId, updateData).subscribe({
            next: (updatedRecord) => {
                alert('Record updated successfully!');
                this.closeUpdateModal();
                
                // Refresh data
                this.loadVins();
                if (this.selectedVin) {
                    this.onVinSelect();
                }
                if (this.searchPerformed && this.searchVin) {
                    this.searchVehicle();
                }
            },
            error: (err) => {
                console.error('Error updating record:', err);
                alert('Failed to update record.');
            }
        });
        this.subscriptions.add(sub);
    }

    // DELETE OPERATIONS
    deleteRecord(record: VehicleRecord): void {
        if (!record.id) return;

        const confirmed = confirm('Are you sure you want to delete this record?');
        if (!confirmed) return;

        const sub = this.recordService.deleteVehicle(record.id).subscribe({
            next: (success) => {
                if (success) {
                    alert('Record deleted successfully!');
                    
                    // Refresh data
                    this.loadVins();
                    if (this.selectedVin) {
                        this.onVinSelect();
                    }
                    if (this.searchPerformed && this.searchVin) {
                        this.searchVehicle();
                    }
                } else {
                    alert('Failed to delete record.');
                }
            },
            error: (err) => {
                console.error('Error deleting record:', err);
                alert('An error occurred while deleting the record.');
            }
        });
        this.subscriptions.add(sub);
    }

    // CREATE OPERATIONS
    openCreateModal(): void {
        this.isCreateModalOpen = true;
        this.createForm.reset();
    }

    closeCreateModal(): void {
        this.isCreateModalOpen = false;
        this.createForm.reset();
    }

    saveNewRecord(): void {
        if (this.createForm.invalid) {
            alert('Please fill all required fields.');
            return;
        }

        const recordData: CreateRecordDTO = this.createForm.value;

        const sub = this.recordService.createRecord(recordData).subscribe({
            next: (response) => {
                alert('Record created successfully!');
                this.closeCreateModal();
                
                // Refresh data
                this.loadVins();
                if (this.selectedVin === recordData.vin) {
                    this.onVinSelect();
                }
            },
            error: (err) => {
                console.error('Error creating record:', err);
                alert('Failed to create record.');
            }
        });
        this.subscriptions.add(sub);
    }

    ngOnDestroy(): void {
        this.subscriptions.unsubscribe();
    }
}