  import { Injectable } from '@angular/core';
  import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
  import { Observable } from 'rxjs';
  import { Video } from '../models/video.model';

  @Injectable({
    providedIn: 'root',
  })
  export class VideoService {
    private apiUrl = 'http://localhost:8000'; // Replace with your backend URL

    constructor(private http: HttpClient) {}

    // Upload a video
    uploadVideo(formData: FormData): Observable<any> {
      return this.http.post(`${this.apiUrl}/upload`, formData);
    }

    // Get all videos
    getVideos(): Observable<Video[]> {
      return this.http.get<Video[]>(`${this.apiUrl}/api/videos`);
    }
    
    // Get a video by ID
    getVideoById(id: string): Observable<HttpResponse<Blob>> {
      return this.http.get(`${this.apiUrl}/api/videos/stream/${id}`, {
        responseType: 'blob',
        observe: 'response',
      });
    }
    
    

    streamVideo(filename: string, start: number, end: number): Observable<HttpResponse<Blob>> {
      const headers = new HttpHeaders({
        Range: `bytes=${start}-${end}`,
      });
    
      return this.http.get(`${this.apiUrl}/api/videos/stream/${filename}`, {
        headers,
        responseType: 'blob',
        observe: 'response',
      });
    }
    
    }
    






