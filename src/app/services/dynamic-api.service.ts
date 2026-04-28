import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ColumnDefinition, TableDefinition, AuditLog } from '../models/dynamic.model';

@Injectable({
    providedIn: 'root'
})
export class DynamicApiService {
    private baseUrl = environment.apiUrl;

    private tableNameMap: { [key: string]: string } = {
        'AJUST_EPS_CONTRE_GAR': 'EPS_CONTRE_GARANTIE',
        'AJUST_CDE': 'EPS_CDE',
        'CDL_NANTISSEMENT': 'NANTISSEMENT_ACTION',
        'CDL_DEPOT': 'DEPOT_AFF',
        'CDL_GAR_ETAT': 'GAR_ETAT',
        'CDL_FNG': 'GAR_FNG',
        'CDL_FNE': 'GAR_FNE',
        'CDL_GAR_BQUE': 'GAR_BQUE',
        'CDL_SOTUGAR': 'SOTUGAR',
        'AJUST_PROSOL': 'PROSOL',
        'CDL_GAR_HYP': 'GAR_HYP',
        'CDL_AJUSTEMENT': 'Ajustement Classe'
    };

    constructor(private http: HttpClient) { }

    getDisplayName(tableName: string): string {
        if (!tableName) return '';
        return this.tableNameMap[tableName.toUpperCase()] || tableName;
    }

    // Tables
    getTables(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/dynamic/tables`);
    }

    getColumns(tableName: string): Observable<ColumnDefinition[]> {
        return this.http.get<ColumnDefinition[]>(`${this.baseUrl}/dynamic/${tableName}/columns`);
    }

    getTableData(tableName: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/dynamic/${tableName}`);
    }

    insertRow(tableName: string, data: any): Observable<any> {
        return this.http.post(`${this.baseUrl}/dynamic/${tableName}`, data);
    }

    insertBulk(tableName: string, dataArray: any[]): Observable<any> {
        return this.http.post(`${this.baseUrl}/dynamic/${tableName}/bulk`, dataArray);
    }

    updateRow(tableName: string, keys: any, data: any): Observable<any> {
        return this.http.put(`${this.baseUrl}/dynamic/${tableName}`, { keys, data });
    }

    deleteRow(tableName: string, keys: any): Observable<any> {
        return this.http.delete(`${this.baseUrl}/dynamic/${tableName}`, { body: keys });
    }

    deleteAll(tableName: string): Observable<any> {
        return this.http.delete(`${this.baseUrl}/dynamic/${tableName}/all`);
    }

    // Schema
    createTable(tableDef: TableDefinition): Observable<any> {
        return this.http.post(`${this.baseUrl}/schema/create-table`, tableDef, { responseType: 'text' });
    }

    // Audit
    getAllLogs(): Observable<AuditLog[]> {
        return this.http.get<AuditLog[]>(`${this.baseUrl}/audit`);
    }

    getLogsByTable(tableName: string): Observable<AuditLog[]> {
        return this.http.get<AuditLog[]>(`${this.baseUrl}/audit/${tableName}`);
    }

    revertAction(id: number): Observable<any> {
        return this.http.post(`${this.baseUrl}/audit/revert/${id}`, {}, { responseType: 'text' });
    }
}
