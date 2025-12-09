import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CorporateService } from '../services/corporate.service';
import { CourseService } from '../services/course.service';

@Component({
  selector: 'app-assign-course',
  templateUrl: './assign-course.component.html',
  styleUrls: ['./assign-course.component.css']
})
export class AssignCourseComponent implements OnInit {
  assignment = {
    courseId: '',
    deadline: '',
    applicableTo: 'all',
    departments: [] as string[],
    specificEmployees: [] as string[]
  };

  courses: any[] = [];
  employees: any[] = [];
  departments: string[] = [];

  selectedDepartments: { [key: string]: boolean } = {};
  selectedEmployees: { [key: string]: boolean } = {};

  // Search filters
  departmentSearchTerm: string = '';
  employeeSearchTerm: string = '';

  loading: boolean = false;
  successMessage: string = '';
  errorMessage: string = '';

  constructor(
    private corporateService: CorporateService,
    private courseService: CourseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCourses();
    this.loadDashboardData();
  }

  loadCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (response) => {
        if (response.success) {
          this.courses = response.data;
        }
      },
      error: (error) => {
        console.error('Error loading courses:', error);
      }
    });
  }

  loadDashboardData(): void {
    this.corporateService.getCompanyDashboard().subscribe({
      next: (response) => {
        if (response.success) {
          this.employees = response.data.employeeProgress;

          // Extract unique departments
          const deptSet = new Set<string>();
          this.employees.forEach(emp => {
            if (emp.department) {
              deptSet.add(emp.department);
            }
          });
          this.departments = Array.from(deptSet).sort();
        }
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
      }
    });
  }

  onSubmit(): void {
    if (!this.assignment.courseId) {
      this.errorMessage = 'Please select a course';
      return;
    }

    // Prepare departments array
    if (this.assignment.applicableTo === 'department') {
      this.assignment.departments = Object.keys(this.selectedDepartments)
        .filter(dept => this.selectedDepartments[dept]);

      if (this.assignment.departments.length === 0) {
        this.errorMessage = 'Please select at least one department';
        return;
      }
    }

    // Prepare specific employees array
    if (this.assignment.applicableTo === 'specific') {
      this.assignment.specificEmployees = Object.keys(this.selectedEmployees)
        .filter(empId => this.selectedEmployees[empId]);

      if (this.assignment.specificEmployees.length === 0) {
        this.errorMessage = 'Please select at least one employee';
        return;
      }
    }

    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const payload: any = {
      courseId: this.assignment.courseId,
      applicableTo: this.assignment.applicableTo
    };

    if (this.assignment.deadline) {
      payload.deadline = this.assignment.deadline;
    }

    if (this.assignment.applicableTo === 'department') {
      payload.departments = this.assignment.departments;
    }

    if (this.assignment.applicableTo === 'specific') {
      payload.specificEmployees = this.assignment.specificEmployees;
    }

    this.corporateService.assignCourse(payload).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Course assigned successfully!';
          this.loading = false;

          // Redirect after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/corporate-dashboard']);
          }, 2000);
        }
      },
      error: (error) => {
        console.error('Error assigning course:', error);
        this.errorMessage = error.error?.message || 'Failed to assign course. Please try again.';
        this.loading = false;
      }
    });
  }

  resetForm(): void {
    this.assignment = {
      courseId: '',
      deadline: '',
      applicableTo: 'all',
      departments: [],
      specificEmployees: []
    };
    this.selectedDepartments = {};
    this.selectedEmployees = {};
    this.successMessage = '';
    this.errorMessage = '';
  }

  goBack(): void {
    this.router.navigate(['/corporate-dashboard']);
  }

  // Filter departments by search term
  get filteredDepartments(): string[] {
    if (!this.departmentSearchTerm) {
      return this.departments;
    }
    return this.departments.filter(dept =>
      dept.toLowerCase().includes(this.departmentSearchTerm.toLowerCase())
    );
  }

  // Filter employees by search term (searches by employee ID and name)
  get filteredEmployees(): any[] {
    if (!this.employeeSearchTerm) {
      return this.employees;
    }
    const searchLower = this.employeeSearchTerm.toLowerCase();
    return this.employees.filter(emp =>
      emp.employeeId?.toLowerCase().includes(searchLower) ||
      emp.name?.toLowerCase().includes(searchLower)
    );
  }
}
