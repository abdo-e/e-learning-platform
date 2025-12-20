import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
    selector: 'app-instructor-application',
    templateUrl: './instructor-application.component.html',
    styleUrls: ['./instructor-application.component.css']
})
export class InstructorApplicationComponent implements OnInit {
    bio: string = '';
    expertise: string = '';
    cvFile: File | null = null;
    letterFile: File | null = null;

    isLoading: boolean = false;
    message: string = '';
    isError: boolean = false;

    applicationStatus: string = 'none';

    constructor(private userService: UserService, private router: Router) { }

    ngOnInit(): void {
        this.checkApplicationStatus();
    }

    checkApplicationStatus(): void {
        const userId = this.userService.getCurrentUserId();
        if (userId) {
            this.userService.getUserById(userId).subscribe(
                user => {
                    this.applicationStatus = user.instructorProfile?.applicationStatus || 'none';
                    if (user.role === 'instructor') {
                        this.applicationStatus = 'approved';
                    }
                },
                error => console.error('Error fetching user status:', error)
            );
        }
    }

    onFileSelected(event: any, type: 'cv' | 'letter'): void {
        const file = event.target.files[0];
        if (file) {
            if (type === 'cv') this.cvFile = file;
            else this.letterFile = file;
        }
    }

    submitApplication(): void {
        if (!this.cvFile) {
            this.message = 'Please upload your CV.';
            this.isError = true;
            return;
        }

        this.isLoading = true;
        this.message = '';

        const formData = new FormData();
        formData.append('bio', this.bio);
        formData.append('expertise', this.expertise);
        formData.append('cv', this.cvFile);
        if (this.letterFile) {
            formData.append('recommendationLetter', this.letterFile);
        }

        this.userService.applyAsInstructor(formData).subscribe(
            response => {
                this.isLoading = false;
                this.message = 'Application submitted successfully! Redirecting...';
                this.isError = false;
                this.applicationStatus = 'pending';
                setTimeout(() => this.router.navigate(['/main']), 3000);
            },
            error => {
                this.isLoading = false;
                this.message = error.message || 'Failed to submit application. Please try again.';
                this.isError = true;
            }
        );
    }
}
