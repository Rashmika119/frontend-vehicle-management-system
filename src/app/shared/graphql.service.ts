import { Injectable } from "@angular/core";
import { Apollo, gql } from 'apollo-angular';
import { map, Observable } from "rxjs";
import { Vehicle } from "../vehicle/vehicle.model";

@Injectable({
    providedIn: 'root',
})
export class VehiclesGraphqlService {
    constructor(private apollo: Apollo) { }

    getVehicles(): Observable<Vehicle[]> {
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
            })
            .valueChanges.pipe(
                map((result: any) => result?.data?.getAllVehicles || [])
            );
    }

    updateVehicle(id: string, vehicle: Vehicle): Observable<any> {
        return this.apollo.mutate({
            mutation: gql`
            mutation($id:String!,$first_name:String!,$last_name:String!,$email:String!,$car_make:String,$car_model:String!,$vin:String!,$manufactured_date:Date!){
            updateVehiclle(
            id:$id,
            updateVehicleInput:{          
            first_name:$first_name,
            last_name:$last_name,
            email:$email,
            car_make:$car_make,
            car_model:$car_model,
            vin:$vin,
            manufactured_date:$manufactured_date,
            }){
            id
            first_name
            last_name
            email
            car_make
            car_model
            vin
            manufactured_date
            }

            }
            `,
            variables: {
                id: id,
                first_name: vehicle.first_name,
                last_name: vehicle.last_name,
                email: vehicle.email,
                car_make: vehicle.car_make,
                car_model: vehicle.car_model,
                vin: vehicle.vin,
                manufactured_date: vehicle.manufactured_date
            },
        });
    }
    searchByModel(car_model: string): Observable<Vehicle[]> {
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
                search: { car_model } // wrap it in an object matching SearchVehicleInput
            }
        })
            .valueChanges
            .pipe(
                map((result: any) => result.data?.searchVehicle || []) // safe fallback
            );
    }


    deleteVehicle(id: string): Observable<any> {
        return this.apollo.mutate({
            mutation: gql`
      mutation($id: String!) {
        removeVehicle(id: $id) {
          id
        }
      }
    `,
            variables: { id }
        });
    }
}