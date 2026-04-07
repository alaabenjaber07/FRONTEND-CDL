import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private baseUrl = environment.apiUrl + '/auth';
    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) {
        const savedToken = localStorage.getItem('token');
        const savedRole = localStorage.getItem('role');
        const savedUsername = localStorage.getItem('username');
        if (savedToken && savedRole) {
            this.currentUserSubject.next({ token: savedToken, role: savedRole, username: savedUsername });
        }
    }

    login(credentials: { username: string, password: string }): Observable<any> {
        return this.http.post(`${this.baseUrl}/login`, credentials).pipe(
            tap((res: any) => {
                localStorage.setItem('token', res.token);
                localStorage.setItem('role', res.role);
                localStorage.setItem('username', res.username);
                this.currentUserSubject.next(res);
            })
        );
    }

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username');
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    getRole(): string | null {
        return localStorage.getItem('role');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
    }

    isAdmin(): boolean {
        return this.getRole() === 'ADMIN';
    }

    getCurrentUser() {
        return this.currentUserSubject.value;
    }
}
