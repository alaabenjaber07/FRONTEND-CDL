import { Component } from '@angular/core';
import { DynamicApiService } from '../../services/dynamic-api.service';
import { ColumnDefinition, TableDefinition } from '../../models/dynamic.model';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
    selector: 'app-schema-manager',
    templateUrl: './schema-manager.component.html',
    styleUrls: ['./schema-manager.component.css']
})
export class SchemaManagerComponent {
    tableName: string = 'CDL_NOUVELLE_TABLE';
    columns: ColumnDefinition[] = [
        { name: 'ID', type: 'NUMBER', primaryKey: true },
        { name: 'NOM_VALEUR', type: 'VARCHAR2(255)', primaryKey: false }
    ];

    typeOptions = ['NUMBER', 'VARCHAR2(255)', 'VARCHAR2(500)', 'DATE', 'TIMESTAMP'];

    constructor(private api: DynamicApiService, private snackBar: MatSnackBar, private router: Router) { }

    addColumn() {
        this.columns.push({ name: '', type: 'VARCHAR2(255)', primaryKey: false });
    }

    removeColumn(index: number) {
        if (this.columns.length > 1) {
            this.columns.splice(index, 1);
        }
    }

    createTable() {
        if (!this.tableName || this.tableName.length < 5) {
            this.snackBar.open('Le nom de table est invalide', 'Ok', { duration: 3000 });
            return;
        }

        let hasPk = this.columns.some(c => c.primaryKey);
        if (!hasPk) {
            this.snackBar.open('Au moins une clé primaire est requise', 'Ok', { duration: 3000 });
            return;
        }

        const tableDef: TableDefinition = {
            tableName: this.tableName,
            columns: this.columns
        };

        this.api.createTable(tableDef).subscribe({
            next: (res) => {
                this.snackBar.open('Table dynamique créée et provisionnée avec succès !', 'Fermer', { duration: 3000, panelClass: ['success-snackbar'] });
                setTimeout(() => {
                    this.router.navigate(['/dashboard']);
                }, 1500);
            },
            error: (err) => {
                this.snackBar.open('Erreur Oracle: ' + (err.error || err.message), 'Fermer', { duration: 5000 });
            }
        });
    }
}
