import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:8000';

  constructor(private http: HttpClient) { }

  signup(user: User): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, user).pipe(
      catchError(this.handleError)
    );
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      map((response: any) => {
        if (response && response._id) {
          this.saveUserSession(response._id);
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  getUserById(_id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/api/users/${_id}`).pipe(
      catchError(this.handleError)
    );
  }

  saveUserSession(_id: string): void {
    localStorage.setItem('_id', _id);
  }

  getCurrentUserId(): string | null {
    return localStorage.getItem('_id');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('_id');
  }

  logout(): void {
    localStorage.removeItem('_id');
  }

  addDoneCourse(courseName: string): Observable<any> {
    const _id = this.getCurrentUserId();
    console.log('Current user ID:', _id);

    if (!_id) {
      throw new Error('User ID not found. Please log in.');
    }

    const url = `${this.apiUrl}/api/users/${_id}/doneCourses`;
    const body = { courseName };

    return this.http.post(url, body);
  }

  /**
   * Update video progress for the current user
   */
  updateVideoProgress(
    courseId: string,
    videoId: string,
    watchedDuration: number,
    totalDuration: number,
    completed: boolean = false
  ): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User ID not found. Please log in.');
    }

    const url = `${this.apiUrl}/api/users/${userId}/progress/video`;
    const body = { courseId, videoId, watchedDuration, totalDuration, completed };

    return this.http.post(url, body).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get video progress for the current user
   */
  getVideoProgress(videoId: string, courseId: string): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User ID not found. Please log in.');
    }

    const url = `${this.apiUrl}/api/users/${userId}/progress/video/${videoId}?courseId=${courseId}`;
    return this.http.get(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get course progress for the current user
   */
  getCourseProgress(courseId: string): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User ID not found. Please log in.');
    }

    const url = `${this.apiUrl}/api/users/${userId}/progress/course/${courseId}`;
    return this.http.get(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get all course progress for the current user
   */
  getAllCourseProgress(userId?: string): Observable<any> {
    const uid = userId || this.getCurrentUserId();
    if (!uid) {
      throw new Error('User ID not found. Please log in.');
    }

    const url = `${this.apiUrl}/api/users/${uid}/progress`;
    return this.http.get(url).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Record a quiz attempt
   */
  recordQuizAttempt(
    courseId: string,
    score: number,
    totalQuestions: number,
    passed: boolean
  ): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User ID not found. Please log in.');
    }

    const url = `${this.apiUrl}/api/users/${userId}/quiz-attempt`;
    const body = { courseId, score, totalQuestions, passed };

    return this.http.post(url, body).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Download certificate for a completed course
   */
  downloadCertificate(courseId: string): Observable<Blob> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User ID not found. Please log in.');
    }

    const url = `${this.apiUrl}/api/users/${userId}/certificate/${courseId}`;
    return this.http.post(url, {}, { responseType: 'blob' }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get all certificates for the current user
   */
  getUserCertificates(userId?: string): Observable<any> {
    const uid = userId || this.getCurrentUserId();
    if (!uid) {
      throw new Error('User ID not found. Please log in.');
    }

    const url = `${this.apiUrl}/api/users/${uid}/certificates`;
    return this.http.get(url).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any) {
    console.error('Error occurred:', error);
    return throwError('Something went wrong. Please try again later.');
  }
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/api/users`)
      .pipe(catchError(this.handleError));
  }

  updateUser(id: string, data: Partial<User>): Observable<User> {
    return this.http.put<{ updatedUser: User }>(`${this.apiUrl}/api/users/${id}`, data)
      .pipe(
        map(response => response.updatedUser),
        catchError(this.handleError)
      );
  }

  deleteUser(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/api/users/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  countUsers(): Observable<number> {
    return this.http.get<User[]>(`${this.apiUrl}/api/users`).pipe(
      map(users => users.length)
    );
  }

  /**
   * Enroll current user in a course
   */
  enrollInCourse(courseId: string): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User ID not found. Please log in.');
    }

    return this.http.post(`${this.apiUrl}/api/users/${userId}/enroll/${courseId}`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all enrolled courses for current user
   */
  getEnrolledCourses(userId?: string): Observable<any> {
    const uid = userId || this.getCurrentUserId();
    if (!uid) {
      throw new Error('User ID not found. Please log in.');
    }

    return this.http.get(`${this.apiUrl}/api/users/${uid}/enrolled-courses`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Unenroll current user from a course
   */
  unenrollFromCourse(courseId: string): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User ID not found. Please log in.');
    }

    return this.http.delete(`${this.apiUrl}/api/users/${userId}/enroll/${courseId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get statistics for current user
   */
  getUserStats(userId?: string): Observable<any> {
    const uid = userId || this.getCurrentUserId();
    if (!uid) {
      throw new Error('User ID not found. Please log in.');
    }

    return this.http.get(`${this.apiUrl}/api/users/${uid}/stats`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Add bookmark
   */
  addBookmark(courseId: string): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User ID not found. Please log in.');
    }

    return this.http.post(`${this.apiUrl}/api/users/${userId}/bookmarks/${courseId}`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Remove bookmark
   */
  removeBookmark(courseId: string): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User ID not found. Please log in.');
    }

    return this.http.delete(`${this.apiUrl}/api/users/${userId}/bookmarks/${courseId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get bookmarked courses
   */
  getBookmarks(): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User ID not found. Please log in.');
    }

    return this.http.get(`${this.apiUrl}/api/users/${userId}/bookmarks`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Update learning streak
   */
  updateStreak(): Observable<any> {
    const userId = this.getCurrentUserId();
    if (!userId) {
      throw new Error('User ID not found. Please log in.');
    }

    return this.http.post(`${this.apiUrl}/api/users/${userId}/streak`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Apply for instructor status
   */
  applyAsInstructor(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/instructor/register`, formData)
      .pipe(catchError(this.handleError));
  }

  /**
   * Get all pending instructor applications (Admin only)
   */
  getPendingInstructorApplications(): Observable<any> {
    return this.http.get(`${this.apiUrl}/api/instructor/applications/pending`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Approve instructor application (Admin only)
   */
  approveInstructorApplication(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/instructor/approve/${userId}`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Reject instructor application (Admin only)
   */
  rejectInstructorApplication(userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/instructor/reject/${userId}`, {})
      .pipe(catchError(this.handleError));
  }

  /**
   * Download instructor document
   */
  downloadInstructorDocument(userId: string, type: 'cv' | 'recommendationLetter'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/api/instructor/document/${userId}/${type}`, {
      responseType: 'blob'
    }).pipe(catchError(this.handleError));
  }
}
