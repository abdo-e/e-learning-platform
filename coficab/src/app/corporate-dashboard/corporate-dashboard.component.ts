import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CorporateService } from '../services/corporate.service';
import { CourseService } from '../services/course.service';

@Component({
  selector: 'app-corporate-dashboard',
  templateUrl: './corporate-dashboard.component.html',
  styleUrls: ['./corporate-dashboard.component.css']
})
export class CorporateDashboardComponent implements OnInit {
  dashboardData: any = null;
  loading: boolean = true;
  error: string = '';

  company: any = null;
  employees: any[] = [];
  mandatoryCourses: any[] = [];

  stats = {
    totalEmployees: 0,
    activeEmployees: 0,
    totalCoursesCompleted: 0,
    averageCompletionRate: 0
  };

  constructor(
    private corporateService: CorporateService,
    private courseService: CourseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.corporateService.getCompanyDashboard().subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboardData = response.data;
          this.company = response.data.company;
          this.employees = response.data.employeeProgress;
          this.mandatoryCourses = response.data.mandatoryCourses;
          this.stats = response.data.company.stats;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard:', error);
        this.error = 'Failed to load dashboard. Please try again.';
        this.loading = false;
      }
    });
  }

  addEmployee(): void {
    this.router.navigate(['/add-employee']);
  }

  assignCourse(): void {
    this.router.navigate(['/assign-course']);
  }

  downloadReport(format: 'pdf' | 'csv'): void {
    this.corporateService.downloadComplianceReport(format);
  }

  viewEmployeeProgress(employeeId: string): void {
    // Navigate to detailed employee progress view
    alert(`View progress for employee: ${employeeId}`);
  }
}
