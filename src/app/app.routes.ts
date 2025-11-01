import { Routes } from '@angular/router';
import { VehicleComponent } from './vehicle/vehicle.component';
import { ImportExportComponent } from './import-export/import-export';
import { RecordComponent } from './record/record.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'vehicles',
    pathMatch: 'full'
  },
  {
    path: 'vehicles',
    component: VehicleComponent
  },
  {
    path: 'import-export',
    component: ImportExportComponent
  },
  {
    path: 'report',
    component: RecordComponent
  },
  {
    path: '**',
    redirectTo: 'vehicles'
  },

];
