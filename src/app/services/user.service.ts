import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AppUser {
    id?: number;
    username: string;
    password?: string;
    role: string;
    matricule?: string;
    nom?: string;
    prenom?: string;
    email?: string;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = environment.apiUrl + '/admin/users';

    constructor(private http: HttpClient) { }

    getAllUsers(): Observable<AppUser[]> {
        return this.http.get<AppUser[]>(this.apiUrl);
    }

    createUser(user: AppUser): Observable<AppUser> {
        return this.http.post<AppUser>(`${this.apiUrl}/create`, user);
    }

    updateUser(id: number, user: AppUser): Observable<AppUser> {
        return this.http.put<AppUser>(`${this.apiUrl}/${id}`, user);
    }

    deleteUser(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}
