import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isLoggedIn: boolean = false;
  userName: string = '';
  userRole: string = 'user';

  constructor(
    private userService: UserService,
    public themeService: ThemeService
  ) { }

  ngOnInit(): void {
    this.checkLoginStatus();
  }

  checkLoginStatus(): void {
    const userId = this.userService.getCurrentUserId();
    this.isLoggedIn = !!userId;

    if (this.isLoggedIn) {
      const user = localStorage.getItem('user');
      if (user) {
        const userData = JSON.parse(user);
        this.userName = userData.name || 'User';
        this.userRole = userData.role || 'user';
      }
    }
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.isLoggedIn = false;
    window.location.href = '/login';
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
}
