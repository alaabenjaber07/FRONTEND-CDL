import { Component, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { QueryExecutorService } from '../../services/query-executor.service';
import { interval, Subscription } from 'rxjs';
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
    totalLines = 440;
    statusMessage = 'Prêt pour le lancement';
    currentStepMessage = '';
    lastExecutedBy = '';
    lastExecutedAt: string | null = null;
    executionLogs: any[] = [];

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
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadConfigDetails();
        if (this.authService.isAdmin()) {
            this.loadExecutionLogs();
        }
    }

    loadExecutionLogs() {
        this.queryService.getExecutionLogs().subscribe(logs => {
            this.executionLogs = logs;
        });
    }

    loadConfigDetails() {
        this.queryService.getAllConfigs().subscribe(configs => {
            const config = configs.find(c => c.configName === 'default_process');
            if (config) {
                this.lastExecutedBy = config.executedBy || 'Jamais';
                this.lastExecutedAt = config.lastExecutedAt;
                this.currentSql = config.executionQuery;
                this.configId = config.id;
                this.fullConfig = config;
            }
        });
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
        const configName = 'default_process';
        this.isExecuting = true;
        this.isCompleted = false;
        this.progress = 0;
        this.statusMessage = 'Exécution en cours...';

        this.queryService.executeQuery(configName).subscribe({
            next: () => {
                this.trackProgress();
            },
            error: (err) => {
                console.error('Execution error', err);
                this.statusMessage = 'Erreur lors de l\'exécution.';
                this.isExecuting = false;
            }
        });
    }

    trackProgress() {
        this.progressSubscription = interval(1500).pipe(
            switchMap(() => this.queryService.getProgress()),
            takeWhile(res => (res.count ?? 0) < (res.total ?? this.totalLines), true)
        ).subscribe({
            next: (res) => {
                const total = res.total ?? this.totalLines; // backend sends total=440
                const count = res.count ?? 0;

                // Prefer backend progress if present, fallback to local calculation
                this.progress = Math.min(
                    Math.round(res.progress ?? ((count / total) * 100)),
                    100
                );

                if (res.message && res.message !== 'NULL' && res.message !== 'Initialisation...') {
                    this.currentStepMessage = res.message;
                }

                if (count >= total) {
                    this.onExecutionComplete();
                }
            },
            error: (err) => {
                console.error('Progress error', err);
            }
        });
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
        }
    }

    extractExcel() {
        const configName = 'default_process';
        this.queryService.extractExcel(configName).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${configName}_extraction.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            },
            error: (err) => {
                console.error('Extraction error', err);
            }
        });
    }
}
