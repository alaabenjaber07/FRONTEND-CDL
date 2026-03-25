import { Component, OnInit } from '@angular/core';
import { DynamicApiService } from '../../services/dynamic-api.service';
import { AuditLog } from '../../models/dynamic.model';

@Component({
    selector: 'app-audit-view',
    templateUrl: './audit-view.component.html',
    styleUrls: ['./audit-view.component.css']
})
export class AuditViewComponent implements OnInit {
    logs: AuditLog[] = [];
    displayedColumns: string[] = ['actionDate', 'tableName', 'actionType', 'username', 'details'];
    loading = true;

    constructor(private api: DynamicApiService) { }

    ngOnInit(): void {
        this.api.getAllLogs().subscribe({
            next: (data) => {
                this.logs = data;
                this.loading = false;
            },
            error: () => this.loading = false
        });
    }
}
