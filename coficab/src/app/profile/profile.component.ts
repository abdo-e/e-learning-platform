import { Component, OnInit } from '@angular/core';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  stats: any = null;
  certificates: any[] = [];
  loading: boolean = true;
  userName: string = '';

  constructor(private userService: UserService) { }

  ngOnInit(): void {
    this.loadUserName();
    this.loadStats();
    this.loadCertificates();
  }

  loadUserName(): void {
    const user = localStorage.getItem('user');
    if (user) {
      const userData = JSON.parse(user);
      this.userName = userData.name || 'User';
    }
  }

  loadStats(): void {
    this.userService.getUserStats().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.stats = response.data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load stats:', err);
        this.loading = false;
      }
    });
  }

  loadCertificates(): void {
    this.userService.getUserCertificates().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.certificates = response.data || [];
        }
      },
      error: (err) => console.error('Failed to load certificates:', err)
    });
  }

  downloadCertificate(courseId: string): void {
    this.userService.downloadCertificate(courseId).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `certificate-${courseId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Failed to download certificate:', err);
        alert('Failed to download certificate');
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
}
