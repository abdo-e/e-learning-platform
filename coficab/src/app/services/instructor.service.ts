import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface InstructorProfile {
    isApproved: boolean;
    bio: string;
    expertise: string[];
    totalEarnings: number;
    availableBalance: number;
    totalStudents: number;
    totalCourses: number;
    rating: number;
    totalRatings: number;
}

export interface InstructorDashboard {
    profile: InstructorProfile;
    courses: any[];
    recentPayments: any[];
    stats: any;
}

@Injectable({
    providedIn: 'root'
})
export class InstructorService {
    private apiUrl = 'http://localhost:8000/api/instructors';

    constructor(private http: HttpClient) { }

    registerAsInstructor(bio: string, expertise: string[]): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/register`, {
            bio,
            expertise
        });
    }

    getInstructorDashboard(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/dashboard`);
    }

    getInstructorEarnings(startDate?: string, endDate?: string): Observable<any> {
        let url = `${this.apiUrl}/earnings`;
        const params: string[] = [];
        if (startDate) params.push(`startDate=${startDate}`);
        if (endDate) params.push(`endDate=${endDate}`);
        if (params.length > 0) url += `?${params.join('&')}`;
        return this.http.get<any>(url);
    }

    requestPayout(amount: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/payout`, {
            amount
        });
    }

    updateInstructorProfile(bio?: string, expertise?: string[], payoutDetails?: any): Observable<any> {
        const body: any = {};
        if (bio) body.bio = bio;
        if (expertise) body.expertise = expertise;
        if (payoutDetails) body.payoutDetails = payoutDetails;

        return this.http.put<any>(`${this.apiUrl}/profile`, body);
    }

    getInstructorProfile(instructorId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/${instructorId}`);
    }

    approveInstructor(userId: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/approve/${userId}`, {});
    }

    getAllInstructors(page: number = 1, limit: number = 20, approved?: boolean): Observable<any> {
        let url = `${this.apiUrl}/all?page=${page}&limit=${limit}`;
        if (approved !== undefined) url += `&approved=${approved}`;
        return this.http.get<any>(url);
    }
}
