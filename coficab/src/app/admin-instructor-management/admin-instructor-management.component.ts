import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';

@Component({
    selector: 'app-admin-instructor-management',
    templateUrl: './admin-instructor-management.component.html',
    styleUrls: ['./admin-instructor-management.component.css']
})
export class AdminInstructorManagementComponent implements OnInit {
    applications: any[] = [];
    isLoading: boolean = false;
    message: string = '';
    isError: boolean = false;

    constructor(private userService: UserService) { }

    ngOnInit(): void {
        this.loadApplications();
    }

    loadApplications(): void {
        this.isLoading = true;
        this.userService.getPendingInstructorApplications().subscribe(
            response => {
                this.applications = response.data;
                this.isLoading = false;
            },
            error => {
                this.message = 'Failed to load applications.';
                this.isError = true;
                this.isLoading = false;
            }
        );
    }

    approve(userId: string): void {
        if (confirm('Are you sure you want to approve this instructor?')) {
            this.userService.approveInstructorApplication(userId).subscribe(
                () => {
                    this.message = 'Instructor approved successfully!';
                    this.isError = false;
                    this.loadApplications();
                },
                () => {
                    this.message = 'Failed to approve instructor.';
                    this.isError = true;
                }
            );
        }
    }

    reject(userId: string): void {
        if (confirm('Are you sure you want to reject this instructor?')) {
            this.userService.rejectInstructorApplication(userId).subscribe(
                () => {
                    this.message = 'Instructor application rejected.';
                    this.isError = false;
                    this.loadApplications();
                },
                () => {
                    this.message = 'Failed to reject instructor.';
                    this.isError = true;
                }
            );
        }
    }

    downloadDoc(userId: string, type: 'cv' | 'recommendationLetter'): void {
        this.userService.downloadInstructorDocument(userId, type).subscribe(
            blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}-${userId}.pdf`; // Simple name, extension could be dynamic but pdf is most common
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error => {
                alert('Failed to download document.');
            }
        );
    }
}
