import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Course } from '../models/course.model';
import { CourseService } from '../services/course.service';
import { UserService } from '../services/user.service';
import { User } from '../models/user.model';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  courses: Course[] = [];
  currentUser: User | null = null;
  courseProgressMap: Map<string, any> = new Map(); // Map of courseId -> progress data

  // Search & Filter
  searchQuery: string = '';
  selectedCategory: string = 'all';
  selectedDifficulty: string = 'all';
  selectedSort: string = 'newest';
  minRating: number = 0;

  // Enrollment
  enrolledCourseIds: Set<string> = new Set();
  showMyCoursesOnly: boolean = false;

  // Bookmarks
  bookmarkedCourseIds: Set<string> = new Set();

  constructor(
    private courseService: CourseService,
    private userService: UserService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.fetchCourses();
    this.loadCurrentUser();
    this.loadCourseProgress();
    this.loadEnrolledCourses();
    this.loadBookmarks();
  }

  fetchCourses(): void {
    this.courseService.getCourses().subscribe({
      next: (response) => {
        // Extract the courses array from the response object
        this.courses = Array.isArray(response) ? response : (response.data || []);
        this.cdr.detectChanges(); // Trigger change detection after courses load
      },
      error: (error) => {
        console.error('Error fetching courses:', error);
      }
    });
  }
  loadCurrentUser(): void {
    const userId = this.userService.getCurrentUserId();
    if (userId) {
      this.userService.getUserById(userId).subscribe({
        next: (user) => {
          console.log('Raw user data from API:', JSON.stringify(user, null, 2));

          // Ensure doneCourses is always an array
          this.currentUser = { ...user, doneCourses: user.doneCourses ?? [] };
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading user:', error);
        }
      });
    }
  }

  /**
   * Load course progress for the current user
   */
  loadCourseProgress(): void {
    const userId = this.userService.getCurrentUserId();
    if (!userId) return;

    this.userService.getAllCourseProgress().subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          // Create a map of courseId -> progress data
          response.data.forEach((progress: any) => {
            if (progress.courseId) {
              this.courseProgressMap.set(progress.courseId, progress);
            }
          });
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Failed to load course progress:', err)
    });
  }

  /**
   * Get progress percentage for a course
   */
  getCourseProgressPercentage(courseId: string | undefined): number {
    if (!courseId) return 0;
    const progress = this.courseProgressMap.get(courseId);
    return progress?.progressPercentage || 0;
  }

  /**
   * Check if a course is completed
   */
  isCourseCompletedNew(courseId: string | undefined): boolean {
    if (!courseId) return false;
    const progress = this.courseProgressMap.get(courseId);
    return progress?.completed || false;
  }



  get completionPercentage(): number {
    if (!this.currentUser || !this.courses.length) {
      console.log('No user or courses yet');
      return 0;
    }

    console.log('Checking doneCourses:', this.currentUser.doneCourses);

    if (!Array.isArray(this.currentUser.doneCourses)) {
      console.warn('doneCourses is not an array:', this.currentUser.doneCourses);
      return 0;
    }

    const completedCount = this.currentUser.doneCourses.length;
    const totalCourses = this.courses.length;
    const percentage = Math.round((completedCount / totalCourses) * 100);

    console.log(`Completed: ${completedCount}, Total: ${totalCourses}, Percentage: ${percentage}`);
    return percentage;
  }

  isCourseCompleted(courseTitle: string): boolean {
    return this.currentUser?.doneCourses?.includes(courseTitle) || false;
  }

  /**
   * Apply search and filters
   */
  applyFilters(): void {
    const filters: any = {};

    if (this.searchQuery) filters.search = this.searchQuery;
    if (this.selectedCategory !== 'all') filters.category = this.selectedCategory;
    if (this.selectedDifficulty !== 'all') filters.difficulty = this.selectedDifficulty;
    if (this.selectedSort) filters.sortBy = this.selectedSort;
    if (this.minRating > 0) filters.minRating = this.minRating;

    this.courseService.getCourses(filters).subscribe({
      next: (response) => {
        this.courses = Array.isArray(response) ? response : (response.data || []);
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Error fetching filtered courses:', error)
    });
  }

  /**
   * Load enrolled courses
   */
  loadEnrolledCourses(): void {
    this.userService.getEnrolledCourses().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.enrolledCourseIds = new Set(
            response.data.map((ec: any) => ec.courseId._id || ec.courseId)
          );
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Failed to load enrolled courses:', err)
    });
  }

  /**
   * Enroll in a course
   */
  enrollInCourse(courseId: string): void {
    this.userService.enrollInCourse(courseId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.enrolledCourseIds.add(courseId);
          alert('✅ Successfully enrolled in course!');
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Failed to enroll:', err);
        alert('Failed to enroll in course');
      }
    });
  }

  /**
   * Check if user is enrolled in a course
   */
  isEnrolled(courseId: string | undefined): boolean {
    if (!courseId) return false;
    return this.enrolledCourseIds.has(courseId);
  }

  /**
   * Toggle My Courses view
   */
  toggleMyCoursesView(): void {
    this.showMyCoursesOnly = !this.showMyCoursesOnly;
    if (this.showMyCoursesOnly) {
      this.loadEnrolledCourses();
    } else {
      this.applyFilters();
    }
  }

  /**
   * Get filtered courses for display
   */
  get displayedCourses(): Course[] {
    if (!this.showMyCoursesOnly) return this.courses;
    return this.courses.filter(c => this.isEnrolled(c._id));
  }

  /**
   * Load bookmarked courses
   */
  loadBookmarks(): void {
    this.userService.getBookmarks().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.bookmarkedCourseIds = new Set(
            response.data.map((bc: any) => bc.courseId._id || bc.courseId)
          );
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error('Failed to load bookmarks:', err)
    });
  }

  /**
   * Toggle bookmark for a course
   */
  toggleBookmark(courseId: string, event: Event): void {
    event.stopPropagation();

    if (this.isBookmarked(courseId)) {
      this.userService.removeBookmark(courseId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.bookmarkedCourseIds.delete(courseId);
            this.cdr.detectChanges();
          }
        },
        error: (err) => console.error('Failed to remove bookmark:', err)
      });
    } else {
      this.userService.addBookmark(courseId).subscribe({
        next: (response: any) => {
          if (response.success) {
            this.bookmarkedCourseIds.add(courseId);
            this.cdr.detectChanges();
          }
        },
        error: (err) => console.error('Failed to add bookmark:', err)
      });
    }
  }

  /**
   * Check if course is bookmarked
   */
  isBookmarked(courseId: string | undefined): boolean {
    if (!courseId) return false;
    return this.bookmarkedCourseIds.has(courseId);
  }
}