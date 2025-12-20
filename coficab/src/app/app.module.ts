import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavbarComponent } from './navbar/navbar.component';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { AccueilComponent } from './accueil/accueil.component';
import { AdminNavbarComponent } from './admin-navbar/admin-navbar.component';
import { MainComponent } from './main/main.component';
import { FormsModule } from '@angular/forms';
import { AddCourseComponent } from './add-course/add-course.component';
import { CourseDetailsComponent } from './course-details/course-details.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { AdminMainComponent } from './admin-main/admin-main.component';
import { ManageCoursesComponent } from './manage-courses/manage-courses.component';
import { RatingStarsComponent } from './rating-stars/rating-stars.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { MarketplaceComponent } from './marketplace/marketplace.component';
import { SubscriptionPlansComponent } from './subscription-plans/subscription-plans.component';
import { InstructorDashboardComponent } from './instructor-dashboard/instructor-dashboard.component';
import { CorporateDashboardComponent } from './corporate-dashboard/corporate-dashboard.component';
import { CoursePurchaseComponent } from './course-purchase/course-purchase.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { AddEmployeeComponent } from './add-employee/add-employee.component';
import { AssignCourseComponent } from './assign-course/assign-course.component';
import { InstructorApplicationComponent } from './instructor-application/instructor-application.component';
import { AdminInstructorManagementComponent } from './admin-instructor-management/admin-instructor-management.component';
@NgModule({
  declarations: [
    AppComponent,
    NavbarComponent,
    LoginComponent,
    SignupComponent,
    AccueilComponent,
    AdminNavbarComponent,
    AddCourseComponent,
    CourseDetailsComponent,
    MainComponent,
    ManageUsersComponent,
    AdminMainComponent,
    ManageCoursesComponent,
    RatingStarsComponent,
    UserDashboardComponent,
    ProfileComponent,
    MarketplaceComponent,
    SubscriptionPlansComponent,
    InstructorDashboardComponent,
    CorporateDashboardComponent,
    CoursePurchaseComponent,
    AddEmployeeComponent,
    AssignCourseComponent,
    InstructorApplicationComponent,
    AdminInstructorManagementComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
