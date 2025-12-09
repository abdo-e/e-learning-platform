import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CourseService } from '../services/course.service';
import { VideoService } from '../services/video.service';
import { UserService } from '../services/user.service';
import { Video } from '../models/video.model';

@Component({
  selector: 'app-course-details',
  templateUrl: './course-details.component.html',
  styleUrls: ['./course-details.component.css'],
})
export class CourseDetailsComponent implements OnInit, OnDestroy {
  course: any;
  videoUrl: string | null = null;
  currentVideo: Video | null = null;
  currentVideoId: string | null = null;
  userAnswers: number[] = [];
  quizResult: number | null = null;
  videoWatched: boolean = false;
  canPlayVideo: boolean = true;

  // Progress tracking
  savedProgress: number = 0;
  progressUpdateInterval: any = null;

  // Certificate
  canDownloadCertificate: boolean = false;

  // Quiz timer and attempts
  quizTimeLimit: number = 0; // seconds, 0 = no limit
  quizTimeRemaining: number = 0;
  quizTimerInterval: any = null;
  quizTimerStarted: boolean = false;
  maxAttempts: number = 0; // 0 = unlimited
  attemptsUsed: number = 0;
  attemptsRemaining: number = -1; // -1 = unlimited
  passingScore: number = 60;

  // Ratings
  userRating: number = 0;
  userComment: string = '';
  courseRatings: any[] = [];
  averageRating: number = 0;
  totalRatings: number = 0;

