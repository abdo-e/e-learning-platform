import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Course } from '../models/course.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private apiUrl = 'http://localhost:8000'; // Replace with your backend URL

  constructor(private http: HttpClient) { }

  // Create a new course
  createCourse(course: Course): Observable<Course> {
    return this.http.post<Course>(`${this.apiUrl}/api/courses`, course);
  }

  // Get all courses with optional filters
  getCourses(filters?: {
    search?: string;
    category?: string;
    difficulty?: string;
    sortBy?: string;
    minRating?: number;
  }): Observable<any> {
    let params = new HttpParams();

    if (filters) {
      if (filters.search) params = params.set('search', filters.search);
      if (filters.category) params = params.set('category', filters.category);
      if (filters.difficulty) params = params.set('difficulty', filters.difficulty);
      if (filters.sortBy) params = params.set('sortBy', filters.sortBy);
      if (filters.minRating) params = params.set('minRating', filters.minRating.toString());
    }

    return this.http.get<any>(`${this.apiUrl}/api/courses`, { params });
  }

  // Get a course by ID
  getCourseById(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/api/courses/${id}`);
  }

  // Update a course
  updateCourse(id: string, course: Course): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/api/courses/${id}`, course);
  }

  // Delete a course
  deleteCourse(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/api/courses/${id}`);
  }
  countCourses(): Observable<number> {
    return this.http.get<Course[]>(`${this.apiUrl}/api/courses`).pipe(
      map(courses => courses.length)
    );
  }

  // Add rating to a course
  addRating(courseId: string, userId: string, rating: number, comment: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/courses/${courseId}/ratings`, {
      userId,
      rating,
      comment
    });
  }

  // Get ratings for a course
  getRatings(courseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/courses/${courseId}/ratings`);
  }

  // Add discussion to a course
  addDiscussion(courseId: string, userId: string, message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/courses/${courseId}/discussions`, {
      userId,
      message
    });
  }

  // Add reply to a discussion
  addReply(courseId: string, discussionId: string, userId: string, message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/courses/${courseId}/discussions/${discussionId}/replies`, {
      userId,
      message
    });
  }

  // Get discussions for a course
  getDiscussions(courseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/courses/${courseId}/discussions`);
  }

}