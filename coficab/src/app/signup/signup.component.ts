import { Component } from '@angular/core';
import { NgForm } from '@angular/forms'; // Import NgForm for form validation
import { Router } from '@angular/router'; // Import Router for navigation
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent {
  user: User = new User('', '', ''); // Initialize User with default values
  message: string = '';

  constructor(private userService: UserService, private router: Router) {}

  // Handle form submission
  signup(signupForm: NgForm): void {
    if (signupForm.invalid) {
      this.message = 'Please fill out all fields correctly.';
      return;
    }

    // Call the signup method from UserService
    this.userService.signup(this.user).subscribe(
      (response) => {
        this.message = 'Account created successfully!';
        console.log('Signup successful:', response);
        this.router.navigate(['/login']); // Redirect to login page after successful signup
      },
      (error) => {
        this.message = 'Failed to create account. Please try again.';
        console.error('Signup error:', error);
      }
    );
  }
}