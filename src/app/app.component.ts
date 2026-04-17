import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { QueryExecutorService } from './services/query-executor.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'cdl-ajustement-frontend';
  logoError = false;
  executionState: any;

  constructor(
    public authService: AuthService,
    private router: Router,
    private queryService: QueryExecutorService
  ) {
    this.queryService.checkInitialState();
    this.queryService.executionState$.subscribe(state => {
      this.executionState = state;
    });
  }

  handleLogoError() {
    this.logoError = true;
  }

  logout() {
    this.authService.logout();
  }
}
