import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SubscriptionService, SubscriptionPlan } from '../services/subscription.service';

@Component({
  selector: 'app-subscription-plans',
  templateUrl: './subscription-plans.component.html',
  styleUrls: ['./subscription-plans.component.css']
})
export class SubscriptionPlansComponent implements OnInit {
  plans: SubscriptionPlan[] = [];
  loading: boolean = true;
  error: string = '';
  currentSubscription: any = null;
  hasActiveSubscription: boolean = false;
  processing: boolean = false;

  constructor(
    private subscriptionService: SubscriptionService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadPlans();
    this.loadCurrentSubscription();
  }

  loadPlans(): void {
    this.loading = true;
    this.subscriptionService.getSubscriptionPlans().subscribe({
      next: (response) => {
        if (response.success) {
          this.plans = response.data;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading plans:', error);
        this.error = 'Failed to load subscription plans. Please try again.';
        this.loading = false;
      }
    });
  }

  loadCurrentSubscription(): void {
    this.subscriptionService.getSubscriptionStatus().subscribe({
      next: (response) => {
        if (response.success && response.data.hasSubscription) {
          this.currentSubscription = response.data.subscription;
          this.hasActiveSubscription = response.data.isActive;
        }
      },
      error: (error) => {
        console.error('Error loading subscription status:', error);
      }
    });
  }

  subscribeToPlan(plan: SubscriptionPlan): void {
    if (this.processing) return;

    // Check if user already has this plan
    if (this.currentSubscription && this.currentSubscription.plan === plan.id) {
      alert('You are already subscribed to this plan!');
      return;
    }

    // If user has a different plan, offer to upgrade/downgrade
    if (this.hasActiveSubscription) {
      const confirmChange = confirm(`You are currently on the ${this.currentSubscription.plan} plan. Do you want to switch to the ${plan.name}?`);
      if (!confirmChange) return;

      this.updateSubscription(plan);
      return;
    }

    // New subscription
    this.createSubscription(plan);
  }

  createSubscription(plan: SubscriptionPlan): void {
    this.processing = true;

    // In a real implementation, you would:
    // 1. Collect payment method using Stripe Elements
    // 2. Create payment method token
    // 3. Send to backend

    // For now, we'll simulate the process
    const paymentMethodId = 'pm_test_' + Date.now(); // This should come from Stripe

    this.subscriptionService.subscribe(plan.id, paymentMethodId).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Subscription created successfully!');
          this.loadCurrentSubscription();
          this.router.navigate(['/main']);
        }
        this.processing = false;
      },
      error: (error) => {
        console.error('Error creating subscription:', error);
        alert('Failed to create subscription. Please try again.');
        this.processing = false;
      }
    });
  }

  updateSubscription(plan: SubscriptionPlan): void {
    this.processing = true;

    this.subscriptionService.updateSubscription(plan.id).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Subscription updated successfully!');
          this.loadCurrentSubscription();
        }
        this.processing = false;
      },
      error: (error) => {
        console.error('Error updating subscription:', error);
        alert('Failed to update subscription. Please try again.');
        this.processing = false;
      }
    });
  }

  cancelSubscription(): void {
    const confirmCancel = confirm('Are you sure you want to cancel your subscription? You will retain access until the end of your billing period.');
    if (!confirmCancel) return;

    const reason = prompt('Please tell us why you\'re cancelling (optional):') || 'No reason provided';

    this.processing = true;

    this.subscriptionService.cancelSubscription(reason, false).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Subscription cancelled. You will retain access until the end of your billing period.');
          this.loadCurrentSubscription();
        }
        this.processing = false;
      },
      error: (error) => {
        console.error('Error cancelling subscription:', error);
        alert('Failed to cancel subscription. Please try again.');
        this.processing = false;
      }
    });
  }

  isCurrentPlan(planId: string): boolean {
    return this.currentSubscription && this.currentSubscription.plan === planId;
  }

  getButtonText(plan: SubscriptionPlan): string {
    if (this.processing) return 'Processing...';
    if (this.isCurrentPlan(plan.id)) return 'Current Plan';
    if (this.hasActiveSubscription) return 'Switch Plan';
    return 'Subscribe Now';
  }

  getButtonClass(plan: SubscriptionPlan): string {
    if (this.isCurrentPlan(plan.id)) return 'btn-current';
    return 'btn-subscribe';
  }

  formatPrice(price: number): string {
    return price.toFixed(2);
  }

  calculateMonthlySavings(plan: SubscriptionPlan): number {
    if (plan.id === 'yearly') {
      const monthlyPlan = this.plans.find(p => p.id === 'monthly');
      if (monthlyPlan) {
        const yearlyMonthly = plan.price / 12;
        return monthlyPlan.price - yearlyMonthly;
      }
    }
    return 0;
  }
}
