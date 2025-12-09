import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';  // Import UserService

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  errorMessage: string = '';  // To hold error messages for display

  constructor(private userService: UserService, private router: Router) { }

  onLogin(): void {
    // Clear any previous error messages
    this.errorMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    // Simple email format validation (can be expanded as needed)
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    if (!emailRegex.test(this.email)) {
      this.errorMessage = 'Please enter a valid email address.';
      return;
    }

    // Use the login method from UserService
    this.userService.login(this.email, this.password).subscribe({
      next: (response) => {
        console.log('Login successful', response);

        // Backend returns user data directly in the response
        const userId = response._id;
        const userRole = response.role;

        if (!userId) {
          this.errorMessage = 'Error: User ID not found!';
          return;
        }

        // Store complete user data in localStorage
        localStorage.setItem('user', JSON.stringify(response));
        localStorage.setItem('token', response.token || 'dummy-token');

        // Also save user session using the service
        this.userService.saveUserSession(userId);

        console.log('User logged in:', { userId, role: userRole });

        // Redirect user based on role
        if (userRole === 'admin') {
          console.log('Redirecting to admin dashboard...');
          this.router.navigate(['/admin-main']);
        } else {
          console.log('Redirecting to user courses page...');
          this.router.navigate(['/main']);
        }

        // Clear the form fields after successful login
        this.email = '';
        this.password = '';
      },
      error: (error) => {
        console.error('Login failed', error);
        this.errorMessage = 'Invalid email or password!';
      }
    });
  }
}