  // Discussions
  discussions: any[] = [];
  newDiscussionMessage: string = '';
  replyMessages: { [key: string]: string } = {};
  showReplyForm: { [key: string]: boolean } = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private videoService: VideoService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    const courseId = this.route.snapshot.paramMap.get('id');
    if (courseId) {
      this.loadCourse(courseId);
    }
  }

  ngOnDestroy(): void {
    if (this.videoUrl) {
      URL.revokeObjectURL(this.videoUrl);
    }

    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
    }
  }

  loadCourse(courseId: string): void {
    this.courseService.getCourseById(courseId).subscribe({
      next: (response: any) => {
        // Extract the course from the response object
        this.course = response.data || response;
        console.log('Loaded Course:', this.course);

        // Initialize quiz settings
        if (this.course.quizSettings) {
          this.quizTimeLimit = this.course.quizSettings.timeLimit || 0;
          this.maxAttempts = this.course.quizSettings.maxAttempts || 0;
          this.passingScore = this.course.quizSettings.passingScore || 60;
        }

        // Load user's quiz attempts to check remaining attempts
        this.loadQuizAttempts();

        // Load ratings
        this.loadRatings();

        // Load discussions
        this.loadDiscussions();

        if (Array.isArray(this.course.videos) && this.course.videos.length > 0) {
          const firstVideo = this.course.videos[0];
          const firstVideoFilename: string =
            typeof firstVideo === 'string' ? firstVideo : (firstVideo as Video).filename;

          if (firstVideoFilename) {
            this.loadVideo(firstVideoFilename);
            this.currentVideoId = firstVideo._id || firstVideo;
          } else {
            console.error('First video does not have a valid filename.');
          }
        }
      },
      error: (err: any) => {
        console.error('Failed to load course:', err);
      },
    });
  }

  loadVideo(filename: string): void {
    if (!filename) {
      console.error('Invalid video filename:', filename);
      return;
    }

    console.log('Requesting video:', filename);

    this.videoService.getVideoById(filename).subscribe({
      next: (response) => {
        console.log('Video API Response:', response);

        const videoBlob = response.body;
        if (videoBlob) {
          this.videoUrl = URL.createObjectURL(videoBlob);
          console.log('Generated Blob URL:', this.videoUrl);

          this.loadSavedProgress();
        } else {
          console.error('Empty video response');
        }
      },
      error: (error) => {
        console.error('Failed to load video:', error);
      },
    });
  }

  onVideoEnded(): void {
    this.videoWatched = true;
    this.canPlayVideo = false;
    console.log('User finished watching the video.');

    if (this.currentVideoId && this.course) {
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      const duration = videoElement?.duration || 0;

      this.userService.updateVideoProgress(
        this.course._id,
        this.currentVideoId,
        duration,
        duration,
        true
      ).subscribe({
        next: () => console.log('Video completion recorded'),
        error: (err) => console.error('Failed to record video completion:', err)
      });
    }
  }

  loadSavedProgress(): void {
    if (!this.currentVideoId || !this.course) return;

    this.userService.getVideoProgress(this.currentVideoId, this.course._id).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.savedProgress = response.data.watchedDuration || 0;
          this.videoWatched = response.data.completed || false;

          setTimeout(() => {
            const videoElement = document.querySelector('video') as HTMLVideoElement;
            if (videoElement && this.savedProgress > 0) {
              videoElement.currentTime = this.savedProgress;
              console.log(`Resumed video from ${this.savedProgress} seconds`);
            }

            this.startProgressTracking();
          }, 500);
        } else {
          this.startProgressTracking();
        }
      },
      error: (err) => {
        console.error('Failed to load video progress:', err);
        this.startProgressTracking();
      }
    });
  }

  startProgressTracking(): void {
    if (this.progressUpdateInterval) {
      clearInterval(this.progressUpdateInterval);
    }

    this.progressUpdateInterval = setInterval(() => {
      const videoElement = document.querySelector('video') as HTMLVideoElement;
      if (videoElement && !videoElement.paused && this.currentVideoId && this.course) {
        const currentTime = videoElement.currentTime;
        const duration = videoElement.duration;

        this.userService.updateVideoProgress(
          this.course._id,
          this.currentVideoId,
          currentTime,
          duration,
          false
        ).subscribe({
          next: () => console.log(`Progress saved: ${currentTime}s / ${duration}s`),
          error: (err) => console.error('Failed to save progress:', err)
        });
      }
    }, 5000);
  }

  /**
   * Load quiz attempts to check remaining attempts
   */
  loadQuizAttempts(): void {
    if (!this.course) return;

    this.userService.getCourseProgress(this.course._id).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.attemptsUsed = response.data.quizAttempts?.length || 0;
          if (this.maxAttempts > 0) {
            this.attemptsRemaining = this.maxAttempts - this.attemptsUsed;
          }
        }
      },
      error: (err) => console.error('Failed to load quiz attempts:', err)
    });
  }

  /**
   * Start quiz timer when user begins quiz
   */
  startQuizTimer(): void {
    if (this.quizTimeLimit <= 0 || this.quizTimerStarted) return;

    this.quizTimerStarted = true;
    this.quizTimeRemaining = this.quizTimeLimit;

    this.quizTimerInterval = setInterval(() => {
      this.quizTimeRemaining--;

      if (this.quizTimeRemaining <= 0) {
        clearInterval(this.quizTimerInterval);
        alert('⏰ Time\'s up! Submitting quiz automatically.');
        this.submitQuiz();
      }
    }, 1000);
  }

  /**
   * Format time remaining for display (MM:SS)
   */
  formatTimeRemaining(): string {
    const minutes = Math.floor(this.quizTimeRemaining / 60);
    const seconds = this.quizTimeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  submitQuiz(): void {
    if (!this.videoWatched) {
      alert('You must watch the full video before taking the quiz.');
      return;
    }

    // Check attempts limit
    if (this.maxAttempts > 0 && this.attemptsRemaining <= 0) {
      alert(`You have reached the maximum number of attempts (${this.maxAttempts}) for this quiz.`);
      return;
    }

    if (!this.course || !this.course.quiz || !Array.isArray(this.userAnswers) || this.userAnswers.length === 0) {
      console.error('No quiz data or user answers found.');
      return;
    }

    // Stop timer if running
    if (this.quizTimerInterval) {
      clearInterval(this.quizTimerInterval);
    }

    let score = 0;
    const feedbackMessages: string[] = [];

    this.course.quiz.forEach((question: any, index: number) => {
      if (this.userAnswers[index] !== undefined && question.options[this.userAnswers[index]]?.correct) {
        score++;
        feedbackMessages.push(`✅ Question ${index + 1}: Correct! 🎉`);
      } else {
        feedbackMessages.push(`❌ Question ${index + 1}: Incorrect. Try again!`);
      }
    });

    this.quizResult = score;
    const totalQuestions = this.course.quiz.length;
    const percentage = (score / totalQuestions) * 100;

    console.log(`User scored: ${percentage}%`);
    feedbackMessages.forEach(msg => console.log(msg));

    const passed = percentage >= this.passingScore;

    this.userService.recordQuizAttempt(
      this.course._id,
      score,
      totalQuestions,
      passed
    ).subscribe({
      next: (response: any) => {
        console.log('Quiz attempt recorded:', response);

        // Update attempts tracking
        if (response.data) {
          this.attemptsUsed = response.data.attemptsUsed || 0;
          this.attemptsRemaining = response.data.attemptsRemaining ?? -1;
        }

        if (passed) {
          alert('🎉 Congratulations! You passed the quiz! ✅\n\nYou can now download your certificate below.');
          this.canDownloadCertificate = true;
          // Scroll to certificate section
          setTimeout(() => {
            const certificateSection = document.querySelector('[data-certificate-section]');
            if (certificateSection) {
              certificateSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        } else {
          const attemptsMsg = this.attemptsRemaining > 0
            ? ` You have ${this.attemptsRemaining} attempt(s) remaining.`
            : '';
          alert(`❌ You failed the quiz. Please watch the video again and retake the test.${attemptsMsg}`);
          this.videoWatched = false;
          this.canPlayVideo = true;
          this.quizResult = null;
          this.userAnswers = [];
          this.quizTimerStarted = false;
        }
      },
      error: (err: any) => {
        console.error('Failed to record quiz attempt:', err);
        alert('Error recording quiz attempt. Please try again.');
      }
    });
  }

  downloadCertificate(): void {
    if (!this.course || !this.canDownloadCertificate) {
      alert('Certificate not available yet. Please complete the course first.');
      return;
    }

    this.userService.downloadCertificate(this.course._id).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Certificate-${this.course.title.replace(/\s+/g, '-')}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
        console.log('Certificate downloaded successfully');
      },
      error: (err: any) => {
        console.error('Failed to download certificate:', err);
        alert('Failed to download certificate. Please try again.');
      }
    });
  }

  /**
   * Load ratings for the course
   */
  loadRatings(): void {
    if (!this.course) return;

    this.courseService.getRatings(this.course._id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.courseRatings = response.data.ratings || [];
          this.averageRating = response.data.averageRating || 0;
          this.totalRatings = response.data.totalRatings || 0;
        }
      },
      error: (err) => console.error('Failed to load ratings:', err)
    });
  }

  /**
   * Submit user rating
   */
  submitRating(): void {
    if (!this.course || this.userRating === 0) {
      alert('Please select a rating');
      return;
    }

    const userId = this.userService.getCurrentUserId();
    if (!userId) {
      alert('Please log in to rate this course');
      return;
    }

    this.courseService.addRating(
      this.course._id,
      userId,
      this.userRating,
      this.userComment
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          alert('✅ Rating submitted successfully!');
          this.userRating = 0;
          this.userComment = '';
          this.loadRatings();
        }
      },
      error: (err) => {
        console.error('Failed to submit rating:', err);
        alert('Failed to submit rating. Please try again.');
      }
    });
  }

  /**
   * Load discussions for the course
   */
  loadDiscussions(): void {
    if (!this.course) return;

    this.courseService.getDiscussions(this.course._id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.discussions = response.data || [];
        }
      },
      error: (err) => console.error('Failed to load discussions:', err)
    });
  }

  /**
   * Post new discussion
   */
  postDiscussion(): void {
    if (!this.course || !this.newDiscussionMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    const userId = this.userService.getCurrentUserId();
    if (!userId) {
      alert('Please log in to post a discussion');
      return;
    }

    this.courseService.addDiscussion(
      this.course._id,
      userId,
      this.newDiscussionMessage
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.newDiscussionMessage = '';
          this.loadDiscussions();
        }
      },
      error: (err) => {
        console.error('Failed to post discussion:', err);
        alert('Failed to post discussion. Please try again.');
      }
    });
  }

  /**
   * Toggle reply form for a discussion
   */
  toggleReplyForm(discussionId: string): void {
    this.showReplyForm[discussionId] = !this.showReplyForm[discussionId];
  }

  /**
   * Post reply to a discussion
   */
  postReply(discussionId: string): void {
    const message = this.replyMessages[discussionId];
    if (!this.course || !message || !message.trim()) {
      alert('Please enter a reply');
      return;
    }

    const userId = this.userService.getCurrentUserId();
    if (!userId) {
      alert('Please log in to reply');
      return;
    }

    this.courseService.addReply(
      this.course._id,
      discussionId,
      userId,
      message
    ).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.replyMessages[discussionId] = '';
          this.showReplyForm[discussionId] = false;
          this.loadDiscussions();
        }
      },
      error: (err) => {
        console.error('Failed to post reply:', err);
        alert('Failed to post reply. Please try again.');
      }
    });
  }

  /**
   * Get count of answered questions
   */
  getAnsweredCount(): number {
    return this.userAnswers.filter(a => a !== undefined && a !== null).length;
  }

  /**
   * Get progress percentage for quiz
   */
  getQuizProgressPercentage(): number {
    if (!this.course || !this.course.quiz || this.course.quiz.length === 0) {
      return 0;
    }
    return (this.getAnsweredCount() / this.course.quiz.length) * 100;
  }
}