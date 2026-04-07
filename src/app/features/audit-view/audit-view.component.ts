import { Component, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { DynamicApiService } from '../../services/dynamic-api.service';
import { AuditLog } from '../../models/dynamic.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
    selector: 'app-audit-view',
    templateUrl: './audit-view.component.html',
    styleUrls: ['./audit-view.component.css']
})
export class AuditViewComponent implements OnInit {
    dataSource = new MatTableDataSource<AuditLog>();
    displayedColumns: string[] = ['actionDate', 'tableName', 'actionType', 'username', 'details', 'revert'];
    loading = true;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(private api: DynamicApiService, private snackBar: MatSnackBar, private location: Location) { }

    goBack(): void {
        this.location.back();
    }

    ngOnInit(): void {
        this.api.getAllLogs().subscribe({
            next: (data) => {
                this.dataSource.data = data;
                this.dataSource.paginator = this.paginator;
                this.dataSource.sort = this.sort;
                this.loading = false;
            },
            error: () => {
                this.loading = false;
                this.snackBar.open("Erreur lors de la récupération des logs côté backend", "Fermer", { duration: 3000 });
            }
        });
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    revertAction(id: number) {
        // Bouton temporairement désactivé via le template HTML tel que demandé dans la tâche
    }
}
