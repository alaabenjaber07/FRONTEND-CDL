import { Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { QueryExecutorService } from '../../services/query-executor.service';
import { interval, Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { switchMap, takeWhile } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'app-query-executor',
    templateUrl: './query-executor.component.html',
    styleUrls: ['./query-executor.component.css']
})
export class QueryExecutorComponent implements OnInit, OnDestroy {
    progress = 0;
    isExecuting = false;
    isCompleted = false;
    statusMessage = 'Prêt pour le lancement';
    currentStepMessage = '';
    lastExecutedBy = '';
    lastExecutedAt: string | null = null;
    executionLogs: any[] = [];
    extractionLogs: any[] = [];

    // Dynamic Config
    configs: any[] = [];
    selectedConfigName: string = '';

    // SQL Editing
    isEditingSql = false;
    currentSql = '';
    configId: number | null = null;
    fullConfig: any = null;

    // Security
    passwordPromptVisible = false;
    inputPassword = '';
    passwordError = false;

    private progressSubscription: Subscription | undefined;

    constructor(
        private queryService: QueryExecutorService,
        private location: Location,
        public authService: AuthService,
        private snackBar: MatSnackBar,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.queryService.checkInitialState();
        this.loadConfigDetails();
        if (this.authService.isAdmin()) {
            this.loadExecutionLogs();
            this.loadExtractionLogs();
        }

        // Sync with global state
        this.queryService.executionState$.subscribe(state => {
            this.isExecuting = state.isExecuting;
            this.progress = state.progress;
            this.currentStepMessage = state.message;
            if (state.progress === 100 && !state.isExecuting) {
                this.isCompleted = true;
            }
        });
    }

    loadExecutionLogs() {
        this.queryService.getExecutionLogs().subscribe(logs => {
            this.executionLogs = logs;
        });
    }

    loadExtractionLogs() {
        this.queryService.getExtractionLogs().subscribe(logs => {
            this.extractionLogs = logs;
        });
    }

    loadConfigDetails() {
        this.queryService.getAllConfigs().subscribe(configs => {
            this.configs = configs;
            if (configs.length > 0) {
                // If not already active, select the first one
                if (!this.selectedConfigName) {
                    this.selectedConfigName = configs[0].configName;
                }

                const config = configs.find(c => c.configName === this.selectedConfigName);
                if (config) {
                    this.lastExecutedBy = config.executedBy || 'Jamais';
                    this.lastExecutedAt = config.lastExecutedAt;
                    this.currentSql = config.executionQuery;
                    this.configId = config.id;
                    this.fullConfig = config;
                }
            }
        });
    }

    onConfigSelected(configName: string) {
        this.selectedConfigName = configName;
        this.loadConfigDetails();
    }

    toggleEditSql() {
        this.isEditingSql = !this.isEditingSql;
    }

    saveSql() {
        if (!this.configId || !this.fullConfig) return;

        const payload = {
            ...this.fullConfig,
            executionQuery: this.currentSql
        };

        this.queryService.updateConfig(this.configId, payload).subscribe({
            next: () => {
                this.isEditingSql = false;
                this.snackBar.open('Requête SQL mise à jour !', 'OK', { duration: 3000 });
            },
            error: (err) => {
                console.error('Save SQL error', err);
                this.snackBar.open('Erreur lors de la sauvegarde.', 'Fermer', { duration: 3000 });
            }
        });
    }

    goBack() {
        this.location.back();
    }

    ngOnDestroy(): void {
        if (this.progressSubscription) {
            this.progressSubscription.unsubscribe();
        }
    }

    startExecution() {
        if (this.isExecuting || (this.progress > 0 && this.progress < 100)) return;
        this.passwordPromptVisible = true;
        this.inputPassword = '';
        this.passwordError = false;
    }

    cancelExecution() {
        this.passwordPromptVisible = false;
    }

    confirmExecution() {
        if (this.inputPassword === 'ADMINCDL') {
            this.passwordPromptVisible = false;
            this.proceedWithExecution();
        } else {
            this.passwordError = true;
            this.snackBar.open('Mot de passe incorrect !', 'Fermer', {
                duration: 3000,
                panelClass: ['error-snackbar'],
                horizontalPosition: 'center',
                verticalPosition: 'top'
            });
        }
    }

    private proceedWithExecution() {
        const configName = this.selectedConfigName;
        this.statusMessage = 'Démarrage du traitement...';

        this.queryService.executeQuery(configName).subscribe({
            next: () => {
                this.snackBar.open('Traitement lancé avec succès !', 'Fermer', { duration: 3000 });
                this.router.navigate(['/monitoring']);
            },
            error: (err) => {
                console.error('Execution error', err);
                this.statusMessage = 'Erreur lors de l\'exécution.';
                this.isExecuting = false;
                this.snackBar.open('Échec du lancement.', 'Fermer', { duration: 3000 });
            }
        });
    }

    goToMonitoring() {
        this.router.navigate(['/monitoring']);
    }

    onExecutionComplete() {
        this.isExecuting = false;
        this.isCompleted = true;
        this.progress = 100;
        this.statusMessage = 'Exécution terminée avec succès !';
        if (this.progressSubscription) {
            this.progressSubscription.unsubscribe();
        }
        this.loadConfigDetails();
        if (this.authService.isAdmin()) {
            this.loadExecutionLogs();
            this.loadExtractionLogs();
        }
    }

    downloadHistory(id: number) {
        this.snackBar.open('Téléchargement en cours...', 'Fermer', { duration: 2000 });
        this.queryService.downloadLogByIdBlob(id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;

                // On cherche le log dans l'historique pour avoir les infos de nommage
                const log = this.extractionLogs.find(l => l.id === id);
                const filename = log ? `${log.configName}_ext_${log.extractionIndex}.csv` : `extraction_historique_${id}.csv`;

                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            },
            error: (err) => {
                console.error('Download error', err);
                this.snackBar.open('Erreur lors du téléchargement.', 'Fermer', { duration: 3000 });
            }
        });
    }

}
