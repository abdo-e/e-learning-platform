import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PaymentIntent {
    paymentId: string;
    clientSecret?: string;
    amount: number;
    currency: string;
}

export interface Payment {
    _id: string;
    userId: string;
    amount: number;
    currency: string;
    status: string;
    paymentType: string;
    courseId?: string;
    subscriptionId?: string;
    createdAt: Date;
    completedAt?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class PaymentService {
    private apiUrl = 'http://localhost:8000/api/payments';

    constructor(private http: HttpClient) { }

    createCoursePaymentIntent(courseId: string, amount: number, currency: string = 'USD'): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/create-intent`, {
            amount,
            currency,
            paymentType: 'course_purchase',
            courseId
        });
    }

    createSubscriptionPaymentIntent(amount: number, subscriptionPlan: string, currency: string = 'USD'): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/create-intent`, {
            amount,
            currency,
            paymentType: 'subscription',
            subscriptionPlan
        });
    }

    confirmPayment(paymentId: string, stripePaymentIntentId: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/confirm`, {
            paymentId,
            stripePaymentIntentId
        });
    }

    getPaymentHistory(page: number = 1, limit: number = 10, status?: string): Observable<any> {
        let url = `${this.apiUrl}/history?page=${page}&limit=${limit}`;
        if (status) {
            url += `&status=${status}`;
        }
        return this.http.get<any>(url);
    }

    requestRefund(paymentId: string, reason: string, amount?: number): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/refund/${paymentId}`, {
            reason,
            amount
        });
    }

    getAllPayments(page: number = 1, limit: number = 20, status?: string, paymentType?: string): Observable<any> {
        let url = `${this.apiUrl}/all?page=${page}&limit=${limit}`;
        if (status) url += `&status=${status}`;
        if (paymentType) url += `&paymentType=${paymentType}`;
        return this.http.get<any>(url);
    }
}
