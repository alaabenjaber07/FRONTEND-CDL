import { Component, OnInit } from '@angular/core';
import { QueryExecutorService } from '../../services/query-executor.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';

@Component({
    selector: 'app-query-config-manager',
    templateUrl: './query-config-manager.component.html',
    styleUrls: ['./query-config-manager.component.css']
})
export class QueryConfigManagerComponent implements OnInit {
    configs: any[] = [];
    loading = true;
    editingId: number | null = null;
    editModel: any = {};

    constructor(
        private queryService: QueryExecutorService,
        private snackBar: MatSnackBar,
        private location: Location
    ) { }

    ngOnInit(): void {
        this.loadConfigs();
    }

    loadConfigs() {
        this.loading = true;
        this.queryService.getAllConfigs().subscribe({
            next: (data) => {
                this.configs = data;
                this.loading = false;
            },
            error: () => {
                this.snackBar.open('Erreur de chargement des configurations', 'Ok', { duration: 3000 });
                this.loading = false;
            }
        });
    }

    startEdit(config: any) {
        this.editingId = config.id;
        this.editModel = { ...config };
    }

    cancelEdit() {
        this.editingId = null;
        this.editModel = {};
    }

    saveEdit() {
        if (this.editingId) {
            this.queryService.updateConfig(this.editingId, this.editModel).subscribe({
                next: () => {
                    this.snackBar.open('Configuration mise à jour', 'Ok', { duration: 3000 });
                    this.loadConfigs();
                    this.cancelEdit();
                },
                error: () => this.snackBar.open('Erreur de mise à jour', 'Ok', { duration: 3000 })
            });
        }
    }

    deleteConfig(id: number) {
        if (confirm('Supprimer cette configuration ?')) {
            this.queryService.deleteConfig(id).subscribe({
                next: () => {
                    this.snackBar.open('Configuration supprimée', 'Ok', { duration: 3000 });
                    this.loadConfigs();
                },
                error: () => this.snackBar.open('Erreur de suppression', 'Ok', { duration: 3000 })
            });
        }
    }

    resetToDefault() {
        if (confirm('Voulez-vous réinitialiser le processus par défaut (Simulation) ? Cela écrasera les modifications locales pour ce processus.')) {
            this.queryService.resetDefaultConfig().subscribe({
                next: () => {
                    this.snackBar.open('Processus par défaut réinitialisé', 'Ok', { duration: 3000 });
                    this.loadConfigs();
                },
                error: () => this.snackBar.open('Erreur de réinitialisation', 'Ok', { duration: 3000 })
            });
        }
    }

    goBack() {
        this.location.back();
    }
}
