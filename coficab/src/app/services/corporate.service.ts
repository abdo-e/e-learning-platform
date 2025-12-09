import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Company {
    _id: string;
    name: string;
    industry: string;
    size: string;
    registrationStatus: string;
    stats: {
        totalEmployees: number;
        activeEmployees: number;
        totalCoursesCompleted: number;
        averageCompletionRate: number;
    };
}

export interface Employee {
    employeeId: string;
    name: string;
    email: string;
    department: string;
    position: string;
    completedCourses: number;
    totalCourses: number;
    completionRate: number;
}

@Injectable({
    providedIn: 'root'
})
export class CorporateService {
    private apiUrl = 'http://localhost:8000/api/corporate';

    constructor(private http: HttpClient) { }

    createCompany(companyData: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/companies`, companyData);
    }

    getCompanyDashboard(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/dashboard`);
    }

    addEmployee(email: string, employeeId: string, department?: string, position?: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/employees`, {
            email,
            employeeId,
            department,
            position
        });
    }

    removeEmployee(employeeUserId: string): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/employees/${employeeUserId}`);
    }

    assignCourse(courseId: string, deadline?: Date, applicableTo: string = 'all', departments?: string[], specificEmployees?: string[]): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/assign-course`, {
            courseId,
            deadline,
            applicableTo,
            departments,
            specificEmployees
        });
    }

    trackEmployeeProgress(employeeId: string): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/employee-progress/${employeeId}`);
    }

    generateComplianceReport(format: 'pdf' | 'csv' = 'pdf'): Observable<Blob> {
        return this.http.get(`${this.apiUrl}/compliance-report?format=${format}`, {
            responseType: 'blob'
        });
    }

    downloadComplianceReport(format: 'pdf' | 'csv' = 'pdf'): void {
        this.generateComplianceReport(format).subscribe({
            next: (blob) => {
                // Create blob with correct MIME type
                const mimeType = format === 'pdf' ? 'application/pdf' : 'text/csv';
                const file = new Blob([blob], { type: mimeType });

                const url = window.URL.createObjectURL(file);
                const link = document.createElement('a');
                link.href = url;
                link.download = `compliance-report-${Date.now()}.${format}`;
                document.body.appendChild(link);
                link.click();

                // Cleanup
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            },
            error: (error) => {
                console.error('Error downloading report:', error);
                alert(`Failed to download ${format.toUpperCase()} report. Please try again.`);
            }
        });
    }

    getTrainingAnalytics(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/analytics`);
    }

    approveCompany(companyId: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/companies/${companyId}/approve`, {});
    }

    rejectCompany(companyId: string, reason: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/companies/${companyId}/reject`, {
            reason
        });
    }

    getAllCompanies(page: number = 1, limit: number = 20, status?: string): Observable<any> {
        let url = `${this.apiUrl}/companies/all?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        return this.http.get<any>(url);
    }
}
