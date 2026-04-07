import { Component, OnInit } from '@angular/core';
import { DynamicApiService } from '../../services/dynamic-api.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
    tables: any[] = [];
    loading = true;

    constructor(private api: DynamicApiService, public authService: AuthService) { }

    ngOnInit(): void {
        this.api.getTables().subscribe({
            next: (data) => {
                this.tables = data;
                this.loading = false;
            },
            error: (err) => {
                console.error('Erreur chargement tables', err);
                this.loading = false;
            }
        });
    }
}
