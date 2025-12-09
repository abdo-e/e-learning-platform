import { Component, OnInit } from '@angular/core';
import { CourseService } from '../services/course.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-admin-main',
  templateUrl: './admin-main.component.html',
  styleUrls: ['./admin-main.component.css']
})
export class AdminMainComponent implements OnInit {
  totalUsers: number = 0;
  totalCourses: number = 0;

  // Data for Users Chart
  monthlyUserData: number[] = [];

  // Data for Courses Chart
  monthlyCourseData: number[] = [];

  // Month labels for both charts
  months: string[] = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  constructor(
    private userService: UserService,
    private courseService: CourseService
  ) { }

  ngOnInit(): void {
    // Get total counts
    this.userService.countUsers().subscribe(count => {
      this.totalUsers = count;
    });
    this.courseService.countCourses().subscribe(count => {
      this.totalCourses = count;
    });

    // Process user data for monthly users chart
    this.userService.getUsers().subscribe(users => {
      // Handle both array and object responses
      const userArray = Array.isArray(users) ? users : (users as any).data || [];
      this.processUserData(userArray);
    });

    // Process course data for monthly courses chart
    this.courseService.getCourses().subscribe(response => {
      // Extract courses array from response
      const courses = Array.isArray(response) ? response : (response as any).data || [];
      this.processCourseData(courses);
    });
  }

  private processUserData(users: any[]): void {
    const monthlyCounts = new Array(12).fill(0);
    users.forEach(user => {
      const createdAt = new Date(user.createdAt);
      const month = createdAt.getMonth();
      monthlyCounts[month]++;
    });
    this.monthlyUserData = monthlyCounts;
  }

  private processCourseData(courses: any[]): void {
    const monthlyCounts = new Array(12).fill(0);
    courses.forEach(course => {
      const createdAt = new Date(course.createdAt);
      const month = createdAt.getMonth();
      monthlyCounts[month]++;
    });
    this.monthlyCourseData = monthlyCounts;
  }

  getMaxValue(data: number[]): number {
    const max = Math.max(...data);
    return max > 0 ? max : 1; // Avoid division by zero
  }
}
