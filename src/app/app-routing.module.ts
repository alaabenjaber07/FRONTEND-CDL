import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { DynamicGridComponent } from './features/dynamic-grid/dynamic-grid.component';
import { SchemaManagerComponent } from './features/schema-manager/schema-manager.component';
import { AuditViewComponent } from './features/audit-view/audit-view.component';
import { LoginComponent } from './features/login/login.component';
import { QueryExecutorComponent } from './features/query-executor/query-executor.component';
import { QueryConfigManagerComponent } from './features/query-config-manager/query-config-manager.component';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'table/:name', component: DynamicGridComponent, canActivate: [AuthGuard] },
  { path: 'schema-manager', component: SchemaManagerComponent, canActivate: [AuthGuard], data: { roles: ['ADMIN'] } },
  { path: 'audit', component: AuditViewComponent, canActivate: [AuthGuard], data: { roles: ['ADMIN'] } },
  { path: 'query-executor', component: QueryExecutorComponent, canActivate: [AuthGuard] },
  { path: 'query-config-manager', component: QueryConfigManagerComponent, canActivate: [AuthGuard], data: { roles: ['ADMIN'] } },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
