import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CourseService } from '../services/course.service';
import { SubscriptionService } from '../services/subscription.service';
import { PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-marketplace',
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.css']
})
export class MarketplaceComponent implements OnInit {
  courses: any[] = [];
  filteredCourses: any[] = [];
  loading: boolean = true;
  error: string = '';

  // Filters
  selectedCategory: string = 'all';
  selectedDifficulty: string = 'all';
  selectedPriceRange: string = 'all';
  searchQuery: string = '';

  // Filter options
  categories: string[] = [];
  difficulties: string[] = ['Beginner', 'Intermediate', 'Advanced'];
  priceRanges = [
    { label: 'All Prices', value: 'all' },
    { label: 'Free', value: 'free' },
    { label: 'Under $50', value: '0-50' },
    { label: '$50 - $100', value: '50-100' },
    { label: 'Over $100', value: '100+' }
  ];

  // Subscription status
  hasActiveSubscription: boolean = false;

  // Sort options
  sortBy: string = 'newest';
  sortOptions = [
    { label: 'Newest First', value: 'newest' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
    { label: 'Most Popular', value: 'popular' },
    { label: 'Highest Rated', value: 'rating' }
  ];

  constructor(
    private courseService: CourseService,
    private subscriptionService: SubscriptionService,
    private paymentService: PaymentService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadCourses();
    this.checkSubscriptionStatus();
  }

  loadCourses(): void {
    this.loading = true;
    this.courseService.getCourses().subscribe({
      next: (response) => {
        if (response.success) {
          // Filter to show only paid and premium courses
          this.courses = response.data.filter((course: any) =>
            course.courseType === 'paid' || course.courseType === 'premium'
          );
          this.extractCategories();
          this.applyFilters();
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.error = 'Failed to load courses. Please try again.';
        this.loading = false;
      }
    });
  }

  checkSubscriptionStatus(): void {
    this.hasActiveSubscription = this.subscriptionService.hasActiveSubscription();
  }

  extractCategories(): void {
    const categorySet = new Set(this.courses.map(course => course.category));
    this.categories = Array.from(categorySet);
  }

  applyFilters(): void {
    let filtered = [...this.courses];

    // Category filter
    if (this.selectedCategory !== 'all') {
      filtered = filtered.filter(course => course.category === this.selectedCategory);
    }

    // Difficulty filter
    if (this.selectedDifficulty !== 'all') {
      filtered = filtered.filter(course => course.difficulty === this.selectedDifficulty);
    }

    // Price range filter
    if (this.selectedPriceRange !== 'all') {
      filtered = this.filterByPriceRange(filtered, this.selectedPriceRange);
    }

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered = this.sortCourses(filtered);

    this.filteredCourses = filtered;
  }

  filterByPriceRange(courses: any[], range: string): any[] {
    if (range === 'free') {
      return courses.filter(c => c.price === 0);
    } else if (range === '0-50') {
      return courses.filter(c => c.price > 0 && c.price <= 50);
    } else if (range === '50-100') {
      return courses.filter(c => c.price > 50 && c.price <= 100);
    } else if (range === '100+') {
      return courses.filter(c => c.price > 100);
    }
    return courses;
  }

  sortCourses(courses: any[]): any[] {
    const sorted = [...courses];

    switch (this.sortBy) {
      case 'newest':
        return sorted.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'price-asc':
        return sorted.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return sorted.sort((a, b) => b.price - a.price);
      case 'popular':
        return sorted.sort((a, b) => b.totalEnrollments - a.totalEnrollments);
      case 'rating':
        return sorted.sort((a, b) => b.averageRating - a.averageRating);
      default:
        return sorted;
    }
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  viewCourseDetails(courseId: string): void {
    this.router.navigate(['/course-details', courseId]);
  }

  purchaseCourse(course: any, event: Event): void {
    event.stopPropagation();

    // If user has subscription, they already have access
    if (this.hasActiveSubscription && course.courseType !== 'premium') {
      alert('You already have access to this course through your subscription!');
      return;
    }

    // Navigate to purchase page
    this.router.navigate(['/course-purchase', course._id]);
  }

  getDiscountedPrice(course: any): number {
    if (course.discount && course.discount.percentage > 0) {
      const discountEndDate = new Date(course.discount.validUntil);
      if (discountEndDate > new Date()) {
        return course.price * (1 - course.discount.percentage / 100);
      }
    }
    return course.price;
  }

  hasDiscount(course: any): boolean {
    if (course.discount && course.discount.percentage > 0) {
      const discountEndDate = new Date(course.discount.validUntil);
      return discountEndDate > new Date();
    }
    return false;
  }

  getCourseAccessLabel(course: any): string {
    if (this.hasActiveSubscription) {
      return 'Included in Subscription';
    }
    if (course.courseType === 'premium') {
      return 'Premium Only';
    }
    return 'Purchase';
  }

  canPurchase(course: any): boolean {
    if (course.courseType === 'premium' && !this.hasActiveSubscription) {
      return false;
    }
    return true;
  }
}
