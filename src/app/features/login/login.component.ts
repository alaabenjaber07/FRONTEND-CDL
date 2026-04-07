import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent {
    credentials = { username: '', password: '' };
    error = '';
    logoError = false;

    constructor(private authService: AuthService, private router: Router) { }

    handleLogoError() {
        this.logoError = true;
    }

    login() {
        this.authService.login(this.credentials).subscribe({
            next: () => {
                this.router.navigate(['/']);
            },
            error: () => {
                this.error = 'Identifiants ou mot de passe incorrects';
            }
        });
    }
}
