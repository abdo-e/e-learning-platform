import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CorporateService } from '../services/corporate.service';

@Component({
  selector: 'app-add-employee',
  templateUrl: './add-employee.component.html',
  styleUrls: ['./add-employee.component.css']
})
export class AddEmployeeComponent {
  employee = {
    email: '',
    employeeId: '',
    department: '',
    position: ''
  };

  loading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private corporateService: CorporateService,
    private router: Router
  ) { }

  onSubmit(): void {
    if (!this.employee.email || !this.employee.employeeId) {
      this.errorMessage = 'Email and Employee ID are required';
      return;
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.corporateService.addEmployee(
      this.employee.email,
      this.employee.employeeId,
      this.employee.department || undefined,
      this.employee.position || undefined
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Employee added successfully!';
          this.loading = false;

          // Reset form after 2 seconds and redirect
          setTimeout(() => {
            this.router.navigate(['/corporate-dashboard']);
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Error adding employee:', error);
        this.errorMessage = error.error?.message || 'Failed to add employee. Please try again.';
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.employee = {
      email: '',
      employeeId: '',
      department: '',
      position: ''
    };
    this.successMessage = '';
    this.errorMessage = '';
  }

  goBack(): void {
    this.router.navigate(['/corporate-dashboard']);
  }
}
