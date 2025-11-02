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

    vinValue: string = '';
    searched: boolean = false;
    searchLoading: boolean = false;

    vins: string[] = [];
    selectedVin: string | null = null;
    allRecordsForSelectedVin: VehicleRecord[] = [];
    filteredRecords: VehicleRecord[] = [];
    isVinsLoading: boolean = true;
    loading: boolean = false;

    filterForm: FormGroup;
    recordForm: FormGroup;
    editingRecord: VehicleRecord | null = null
    showCreateModal: boolean = false;
    showUpdateModal: boolean = false;;

    // BehaviorSubject to update search result dynamically
    vehicle$: BehaviorSubject<Vehicle | null> = new BehaviorSubject<Vehicle | null>(null);

    private vinSubscription: Subscription | undefined;
    private recordsSubscription: Subscription | undefined;

    constructor(private recordService: VehicleRecordService, private cdr: ChangeDetectorRef) {

        this.filterForm = new FormGroup({
            category: new FormControl(''),
            description: new FormControl(''),
        });

        this.recordForm = new FormGroup({
            vin: new FormControl('', Validators.required),
            category: new FormControl('', Validators.required),
            repair_date: new FormControl('', Validators.required),
            description: new FormControl('', Validators.required),
        });
    }

    ngOnInit(): void {

        this.vinSubscription = this.recordService.getAllVins().subscribe({
            next: (vinsArray: string[]) => {
                this.vins = vinsArray;
                this.isVinsLoading = false;
                console.log('VINs loaded:', vinsArray);
            },
            error: (err) => {
                console.error('Error fetching VINs:', err);
                this.isVinsLoading = false;
            }
        });

        this.filterForm.valueChanges.subscribe(() => {
            this.applyFilter();
        });
    }

    ngOnDestroy(): void {
        this.vinSubscription?.unsubscribe();
        this.recordsSubscription?.unsubscribe();
    }

    // ===== SEARCH SECTION =====
    findVehicleByVin(): void {
        if (!this.vinValue.trim()) {
            alert('Please enter a VIN');
            return;
        }

        this.searched = true;
        this.searchLoading = true;
        console.log('🔍 Searching for VIN:', this.vinValue);

        this.recordService.findVehicleByVin(this.vinValue.trim()).subscribe({
            next: (vehicle) => {
                console.log('✅ Vehicle found:', vehicle);
                this.vehicle$.next(vehicle); // push to async pipe
                this.searchLoading = false;
            },
            error: (err) => {
                console.error('Error fetching vehicle:', err);
                this.vehicle$.next(null);
                this.searchLoading = false;
            },
        });
    }

    clearSearch(): void {
        this.vinValue = '';
        this.searched = false;
        this.vehicle$.next(null);
    }

    onVinSelect(): void {
        this.loading = true;
        this.recordsSubscription?.unsubscribe();

        if (this.selectedVin) {
            console.log('Loading records for VIN:', this.selectedVin);

            this.recordsSubscription = this.recordService.getRecordsByVin(this.selectedVin).subscribe({
                next: (records: VehicleRecord[]) => {
                    this.allRecordsForSelectedVin = records;
                    this.applyFilter();
                    this.loading = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error fetching records:', err);
                    this.loading = false;
                    this.cdr.detectChanges();
                }
            });
        } else {
            this.filteredRecords = [];
            this.allRecordsForSelectedVin = [];
            this.cdr.detectChanges();
        }
    }

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

        console.log('Filtered records:', this.filteredRecords.length);
    }

    openCreateModal(vin?: string): void {
        this.recordForm.reset();
        if (vin) this.recordForm.patchValue({ vin });
        else if (this.selectedVin) this.recordForm.patchValue({ vin: this.selectedVin });

        this.showCreateModal = true;
    }

    createRecord(): void {
        if (this.recordForm.invalid) {
            alert('Please fill all required fields');
            return;
        }

        const formValue = this.recordForm.value;
        const createData: CreateRecordDTO = {
            vin: formValue.vin,
            category: formValue.category,
            repair_date: formValue.repair_date,
            description: formValue.description,
        };

        console.log('Creating record:', createData);

        this.recordService.createRecord(createData).subscribe({
            next: (created) => {
                console.log('Record created:', created);
                alert('Record created successfully!');
                this.showCreateModal = false;
                this.recordForm.reset();

                if (!this.vins.includes(created.vin)) {
                    this.vins.push(created.vin);
                }

                if (this.selectedVin === created.vin) {
                    this.onVinSelect();
                }

                if (this.vinValue === created.vin) {
                    this.findVehicleByVin();
                }
            },
            error: (err) => {
                console.error('Create failed:', err);
                alert('Failed to create record: ' + (err.message || 'Unknown error'));
            }
        });
    }


    updateRecord(): void {
        if (!this.editingRecord || !this.editingRecord.id) return;

        if (this.recordForm.invalid) {
            alert('Please fill all required fields');
            return;
        }

        const formValue = this.recordForm.getRawValue();
        const updateData: UpdateRecordDTO = {
            category: formValue.category,
            repair_date: formValue.repair_date,
            description: formValue.description,
        };

        console.log('Updating record:', this.editingRecord.id, updateData);

        this.recordService.updateRecord(this.editingRecord.id, updateData).subscribe({
            next: (updated) => {
                console.log('Record updated:', updated);
                alert('Record updated successfully!');
                this.showUpdateModal = false;
                this.recordForm.reset();
                this.recordForm.get('vin')?.enable();
                this.editingRecord = null;

                if (this.selectedVin) this.onVinSelect();
                if (this.vinValue) this.findVehicleByVin();
            },
            error: (err) => {
                console.error('Update failed:', err);
                alert('Failed to update record: ' + (err.message || 'Unknown error'));
            }
        });
    }

    cancelCreate(): void {
        this.showCreateModal = false;
        this.recordForm.reset();
    }

    cancelUpdate(): void {
        this.showUpdateModal = false;
        this.recordForm.reset();
        this.recordForm.get('vin')?.enable();
        this.editingRecord = null;
    }

    openCreateFromSearch(vin: string): void {
        this.openCreateModal(vin); 
    }


    openUpdateModal(record: VehicleRecord): void {
        this.editingRecord = record;
        this.recordForm.patchValue({
            vin: record.vin,
            category: record.category,
            repair_date: record.repair_date,
            description: record.description,
        });
        this.recordForm.get('vin')?.disable();
        this.showUpdateModal = true;
    }

    deleteRecord(record: VehicleRecord): void {
        if (!record.id) return;
        if (!confirm('Are you sure you want to delete this record?')) return;

        this.recordService.deleteRecord(record.id).subscribe({
            next: () => {
                alert('Record deleted successfully!');
                if (this.selectedVin) this.onVinSelect();
                if (this.vinValue === record.vin) this.findVehicleByVin();
            },
            error: (err) => {
                console.error('Delete failed:', err);
                alert('Failed to delete record: ' + (err.message || 'Unknown error'));
            }
        });
    }

    trackById(index: number, record: VehicleRecord): any {
        return record.id;
    }

}
