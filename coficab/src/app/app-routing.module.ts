import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { MainComponent } from './main/main.component';
import { AddCourseComponent } from './add-course/add-course.component';
import { AccueilComponent } from './accueil/accueil.component';
import { CourseDetailsComponent } from './course-details/course-details.component';
import { ManageUsersComponent } from './manage-users/manage-users.component';
import { AdminMainComponent } from './admin-main/admin-main.component';
import { ManageCoursesComponent } from './manage-courses/manage-courses.component';
import { UserDashboardComponent } from './user-dashboard/user-dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { MarketplaceComponent } from './marketplace/marketplace.component';
import { SubscriptionPlansComponent } from './subscription-plans/subscription-plans.component';
import { InstructorDashboardComponent } from './instructor-dashboard/instructor-dashboard.component';
import { CorporateDashboardComponent } from './corporate-dashboard/corporate-dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { AddEmployeeComponent } from './add-employee/add-employee.component';
import { AssignCourseComponent } from './assign-course/assign-course.component';

const routes: Routes = [
  { path: '', redirectTo: '/acceuil', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'acceuil', component: AccueilComponent },

  // Protected routes (require authentication)
  { path: 'main', component: MainComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: UserDashboardComponent, canActivate: [AuthGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'course/:id', component: CourseDetailsComponent, canActivate: [AuthGuard] },

  // New marketplace and subscription routes
  { path: 'marketplace', component: MarketplaceComponent, canActivate: [AuthGuard] },
  { path: 'subscription-plans', component: SubscriptionPlansComponent, canActivate: [AuthGuard] },
  { path: 'instructor-dashboard', component: InstructorDashboardComponent, canActivate: [AuthGuard] },
  { path: 'corporate-dashboard', component: CorporateDashboardComponent, canActivate: [AuthGuard] },
  { path: 'add-employee', component: AddEmployeeComponent, canActivate: [AuthGuard] },
  { path: 'assign-course', component: AssignCourseComponent, canActivate: [AuthGuard] },

  // Admin routes (require authentication)
  { path: 'add-course', component: AddCourseComponent, canActivate: [AuthGuard] },
  { path: 'admin/add-course', component: AddCourseComponent, canActivate: [AuthGuard] },
  { path: 'manage-users', component: ManageUsersComponent, canActivate: [AuthGuard] },
  { path: 'admin-main', component: AdminMainComponent, canActivate: [AuthGuard] },
  { path: 'manage-courses', component: ManageCoursesComponent, canActivate: [AuthGuard] },
  { path: 'admin/manage-courses', component: ManageCoursesComponent, canActivate: [AuthGuard] }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
