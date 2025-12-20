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
  user: any = {
    name: '',
    email: '',
    password: '',
    role: 'user',
    companyName: '',
    industry: '',
    size: ''
  };
  isCorporate: boolean = false;
  message: string = '';
  isLoading: boolean = false;

  constructor(private userService: UserService, private router: Router) { }

  // Toggle between individual and corporate account
  toggleAccountType(type: 'individual' | 'corporate'): void {
    this.isCorporate = type === 'corporate';
    this.user.role = this.isCorporate ? 'corporate_admin' : 'user';
    this.message = '';
  }

  // Handle form submission
  signup(signupForm: NgForm): void {
    if (signupForm.invalid) {
      this.message = 'Please fill out all fields correctly.';
      return;
    }

    this.isLoading = true;

    // Call the signup method from UserService
    this.userService.signup(this.user).subscribe(
      (response) => {
        this.isLoading = false;
        this.message = 'Account created successfully!';
        console.log('Signup successful:', response);
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      (error) => {
        this.isLoading = false;
        this.message = error || 'Failed to create account. Please try again.';
        console.error('Signup error:', error);
      }
    );
  }
}