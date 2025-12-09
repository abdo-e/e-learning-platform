import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    currency: string;
    interval: string;
    savings?: string;
    features: {
        unlimitedCourses: boolean;
        premiumVideos: boolean;
        offlineMode: boolean;
        certificatePriority: boolean;
        supportPriority: boolean;
    };
}

export interface Subscription {
    _id: string;
    userId: string;
    plan: string;
    status: string;
    amount: number;
    currency: string;
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    cancelAtPeriodEnd: boolean;
    features: any;
}

@Injectable({
    providedIn: 'root'
})
export class SubscriptionService {
    private apiUrl = 'http://localhost:8000/api/subscriptions';
    private subscriptionStatusSubject = new BehaviorSubject<any>(null);
    public subscriptionStatus$ = this.subscriptionStatusSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadSubscriptionStatus();
    }

    getSubscriptionPlans(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/plans`);
    }

    subscribe(plan: string, paymentMethodId: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/subscribe`, {
            plan,
            paymentMethodId
        }).pipe(
            tap(() => this.loadSubscriptionStatus())
        );
    }

    getSubscriptionStatus(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/status`);
    }

    loadSubscriptionStatus(): void {
        this.getSubscriptionStatus().subscribe({
            next: (response) => {
                this.subscriptionStatusSubject.next(response.data);
            },
            error: (error) => {
                console.error('Error loading subscription status:', error);
                this.subscriptionStatusSubject.next(null);
            }
        });
    }

    cancelSubscription(reason: string, immediate: boolean = false): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/cancel`, {
            body: { reason, immediate }
        }).pipe(
            tap(() => this.loadSubscriptionStatus())
        );
    }

    updateSubscription(newPlan: string): Observable<any> {
        return this.http.put<any>(`${this.apiUrl}/update`, {
            newPlan
        }).pipe(
            tap(() => this.loadSubscriptionStatus())
        );
    }

    hasActiveSubscription(): boolean {
        const status = this.subscriptionStatusSubject.value;
        return status && status.hasSubscription && status.isActive;
    }

    hasFeature(featureName: string): boolean {
        const status = this.subscriptionStatusSubject.value;
        return status && status.hasSubscription && status.isActive &&
            status.features && status.features[featureName];
    }

    getAllSubscriptions(page: number = 1, limit: number = 20, status?: string, plan?: string): Observable<any> {
        let url = `${this.apiUrl}/all?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        if (plan) url += `&plan=${plan}`;
        return this.http.get<any>(url);
    }
}
