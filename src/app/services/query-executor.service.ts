import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, interval, Subscription } from 'rxjs';
import { switchMap, tap, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class QueryExecutorService {
    private apiUrl = `${environment.apiUrl}/queries`;

    private executionState = new BehaviorSubject<any>({
        isExecuting: false,
        progress: 0,
        message: '',
        configName: null,
        count: 0,
        total: 440
    });

    public executionState$ = this.executionState.asObservable();
    private pollingSubscription: Subscription | undefined;

    constructor(private http: HttpClient) {
        this.checkInitialState();
    }

    public checkInitialState() {
        this.getAllConfigs().subscribe(configs => {
            // Check each config to see if it's currently running
            for (const config of configs) {
                this.getProgress(config.configName).subscribe(res => {
                    if (res.progress > 0 && res.progress < 100) {
                        this.updateState({
                            isExecuting: true,
                            progress: res.progress,
                            message: res.message,
                            count: res.count,
                            total: res.total,
                            configName: config.configName
                        });
                        this.startPolling(config.configName);
                    } else if (res.status === 'SUCCESS') {
                        this.updateState({
                            isExecuting: false,
                            progress: 100,
                            message: res.message,
                            count: res.total,
                            total: res.total,
                            configName: config.configName
                        });
                    }
                });
            }
        });
    }

    executeQuery(configName: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/execute/${configName}`, {}).pipe(
            tap(() => {
                this.updateState({ isExecuting: true, configName, progress: 0, message: 'Initialisation...' });
                this.startPolling(configName);
            })
        );
    }

    getProgress(configName: string = 'default_process'): Observable<any> {
        const params = new HttpParams().set('configName', configName);
        return this.http.get(`${this.apiUrl}/progress`, { params });
    }

    startPolling(configName: string) {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
        }

        this.pollingSubscription = interval(2000).pipe(
            switchMap(() => this.getProgress(configName))
        ).subscribe({
            next: (res) => {
                const isStillExecuting = res.progress > 0 && res.progress < 100 && res.status !== 'CANCELLED';
                this.updateState({
                    isExecuting: isStillExecuting,
                    progress: res.progress,
                    message: res.message,
                    count: res.count,
                    total: res.total,
                    configName: configName
                });

                if (!isStillExecuting) {
                    this.stopPolling();
                }
            },
            error: (err) => {
                console.error('Polling error', err);
            }
        });
    }

    cancelExecution(configName: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/cancel/${configName}`, {}).pipe(
            tap(() => this.resetState())
        );
    }

    cancelExecutionSecure(configName: string, password: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/cancel-secure/${configName}`, { password }).pipe(
            tap(() => this.resetState())
        );
    }

    stopPolling() {
        if (this.pollingSubscription) {
            this.pollingSubscription.unsubscribe();
            this.pollingSubscription = undefined;
        }
    }

    updateState(newState: any) {
        this.executionState.next({
            ...this.executionState.value,
            ...newState
        });
    }

    resetState() {
        this.stopPolling();
        this.executionState.next({
            isExecuting: false,
            progress: 0,
            message: '',
            configName: null,
            count: 0,
            total: 440
        });
    }

    startExtraction(configName: string, index: number = 1): Observable<void> {
        return this.http.post<void>(`${this.apiUrl}/start-extraction/${configName}/${index}`, {});
    }

    getExtractionStatus(configName: string, index: number = 1): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/extraction-status/${configName}/${index}`);
    }

    cancelExtraction(configName: string, index: number = 1): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/cancel-extraction/${configName}/${index}`, {});
    }

    downloadExtractionBlob(configName: string, index: number = 1): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/download-extraction/${configName}/${index}`, {
            responseType: 'blob'
        });
    }

    getExtractionDownloadUrl(configName: string, index: number = 1): string {
        return `${this.apiUrl}/download-extraction/${configName}/${index}`;
    }

    getAllConfigs(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/configs`);
    }

    createConfig(config: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/configs`, config);
    }

    updateConfig(id: number, config: any): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/configs/${id}`, config);
    }

    deleteConfig(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/configs/${id}`);
    }

    getExecutionLogs(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/logs`);
    }

    getExtractionLogs(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/extraction-logs`);
    }

    resetDefaultConfig(): Observable<any> {
        return this.http.post(`${this.apiUrl}/reset-default`, {});
    }

    downloadLogByIdBlob(id: number): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/download-log/${id}`, {
            responseType: 'blob'
        });
    }
}
