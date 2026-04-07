import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class QueryExecutorService {
    private apiUrl = `${environment.apiUrl}/queries`;

    constructor(private http: HttpClient) { }

    executeQuery(configName: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/execute/${configName}`, {});
    }

    getProgress(): Observable<any> {
        return this.http.get(`${this.apiUrl}/progress`);
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
