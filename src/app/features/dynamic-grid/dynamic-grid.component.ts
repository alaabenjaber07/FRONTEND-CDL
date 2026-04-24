import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { DynamicApiService } from '../../services/dynamic-api.service';
import { ColumnDefinition } from '../../models/dynamic.model';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as XLSX from 'xlsx';

@Component({
    selector: 'app-dynamic-grid',
    templateUrl: './dynamic-grid.component.html',
    styleUrls: ['./dynamic-grid.component.css']
})
export class DynamicGridComponent implements OnInit {
    tableName: string = '';
    columns: ColumnDefinition[] = [];
    displayedColumns: string[] = [];
    dataSource = new MatTableDataSource<any>();
    loading = true;
    editingRowIndex: number = -1;
    editingRowData: any = {};
    isNewRow: boolean = false;

    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor(
        private route: ActivatedRoute,
        private api: DynamicApiService,
        private snackBar: MatSnackBar,
        private location: Location
    ) { }

    goBack(): void {
        this.location.back();
    }

    ngOnInit(): void {
        this.route.paramMap.subscribe(params => {
            this.tableName = params.get('name') || '';
            if (this.tableName) {
                this.loadTableSchema();
            }
        });
    }

    loadTableSchema() {
        this.loading = true;
        this.api.getColumns(this.tableName).subscribe({
            next: (cols) => {
                this.columns = cols;
                this.displayedColumns = cols.map(c => c.name);
                this.displayedColumns.push('actions');
                this.loadTableData();
            },
            error: () => this.showError('Erreur de chargement du schéma')
        });
    }

    loadTableData() {
        this.api.getTableData(this.tableName).subscribe({
            next: (data) => {
                this.dataSource.data = data;
                this.dataSource.paginator = this.paginator;
                this.dataSource.sort = this.sort;
                this.loading = false;
            },
            error: () => this.showError('Erreur de chargement des données')
        });
    }

    startEdit(index: number, element: any) {
        this.editingRowIndex = index;
        this.editingRowData = { ...element };
        this.isNewRow = false;
    }

    cancelEdit() {
        this.editingRowIndex = -1;
        this.editingRowData = {};
        if (this.isNewRow) {
            this.dataSource.data = this.dataSource.data.slice(1);
            this.isNewRow = false;
        }
    }

    saveEdit(index: number, oldElement: any) {
        if (this.isNewRow) {
            if (!this.editingRowData || Object.keys(this.editingRowData).length === 0) {
                this.showError('Remplir les champs');
                return;
            }
            this.api.insertRow(this.tableName, this.editingRowData).subscribe({
                next: () => {
                    this.showSuccess('Ligne créée avec succès');
                    this.loadTableData();
                    this.cancelEdit();
                },
                error: (err) => this.showError('Erreur création ' + err.message)
            });
        } else {
            const keys: any = {};
            const changes: any = {};
            let hasChanges = false;
            let hasPk = this.columns.some(c => c.primaryKey);

            this.columns.forEach(col => {
                if (col.primaryKey || !hasPk) {
                    keys[col.name] = oldElement[col.name];
                }
                if (oldElement[col.name] !== this.editingRowData[col.name]) {
                    changes[col.name] = this.editingRowData[col.name];
                    hasChanges = true;
                }
            });

            if (Object.keys(keys).length === 0) {
                this.showError('Impossible de modifier : données introuvables');
                return;
            }
            if (!hasChanges) {
                this.cancelEdit();
                return;
            }

            this.api.updateRow(this.tableName, keys, changes).subscribe({
                next: () => {
                    this.showSuccess('Ligne enregistrée');
                    this.loadTableData();
                    this.cancelEdit();
                },
                error: () => this.showError('Erreur mise à jour')
            });
        }
    }

    deleteRow(element: any) {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette ligne ?')) {
            const keys: any = {};
            let hasPk = this.columns.some(c => c.primaryKey);
            this.columns.forEach(col => {
                if (col.primaryKey || !hasPk) {
                    keys[col.name] = element[col.name];
                }
            });
            if (Object.keys(keys).length === 0) {
                this.showError('Impossible de supprimer : données introuvables');
                return;
            }
            this.api.deleteRow(this.tableName, keys).subscribe({
                next: () => {
                    this.showSuccess('Ligne supprimée');
                    this.loadTableData();
                },
                error: () => this.showError('Erreur lors de la suppression')
            });
        }
    }

    deleteAll() {
        if (confirm('ATTENTION: Voulez-vous vraiment Vider TOUTES les données de cette table ? L\'action sera tracée mais effacera tout.')) {
            this.api.deleteAll(this.tableName).subscribe({
                next: () => {
                    this.showSuccess('Table vidée.');
                    this.loadTableData();
                },
                error: () => this.showError('Erreur de suppression.')
            });
        }
    }

    importExcel(event: any) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: any) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][];

            if (rows && rows.length > 0) {
                const excelData: any[] = [];
                let startIndex = 0;

                // Vérifier si la première ligne contient des en-têtes (si la valeur matche un nom de colonne)
                if (rows[0] && rows[0].length > 0) {
                    const firstVal = String(rows[0][0]).toUpperCase();
                    if (this.columns.some(c => c.name.toUpperCase() === firstVal)) {
                        startIndex = 1; // Ignorer la ligne d'en-tête
                    }
                }

                // Mapper les colonnes du tableau vers les colonnes BDD
                for (let i = startIndex; i < rows.length; i++) {
                    const rowArray = rows[i];
                    if (!rowArray || rowArray.length === 0) continue;

                    const rowData: any = {};
                    for (let j = 0; j < Math.min(rowArray.length, this.columns.length); j++) {
                        // associer la donnée Excel [j] au nom de la colonne de la BDD [j]
                        rowData[this.columns[j].name] = rowArray[j];
                    }
                    if (Object.keys(rowData).length > 0) {
                        excelData.push(rowData);
                    }
                }

                if (excelData.length > 0) {
                    if (confirm(`Importer ${excelData.length} lignes en base pour la table Oracle ${this.tableName} ?`)) {
                        this.api.insertBulk(this.tableName, excelData).subscribe({
                            next: () => {
                                this.showSuccess('Importation Excel réussie en bulk : ' + excelData.length + ' lignes');
                                this.loadTableData();
                            },
                            error: (err) => this.showError('Erreur import Bulk: ' + err.message)
                        });
                    }
                } else {
                    this.showError('Aucune donnée valide trouvée dans le fichier Excel.');
                }
            } else {
                this.showError('Le fichier Excel est vide ou invalide.');
            }
        };
        reader.readAsArrayBuffer(file);
        event.target.value = '';
    }

    addRow() {
        this.isNewRow = true;
        this.editingRowIndex = 0;
        this.editingRowData = {};
        const newData = [{}, ...this.dataSource.data];
        this.dataSource.data = newData;
    }

    applyFilter(event: Event) {
        const filterValue = (event.target as HTMLInputElement).value;
        this.dataSource.filter = filterValue.trim().toLowerCase();
    }

    showSuccess(msg: string) {
        this.snackBar.open(msg, 'Fermer', { duration: 3000, panelClass: ['success-snackbar'] });
    }

    showError(msg: string) {
        this.snackBar.open(msg, 'Fermer', { duration: 5000, panelClass: ['error-snackbar'] });
        this.loading = false;
    }
}
