import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';  // Import UserService$
import { User } from '../models/user.model';  // Import User model
@Component({
  selector: 'app-admin-navbar',
  templateUrl: './admin-navbar.component.html',
  styleUrls: ['./admin-navbar.component.css']
})
export class AdminNavbarComponent {
  constructor(private router: Router) {}
 
  logout(): void {
    localStorage.removeItem('_id'); 
    this.router.navigate(['/login']); 
  }
}