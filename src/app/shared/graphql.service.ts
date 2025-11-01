import { Injectable } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from 'rxjs';
import { Vehicle } from '../vehicle/vehicle.model';
import { CreateRecordDTO, UpdateRecordDTO, VehicleRecord } from '../record/record.model';

@Injectable({
    providedIn: 'root',
})
export class VehiclesGraphqlService {
    constructor(private apollo: Apollo) { }

    // Get all vehicles
    getVehicles(): Observable<Vehicle[]> {
        console.log('GraphQL: Fetching all vehicles...');
        return this.apollo
            .watchQuery({
                query: gql`
                    query {
                        getAllVehicles {
                            id
                            first_name
                            last_name
                            email
                            car_make
                            car_model
                            vin
                            manufactured_date
                            age_of_the_vehicle
                        }
                    }
                `,
                fetchPolicy: 'network-only'
            })
            .valueChanges.pipe(
                map((result: any) => {
                    console.log('GraphQL: Vehicles fetched:', result?.data?.getAllVehicles?.length || 0);
                    return result?.data?.getAllVehicles || [];
                })
            );
    }

    // Update vehicle
    updateVehicle(id: string, vehicle: Vehicle): Observable<any> {
        console.log('GraphQL: Updating vehicle:', id, vehicle);

        const formatDate = (date: string | Date): string => {
            if (date instanceof Date) {
                return date.toISOString().split('T')[0];
            }
            if (typeof date === 'string') {
                return date.includes('T') ? date.split('T')[0] : date;
            }
            return String(date);
        };

        const manufacturedDate = formatDate(vehicle.manufactured_date);

        return this.apollo.mutate({
            mutation: gql`
                mutation UpdateVehicle(
                    $id: String!
                    $first_name: String!
                    $last_name: String!
                    $email: String!
                    $car_make: String
                    $car_model: String!
                    $vin: String!
                    $manufactured_date: DateTime!
                ) {
                    updateVehiclle(
                        id: $id
                        vehicle: {
                            first_name: $first_name
                            last_name: $last_name
                            email: $email
                            car_make: $car_make
                            car_model: $car_model
                            vin: $vin
                            manufactured_date: $manufactured_date
                        }
                    ) {
                        id
                        first_name
                        last_name
                        email
                        car_make
                        car_model
                        vin
                        manufactured_date
                        age_of_the_vehicle
                    }
                }
            `,
            variables: {
                id,
                first_name: vehicle.first_name,
                last_name: vehicle.last_name,
                email: vehicle.email,
                car_make: vehicle.car_make,
                car_model: vehicle.car_model,
                vin: vehicle.vin,
                manufactured_date: manufacturedDate
            },
        }).pipe(
            map((result: any) => {
                console.log('GraphQL: Update successful', result);
                if (result.errors) {
                    throw new Error(result.errors[0].message);
                }
                return result.data?.updateVehiclle;
            })
        );
    }

    // Search by model
    searchByModel(car_model: string): Observable<Vehicle[]> {
        console.log('GraphQL: Searching by model:', car_model);
        return this.apollo.watchQuery({
            query: gql`
                query($search: SearchVehicleInput!) {
                    searchVehicle(search: $search) {
                        id
                        first_name
                        last_name
                        email
                        car_make
                        car_model
                        vin
                        manufactured_date
                        age_of_the_vehicle
                    }
                }
            `,
            variables: {
                search: { car_model }
            },
            fetchPolicy: 'network-only'
        })
            .valueChanges
            .pipe(
                map((result: any) => {
                    console.log('GraphQL: Search results:', result.data?.searchVehicle?.length || 0);
                    return result.data?.searchVehicle || [];
                })
            );
    }

    // Delete vehicle
    deleteVehicle(id: string): Observable<boolean> {
        console.log('GraphQL: Deleting vehicle:', id);
        return this.apollo.mutate({
            mutation: gql`
                mutation DeleteVehicle($id: String!) {
                    removeVehicle(id: $id)
                }
            `,
            variables: { id }
        }).pipe(
            map((result: any) => {
                console.log('GraphQL: Delete successful');
                return result.data?.removeVehicle ?? true;
            })
        );
    }

