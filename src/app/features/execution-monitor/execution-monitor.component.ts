import { Component, OnInit, OnDestroy } from '@angular/core';
import { QueryExecutorService } from '../../services/query-executor.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
    selector: 'app-execution-monitor',
    templateUrl: './execution-monitor.component.html',
    styleUrls: ['./execution-monitor.component.css']
})
export class ExecutionMonitorComponent implements OnInit, OnDestroy {
    executionState: any;
    showCancelPrompt = false;
    cancelPassword = '';
    cancelError = false;

    isExtracting1 = false;
    extractionReady1 = false;
    extractionPercent1 = 0;
    processedRows1 = 0;

    isExtracting2 = false;
    extractionReady2 = false;
    extractionPercent2 = 0;
    processedRows2 = 0;

    private pollInterval: any;
    private extractInterval1: any;
    private extractInterval2: any;

    constructor(
        private queryService: QueryExecutorService,
        private snackBar: MatSnackBar,
        private router: Router
    ) { }

    ngOnInit() {
        this.startPolling();
    }

    ngOnDestroy() {
        this.stopPolling();
        if (this.extractInterval1) clearInterval(this.extractInterval1);
        if (this.extractInterval2) clearInterval(this.extractInterval2);
    }

    startPolling() {
        this.pollStatus();
        this.pollInterval = setInterval(() => {
            this.pollStatus();
        }, 2000);
    }

    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
        }
    }

    pollStatus() {
        const configName = localStorage.getItem('currentConfigName') || 'default_process';
        this.queryService.getProgress(configName).subscribe({
            next: (res: any) => {
                this.executionState = res;
                this.executionState.configName = configName; // Displayed in HTML
                if (!res.isExecuting && res.progress === 100) {
                    this.stopPolling();
                }
            },
            error: (err) => console.error('Erreur getProgress', err)
        });
    }

    goBack() {
        this.router.navigate(['/dashboard']);
    }

    promptCancel() {
        this.showCancelPrompt = true;
        this.cancelPassword = '';
        this.cancelError = false;
    }

    confirmCancel() {
        if (this.cancelPassword === 'ADMINCDL') { // Basic check as per requirements
            const configName = localStorage.getItem('currentConfigName') || 'default_process';
            this.queryService.cancelExecution(configName).subscribe({
                next: () => {
                    this.snackBar.open('Annulation envoyée au serveur', 'Fermer', { duration: 3000 });
                    this.showCancelPrompt = false;
                },
                error: () => {
                    this.snackBar.open('Erreur lors de l\'annulation', 'Fermer', { duration: 3000 });
                }
            });
        } else {
            this.cancelError = true;
        }
    }

    extractExcel(index: number) {
        const configName = localStorage.getItem('currentConfigName') || 'default_process';

        if (index === 1) {
            this.isExtracting1 = true;
            this.extractionReady1 = false;
        } else {
            this.isExtracting2 = true;
            this.extractionReady2 = false;
        }

        this.queryService.startExtraction(configName, index).subscribe({
            next: () => {
                this.pollExtraction(configName, index);
            },
            error: (err) => {
                console.error('Erreur startExtraction', err);
                this.snackBar.open('Échec du démarrage de l\'extraction', 'Fermer', { duration: 3000 });
                if (index === 1) this.isExtracting1 = false;
                else this.isExtracting2 = false;
            }
        });
    }

    pollExtraction(configName: string, index: number) {
        const interval = setInterval(() => {
            this.queryService.getExtractionStatus(configName, index).subscribe({
                next: (log: any) => {
                    if (log) {
                        const pct = (log.totalRows && log.totalRows > 0) ? Math.round((log.processedRows / log.totalRows) * 100) : 0;
                        if (index === 1) {
                            this.extractionPercent1 = pct;
                            this.processedRows1 = log.processedRows;
                        } else {
                            this.extractionPercent2 = pct;
                            this.processedRows2 = log.processedRows;
                        }

                        if (log.status === 'SUCCESS') {
                            clearInterval(interval);
                            if (index === 1) {
                                this.isExtracting1 = false;
                                this.extractionReady1 = true;
                            } else {
                                this.isExtracting2 = false;
                                this.extractionReady2 = true;
                            }
                            this.downloadExtractionAuto(configName, index);
                        } else if (log.status === 'FAILED') {
                            clearInterval(interval);
                            if (index === 1) this.isExtracting1 = false;
                            else this.isExtracting2 = false;
                            this.snackBar.open('Extraction échouée', 'Fermer', { duration: 3000 });
                        }
                    }
                },
                error: (err) => {
                    console.error('Erreur getExtractionStatus', err);
                }
            });
        }, 2000);

        if (index === 1) this.extractInterval1 = interval;
        else this.extractInterval2 = interval;
    }

    cancelExtraction(index: number) {
        const configName = localStorage.getItem('currentConfigName') || 'default_process';
        this.queryService.cancelExtraction(configName, index).subscribe({
            next: () => {
                if (index === 1) {
                    clearInterval(this.extractInterval1);
                    this.isExtracting1 = false;
                } else {
                    clearInterval(this.extractInterval2);
                    this.isExtracting2 = false;
                }
                this.snackBar.open('Extraction annulée', 'Fermer', { duration: 3000 });
            }
        });
    }

    downloadExtractionAuto(configName: string, index: number) {
        this.queryService.downloadExtractionBlob(configName, index).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${configName}_ext_${index}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            },
            error: (err) => {
                this.snackBar.open('Erreur de téléchargement', 'Fermer', { duration: 3000 });
            }
        });
    }
}
