import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';
import { CourseService } from '../services/course.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-dashboard',
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css']
})
export class UserDashboardComponent implements OnInit {
  // User data
  currentUser: any = null;
  userId: string | null = null;

  // Statistics
  stats = {
    totalEnrolled: 0,
    totalCompleted: 0,
    totalCertificates: 0,
    totalLearningMinutes: 0,
    recentActivity: []
  };

  // Enrolled courses with progress
  enrolledCourses: any[] = [];
  completedCourses: any[] = [];
  inProgressCourses: any[] = [];

  // Certificates
  certificates: any[] = [];

  // Loading states
  loading = true;
  statsLoading = true;
  coursesLoading = true;

  constructor(
    private userService: UserService,
    private courseService: CourseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userId = this.userService.getCurrentUserId();
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadUserData();
    this.loadStats();
    this.loadEnrolledCourses();
    this.loadCertificates();
  }

  loadUserData(): void {
    if (!this.userId) return;

    this.userService.getUserById(this.userId).subscribe({
      next: (response: any) => {
        this.currentUser = response.user || response;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load user data:', err);
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    if (!this.userId) return;

    this.userService.getUserStats(this.userId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.stats = response.data;
        }
        this.statsLoading = false;
      },
      error: (err) => {
        console.error('Failed to load stats:', err);
        this.statsLoading = false;
      }
    });
  }

  loadEnrolledCourses(): void {
    if (!this.userId) return;

    this.userService.getEnrolledCourses(this.userId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.enrolledCourses = response.data;
          this.categorizeCoursesWithProgress();
        }
        this.coursesLoading = false;
      },
      error: (err) => {
        console.error('Failed to load enrolled courses:', err);
        this.coursesLoading = false;
      }
    });
  }

  categorizeCoursesWithProgress(): void {
    if (!this.userId) return;

    this.userService.getAllCourseProgress().subscribe({
      next: (response: any) => {
        if (response.success) {
          const progressMap = new Map();
          response.data.forEach((progress: any) => {
            if (progress.courseId && progress.courseId._id) {
              progressMap.set(progress.courseId._id, progress);
            }
          });

          this.enrolledCourses.forEach(enrollment => {
            const courseId = enrollment.courseId._id || enrollment.courseId;
            const progress = progressMap.get(courseId);
            enrollment.progress = progress || { progressPercentage: 0, completed: false };
          });

          this.completedCourses = this.enrolledCourses.filter(e => e.progress?.completed);
          this.inProgressCourses = this.enrolledCourses.filter(e => !e.progress?.completed);
        }
      },
      error: (err) => console.error('Failed to load progress:', err)
    });
  }

  loadCertificates(): void {
    if (!this.userId) return;

    this.userService.getUserCertificates(this.userId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.certificates = response.data;
        }
      },
      error: (err) => console.error('Failed to load certificates:', err)
    });
  }

  downloadCertificate(courseId: string): void {
    if (!this.userId) return;

    this.userService.downloadCertificate(courseId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const cert = this.certificates.find(c => c.courseId === courseId);
        link.download = `Certificate-${cert?.courseTitle || 'Course'}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Failed to download certificate:', err);
        alert('Failed to download certificate. Please try again.');
      }
    });
  }

  goToCourse(courseId: string): void {
    this.router.navigate(['/course', courseId]);
  }

  formatLearningTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }
}
