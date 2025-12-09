import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { CourseService } from '../services/course.service';
import { Course } from '../models/course.model';

@Component({
  selector: 'app-manage-courses',
  templateUrl: './manage-courses.component.html',
  styleUrls: ['./manage-courses.component.css']
})
export class ManageCoursesComponent implements OnInit, OnDestroy {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  searchTerm: string = '';
  selectedCategory: string = '';
  selectedDifficulty: string = '';
  message: string = '';
  isLoading: boolean = false;
  private subscriptions: Subscription = new Subscription();

  categories: string[] = ['Programming', 'Design', 'Business', 'Marketing', 'Data Science'];
  difficulties: string[] = ['Beginner', 'Intermediate', 'Advanced'];

  constructor(
    private courseService: CourseService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCourses();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadCourses(): void {
    this.isLoading = true;
    const loadSub = this.courseService.getCourses()
      .pipe(
        finalize(() => this.isLoading = false),
        catchError(error => {
          console.error('Error fetching courses:', error);
          this.message = 'Failed to load courses. Please try again later.';
          return of({ data: [] });
        })
      )
      .subscribe(response => {
        // Handle both array response and object with data property
        if (Array.isArray(response)) {
          this.courses = response;
        } else {
          this.courses = response.data || [];
        }
        this.filteredCourses = this.courses;
      });

    this.subscriptions.add(loadSub);
  }

  filterCourses(): void {
    let filtered = this.courses;

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(course =>
        course.title?.toLowerCase().includes(term) ||
        course.description?.toLowerCase().includes(term)
      );
    }

    // Filter by category
    if (this.selectedCategory) {
      filtered = filtered.filter(course => course.category === this.selectedCategory);
    }

    // Filter by difficulty
    if (this.selectedDifficulty) {
      filtered = filtered.filter(course => course.difficulty === this.selectedDifficulty);
    }

    this.filteredCourses = filtered;
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedDifficulty = '';
    this.filterCourses();
  }

  editCourse(course: Course): void {
    // Navigate to add-course page with course data for editing
    // For now, just show a message
    this.message = `Edit functionality for "${course.title}" coming soon!`;
    setTimeout(() => this.message = '', 3000);
  }

  deleteCourse(course: Course): void {
    if (!course._id) return;

    const confirmation = confirm(`Are you sure you want to delete "${course.title}"?`);
    if (!confirmation) return;

    this.message = '';
    const deleteSub = this.courseService.deleteCourse(course._id)
      .pipe(
        catchError(error => {
          console.error('Error deleting course:', error);
          this.message = 'Failed to delete course. Please try again.';
          return of(null);
        })
      )
      .subscribe(response => {
        if (response) {
          this.message = `Course "${course.title}" deleted successfully!`;
          this.courses = this.courses.filter(c => c._id !== course._id);
          this.filterCourses();
          setTimeout(() => this.message = '', 3000);
        }
      });

    this.subscriptions.add(deleteSub);
  }

  trackByCourseId(index: number, course: Course): string {
    return course._id || index.toString();
  }
}
