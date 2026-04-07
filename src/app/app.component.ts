import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Ajustement CDL';
  logoError = false;

  constructor(public authService: AuthService) { }

  handleLogoError() {
    this.logoError = true;
  }

  logout() {
    this.authService.logout();
  }
}
