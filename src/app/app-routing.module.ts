import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { DynamicGridComponent } from './features/dynamic-grid/dynamic-grid.component';
import { SchemaManagerComponent } from './features/schema-manager/schema-manager.component';
import { AuditViewComponent } from './features/audit-view/audit-view.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'table/:name', component: DynamicGridComponent },
  { path: 'schema-manager', component: SchemaManagerComponent },
  { path: 'audit', component: AuditViewComponent },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
