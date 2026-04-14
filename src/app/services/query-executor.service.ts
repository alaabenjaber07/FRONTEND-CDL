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

    private checkInitialState() {
        this.getProgress('default_process').subscribe(res => {
            if (res.progress > 0 && res.progress < 100) {
                this.updateState({
                    isExecuting: true,
                    progress: res.progress,
                    message: res.message,
                    count: res.count,
                    total: res.total,
                    configName: 'default_process'
                });
                this.startPolling('default_process');
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

    extractExcel(configName: string): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/extract/${configName}`, {
            responseType: 'blob'
        });
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

    resetDefaultConfig(): Observable<any> {
        return this.http.post(`${this.apiUrl}/reset-default`, {});
    }
}
