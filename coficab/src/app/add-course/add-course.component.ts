import { Component, OnInit } from '@angular/core';
import { VideoService } from '../services/video.service';
import { CourseService } from '../services/course.service';
import { Video } from '../models/video.model';
import { Course } from '../models/course.model';

@Component({
  selector: 'app-add-course',
  templateUrl: './add-course.component.html',
  styleUrls: ['./add-course.component.css'],
})
export class AddCourseComponent implements OnInit {
  activeTab: string = 'upload';

  video: Video = new Video();
  course: Course = new Course();           // Course to be created
  videos: Video[] = [];                    // List of uploaded videos
  selectedFile: File | null = null;        // Selected video file from input
  message: string = '';                    // Success or error message
  uploading: boolean = false;              // Flag to indicate if a video is uploading

  constructor(
    private videoService: VideoService,
    private courseService: CourseService
  ) { }

  ngOnInit(): void {
    this.fetchVideos();
  }

  // Called when a file is selected by the user
  onFileSelected(event: any): void {
    this.selectedFile = event.target.files[0];
  }

  // Uploads the video file
  uploadVideo(): void {
    if (!this.selectedFile) {
      this.message = 'Please select a video file.';
      return;
    }

    const formData = new FormData();
    formData.append('video', this.selectedFile);
    formData.append('title', this.video.title);

    // Set uploading flag to true to show the placeholder/spinner in the UI
    this.uploading = true;

    this.videoService.uploadVideo(formData).subscribe(
      (response) => {
        this.message = 'Video uploaded successfully!';
        this.fetchVideos(); // Refresh the list of uploaded videos
        this.video = new Video(); // Reset the video form
        this.selectedFile = null;
        this.uploading = false; // Clear the uploading flag
      },
      (error) => {
        console.error('Video upload error:', error);
        this.message = 'Failed to upload video. Please try again.';
        this.uploading = false; // Clear the uploading flag on error as well
      }
    );
  }

  // Fetches the list of uploaded videos
  fetchVideos(): void {
    this.videoService.getVideos().subscribe(
      (videos) => {
        this.videos = videos;
      },
      (error) => {
        console.error('Error fetching videos:', error);
      }
    );
  }

  // Adds a new quiz question to the course (max 5 allowed)
  addQuestion(): void {
    if (this.course.quiz.length >= 5) {
      this.message = 'You can only add up to 5 questions.';
      return;
    }
    this.course.quiz.push({
      question: '',
      options: [
        { text: '', correct: false },
        { text: '', correct: false },
        { text: '', correct: false },
        { text: '', correct: false },
      ],
    });
  }

  // Removes a quiz question from the course by index
  removeQuestion(index: number): void {
    this.course.quiz.splice(index, 1);
  }

  // Creates the course after validating all inputs
  createCourse(): void {
    // Validate that at least one quiz question is added
    if (this.course.quiz.length === 0) {
      this.message = 'Please add at least one quiz question.';
      return;
    }

    // Validate that at least one video is selected for the course
    if (!this.course.videos || this.course.videos.length === 0) {
      this.message = 'Please select at least one video.';
      return;
    }

    // Validate difficulty level
    if (!['Beginner', 'Intermediate', 'Advanced'].includes(this.course.difficulty)) {
      this.message = 'Please select a valid difficulty level.';
      return;
    }

    // Validate category selection
    if (!this.course.category) {
      this.message = 'Please select a category.';
      return;
    }

    this.courseService.createCourse(this.course).subscribe(
      (response) => {
        this.message = 'Course created successfully!';
        this.course = new Course(); // Reset the course form
      },
      (error) => {
        console.error('Course creation error:', error);
        this.message = 'Failed to create course. Please try again.';
      }
    );
  }

  // Toggle video selection for course
  toggleVideo(videoId: string): void {
    if (!this.course.videos) {
      this.course.videos = [];
    }

    const index = this.course.videos.indexOf(videoId);
    if (index > -1) {
      this.course.videos.splice(index, 1);
    } else {
      this.course.videos.push(videoId);
    }
  }

  // Set correct answer for quiz question
  setCorrectAnswer(questionIndex: number, optionIndex: number): void {
    // Reset all options to false
    this.course.quiz[questionIndex].options.forEach((opt: any) => {
      opt.correct = false;
    });
    // Set the selected option as correct
    this.course.quiz[questionIndex].options[optionIndex].correct = true;
  }
}
