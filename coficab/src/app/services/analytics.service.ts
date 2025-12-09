import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AnalyticsService {
    private apiUrl = 'http://localhost:8000/api/analytics';

    constructor(private http: HttpClient) { }

    getOverview(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/overview`);
    }

    getUserGrowth(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/user-growth`);
    }

    getCourseStats(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/course-stats`);
    }

    getPopularCourses(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/popular-courses`);
    }
}