    // Find vehicle by VIN with records
    findVehicleByVin(vin: string): Observable<Vehicle | null> {
        console.log('GraphQL: Searching vehicle by VIN:', vin);
        return this.apollo
            .watchQuery<{ findVehicleByVin: Vehicle | null }>({
                query: gql`
                    query FindVehicleByVin($vin: String!) {
                        findVehicleByVin(vin: $vin) {
                            id
                            vin
                            first_name
                            last_name
                            email
                            car_make
                            car_model
                            manufactured_date
                            age_of_the_vehicle
                            vehicleRecords {
                                id
                                vin
                                category
                                repair_date
                                description
                            }
                        }
                    }
                `,
                variables: { vin },
                fetchPolicy: 'network-only'
            })
            .valueChanges.pipe(
                map((result: any) => {
                    console.log('📊 GraphQL: Vehicle data:', result?.data?.findVehicleByVin);
                    return result?.data?.findVehicleByVin || null;
                })
            );
    }

    // Get records by VIN
    getRecordByVin(vin: string): Observable<VehicleRecord[]> {
        console.log('GraphQL: Fetching records for VIN:', vin);
        return this.apollo
            .watchQuery<{ findVehicleByVin: Vehicle | null }>({
                query: gql`
                    query FindVehicleByVin($vin: String!) {
                        findVehicleByVin(vin: $vin) {
                            vehicleRecords {
                                id
                                vin
                                category
                                repair_date
                                description
                            }
                        }
                    }
                `,
                variables: { vin },
                fetchPolicy: 'network-only'
            })
            .valueChanges.pipe(
                map((result: any) => {
                    const records = result?.data?.findVehicleByVin?.vehicleRecords || [];
                    console.log('GraphQL: Records fetched:', records.length);
                    return records;
                })
            );
    }

    // Get all unique VINs
    getAllUniqueVins(): Observable<string[]> {
        console.log('GraphQL: Fetching all unique VINs...');
        return this.apollo
            .watchQuery<{ getAllVehicleRecords: Array<{ vin: string }> }>({
                query: gql`
                    query {
                        getAllVehicleRecords {
                            vin
                        }
                    }
                `,
                fetchPolicy: 'network-only'
            })
            .valueChanges.pipe(
                map((result: any) => {
                    const records = result?.data?.getAllVehicleRecords || [];
                    const allVins: string[] = records
                        .map((r: any) => r?.vin)
                        .filter((vin: any): vin is string => !!vin);
                    const uniqueVins = Array.from(new Set(allVins));
                    console.log('Unique VINs fetched:', uniqueVins);
                    return uniqueVins;
                })
            );
    }

    // Create vehicle record
    createVehicleRecord(recordData: CreateRecordDTO): Observable<VehicleRecord> {
        console.log('GraphQL: Creating record:', recordData);
        return this.apollo
            .mutate<{ createVehicleRecord: VehicleRecord }>({
                mutation: gql`
                    mutation CreateVehicleRecord($vehicleRecordInput: VehicleRecordCreateDTO!) {
                        createVehicleRecord(vehicleRecordInput: $vehicleRecordInput) {
                            id
                            vin
                            category
                            repair_date
                            description
                        }
                    }
                `,
                variables: { vehicleRecordInput: recordData },
            })
            .pipe(
                map((res: any) => {
                    console.log('Record created:', res.data?.createVehicleRecord);
                    return res.data?.createVehicleRecord;
                })
            );
    }

    // Update vehicle record
    updateVehicleRecord(id: string, updateData: UpdateRecordDTO): Observable<VehicleRecord> {
        console.log('GraphQL: Updating record:', id, updateData);
        return this.apollo
            .mutate<{ updateVehicleRecord: VehicleRecord }>({
                mutation: gql`
                    mutation UpdateVehicleRecord($id: String!, $vehicleRecordInput: VehicleRecordUpdateDTO!) {
                        updateVehicleRecord(id: $id, vehicleRecordUpdateDTO: $vehicleRecordInput) {
                            id
                            vin
                            category
                            repair_date
                            description
                        }
                    }
                `,
                variables: { id, vehicleRecordInput: updateData },
            })
            .pipe(
                map((res: any) => {
                    console.log('Record updated:', res.data?.updateVehicleRecord);
                    return res.data?.updateVehicleRecord;
                })
            );
    }

    // Delete vehicle record
    deleteVehicleRecord(id: string): Observable<boolean> {
        console.log('GraphQL: Deleting record:', id);
        return this.apollo
            .mutate<{ removeVehicleRecord: boolean }>({
                mutation: gql`
                    mutation RemoveVehicleRecord($id: String!) {
                        removeVehicleRecord(id: $id)
                    }
                `,
                variables: { id },
            })
            .pipe(
                map((res: any) => {
                    console.log('Record deleted:', res.data?.removeVehicleRecord);
                    return res.data?.removeVehicleRecord ?? true;
                })
            );
    }
}