import { Component, OnInit } from '@angular/core';
import { InstructorService } from '../services/instructor.service';
import { CourseService } from '../services/course.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-instructor-dashboard',
  templateUrl: './instructor-dashboard.component.html',
  styleUrls: ['./instructor-dashboard.component.css']
})
export class InstructorDashboardComponent implements OnInit {
  dashboardData: any = null;
  loading: boolean = true;
  error: string = '';

  stats = {
    totalCourses: 0,
    totalStudents: 0,
    totalEarnings: 0,
    availableBalance: 0,
    averageRating: 0
  };

  courses: any[] = [];
  recentPayments: any[] = [];

  constructor(
    private instructorService: InstructorService,
    private courseService: CourseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading = true;
    this.instructorService.getInstructorDashboard().subscribe({
      next: (response) => {
        if (response.success) {
          this.dashboardData = response.data;
          this.stats = response.data.stats;
          this.courses = response.data.courses;
          this.recentPayments = response.data.recentPayments;
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

  viewEarnings(): void {
    this.router.navigate(['/instructor-earnings']);
  }

  requestPayout(): void {
    const amount = prompt(`Enter amount to withdraw (Available: $${this.stats.availableBalance}):`);
    if (!amount) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > this.stats.availableBalance) {
      alert('Invalid amount');
      return;
    }

    this.instructorService.requestPayout(amountNum).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Payout request submitted successfully!');
          this.loadDashboard();
        }
      },
      error: (error) => {
        console.error('Error requesting payout:', error);
        alert('Failed to request payout. Please try again.');
      }
    });
  }

  createCourse(): void {
    this.router.navigate(['/add-course']);
  }

  editCourse(courseId: string): void {
    this.router.navigate(['/edit-course', courseId]);
  }

  viewCourseDetails(courseId: string): void {
    this.router.navigate(['/course-details', courseId]);
  }
}
