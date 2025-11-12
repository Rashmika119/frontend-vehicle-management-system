import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { Vehicle } from '../vehicle/vehicle.model';
import { CreateRecordDTO, UpdateRecordDTO, VehicleRecord } from './record.model';
import { VehicleRecordService } from './record.service';
import { CommonModule, DatePipe } from '@angular/common';
import { VehicleService } from '../vehicle/vehicle.service';

@Component({
    selector: 'veh-record',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe],
    templateUrl: './record.html',
    styleUrls: ['./record.scss'],
})
export class RecordComponent implements OnInit, OnDestroy {
  
    searchVin: string = '';
    searchedVehicle: Vehicle | null = null;
    searchedRecords: VehicleRecord[] = [];
    searchLoading: boolean = false;
    searchPerformed: boolean = false;

    totalVinCount:number=0;
    vins: string[] = [];
    vehicleVins:string[]=[];
    selectedVin: string | null = null;
    dropdownRecords: VehicleRecord[] = [];

 
    isUpdateModalOpen: boolean = false;
    selectedRecordId: string | null = null;
    updateForm: FormGroup;

    isCreateModalOpen: boolean = false;
    createForm: FormGroup;

    private subscriptions: Subscription = new Subscription();

    constructor(
        private recordService: VehicleRecordService,
        private cdr: ChangeDetectorRef
    ) {

        this.updateForm = new FormGroup({
            category: new FormControl('', Validators.required),
            repair_date: new FormControl('', Validators.required),
            description: new FormControl('', Validators.required)
        });

        this.createForm = new FormGroup({
            vin: new FormControl('', Validators.required),
            category: new FormControl('', Validators.required),
            repair_date: new FormControl('', Validators.required),
            description: new FormControl('', Validators.required)
        });
    }

    ngOnInit(): void {
        this.loadVins();
        this.loadVehicleVins();
    }

    loadVins(): void {
        const sub = this.recordService.getAllVins().subscribe({
            next: (vins) => {
                this.vins = vins;
                console.log('VINs loaded:', this.vins);
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load VINs:', err);
                alert('Failed to load VINs.');
            }
        });
        this.subscriptions.add(sub);
    }

        loadVehicleVins(): void {
        const sub = this.recordService.getAllVehicleVins().subscribe({
            next: ({vins,totalCount}) => {
                this.vehicleVins = vins;
                this.totalVinCount = totalCount;
                console.log('Vehicle VINs loaded:', this.vehicleVins);
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Failed to load vehicle VINs:', err);
                alert('Failed to load vehicle VINs.');
            }
        });
        this.subscriptions.add(sub);
    }

    searchVehicle(): void {
        if (!this.searchVin || this.searchVin.trim() === '') {
            alert('Please enter a VIN to search.');
            return;
        }

        this.searchLoading = true;
        this.searchPerformed = false;
        this.searchedVehicle = null;
        this.searchedRecords = [];
        this.cdr.detectChanges(); 

        const sub = this.recordService.findVehicleByVin(this.searchVin.trim()).subscribe({
            next: (vehicle: Vehicle | null) => {
                console.log("vehicle value: ", vehicle);
                
                this.searchLoading = false;
                this.searchPerformed = true;

                if (vehicle) {
                    console.log('Vehicle fetched:', vehicle);
                    this.searchedVehicle = vehicle;
                    this.searchedRecords = vehicle.vehicleRecords || [];
                    console.log("searched Vehicle value: ", this.searchedVehicle);
                    console.log("searched Records: ", this.searchedRecords);
                } else {
                    this.searchedVehicle = null;
                    this.searchedRecords = [];
                    alert('No vehicle found for the given VIN.');
                }

                console.log("searchLoading: ", this.searchLoading);
                console.log("searchPerformed: ", this.searchPerformed);
                
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error searching vehicle:', err);
                alert('Error occurred while searching.');
                this.searchLoading = false;
                this.searchPerformed = true;
                this.searchedVehicle = null;
                this.searchedRecords = [];
                this.cdr.detectChanges();
            }
        });

        this.subscriptions.add(sub);
    }

    clearSearch(): void {
        this.searchVin = '';
        this.searchedVehicle = null;
        this.searchedRecords = [];
        this.searchPerformed = false;
        this.searchLoading = false;
        this.cdr.detectChanges();
    }

    onVinSelect(): void {
        if (!this.selectedVin) {
            return;
        }
        const sub = this.recordService.getRecordsByVin(this.selectedVin).subscribe({
            next: (records) => {
                this.dropdownRecords = records;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error fetching records:', err);
                alert('Failed to load records for selected VIN.');
                this.dropdownRecords = [];
                this.cdr.detectChanges();
            }
        });
        this.subscriptions.add(sub);
    }

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
        this.cdr.detectChanges();
    }

    closeUpdateModal(): void {
        this.isUpdateModalOpen = false;
        this.updateForm.reset();
        this.selectedRecordId = null;
        this.cdr.detectChanges();
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

                this.loadVins();
                if (this.selectedVin) {
                    this.onVinSelect();
                }
                if (this.searchPerformed && this.searchVin) {
                    this.searchVehicle();
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error updating record:', err);
                alert('Failed to update record.');
            }
        });
        this.subscriptions.add(sub);
    }

    deleteRecord(record: VehicleRecord): void {
        if (!record.id) return;

        const confirmed = confirm('Are you sure you want to delete this record?');
        if (!confirmed) return;

        const sub = this.recordService.deleteRecord(record.id).subscribe({
            next: (success) => {
                if (success) {
                    alert('Record deleted successfully!');

                    this.loadVins();
                    if (this.selectedVin===record.vin) {
                        this.onVinSelect();
                    }
                    if (this.searchPerformed && this.searchVin) {
                        this.searchVehicle();
                    }
                    this.loadVins();
                    this.cdr.detectChanges();
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

    openCreateModal(): void {
        this.isCreateModalOpen = true;
        this.createForm.reset();
        this.cdr.detectChanges();
    }

    closeCreateModal(): void {
        this.isCreateModalOpen = false;
        this.createForm.reset();
        this.cdr.detectChanges();
    }

    saveNewRecord(): void {
        if (this.createForm.invalid) {
            alert('Please fill all required fields.');
            return;
        }

        const recordData: CreateRecordDTO = this.createForm.value;
        console.log('Creating records for VIN: ', recordData.vin)
        const sub = this.recordService.createRecord(recordData).subscribe({
            next: (response) => {
                if(!response?.id){
                    alert('Failed to create record. No ID returned.');
                    return;
                }
                alert('Record created successfully!');
                this.closeCreateModal();

                this.loadVins();
                if (this.selectedVin === recordData.vin) {
                    this.onVinSelect();
                }
                this.loadVins();
                this.cdr.detectChanges();
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