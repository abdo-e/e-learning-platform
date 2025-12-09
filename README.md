# 🎓 E-Learning Platform

A comprehensive e-learning platform built with Angular and Node.js, featuring subscription management, instructor dashboards, corporate training, and advanced course management.

![Angular](https://img.shields.io/badge/Angular-16.2-red?logo=angular)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen?logo=mongodb)
![License](https://img.shields.io/badge/License-ISC-blue)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Documentation](#-api-documentation)
- [User Roles](#-user-roles)
- [Known Issues](#-known-issues)
- [Future Work](#-future-work)
- [Contributing](#-contributing)

## ✨ Features

### For Students
- 📚 **Course Marketplace** - Browse and purchase courses with subscription plans
- 🎥 **Video Learning** - Stream course videos with progress tracking
- 📊 **Personal Dashboard** - Track learning progress and completed courses
- ⭐ **Course Ratings** - Rate and review completed courses
- 🏆 **Certificates** - Generate PDF certificates upon course completion
- 👤 **Profile Management** - Update personal information and preferences
- 💳 **Subscription Management** - Flexible subscription plans (Free, Basic, Premium, Enterprise)
- 🔖 **Bookmarks & Wishlist** - Save favorite courses for later
- 🔥 **Learning Streaks** - Track daily learning habits

### For Instructors
- 📝 **Instructor Dashboard** - Dedicated dashboard for course creators
- 📈 **Course Analytics** - Track student enrollment and progress
- 💰 **Revenue Tracking** - Monitor earnings from course sales
- 🎓 **Course Creation** - Create and manage your own courses
- 👥 **Student Management** - View and interact with enrolled students

### For Corporate Admins
- 🏢 **Corporate Dashboard** - Modern, animated dashboard for company training
- 👥 **Employee Management** - Add and manage company employees
- 📚 **Course Assignment** - Assign mandatory courses to employees/departments
- 📊 **Compliance Reports** - Download PDF/CSV compliance reports
- 🔍 **Search & Filter** - Find employees and departments easily
- 📈 **Training Analytics** - Track employee progress and completion rates

### For Administrators
- 📈 **Analytics Dashboard** - View platform statistics with Chart.js visualizations
- 👥 **User Management** - Manage student, instructor, and corporate accounts
- 📝 **Course Management** - Create, update, and delete courses
- 🎬 **Video Management** - Upload and organize course videos
- 💳 **Subscription Management** - Manage subscription plans and pricing
- 🏢 **Company Approvals** - Approve or reject corporate registration requests

### Platform Features
- 🔐 **Secure Authentication** - JWT-based authentication with bcrypt password hashing
- 🎨 **Modern UI** - Responsive design with Tailwind CSS and smooth animations
- 📱 **Mobile Friendly** - Fully responsive across all devices
- 🔍 **Advanced Search** - Find courses with filtering by category, difficulty, and price
- 💾 **Progress Persistence** - Automatic saving of course progress
- 🌙 **Dark Mode** - Toggle between light and dark themes
- 🔔 **Notifications** - Real-time notifications for course updates
- 💳 **Payment Integration** - Secure payment processing for subscriptions

## 🛠 Tech Stack

### Frontend
- **Framework**: Angular 16.2
- **Styling**: Tailwind CSS, CSS3
- **Charts**: Chart.js with ng2-charts
- **HTTP Client**: Angular HttpClient with RxJS
- **Routing**: Angular Router with AuthGuard
- **Animations**: Custom CSS animations and transitions

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **File Upload**: Multer
- **PDF Generation**: PDFKit
- **Environment**: dotenv
- **Middleware**: Custom auth, role-based access control

## 📁 Project Structure

```
e-learning-platform/
├── coficab/                          # Angular Frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── accueil/              # Home page
│   │   │   ├── login/                # Login component
│   │   │   ├── signup/               # Registration component
│   │   │   ├── main/                 # Main user interface
│   │   │   ├── admin-main/           # Admin dashboard
│   │   │   ├── user-dashboard/       # Student dashboard
│   │   │   ├── instructor-dashboard/ # Instructor dashboard
│   │   │   ├── corporate-dashboard/  # Corporate admin dashboard
│   │   │   ├── add-employee/         # Add employee form
│   │   │   ├── assign-course/        # Course assignment form
│   │   │   ├── marketplace/          # Course marketplace
│   │   │   ├── subscription-plans/   # Subscription plans page
│   │   │   ├── course-details/       # Course detail view
│   │   │   ├── add-course/           # Course creation
│   │   │   ├── manage-courses/       # Course management
│   │   │   ├── manage-users/         # User management
│   │   │   ├── profile/              # User profile
│   │   │   ├── guards/               # Route guards (AuthGuard)
│   │   │   ├── interceptors/         # HTTP interceptors (AuthInterceptor)
│   │   │   ├── services/             # API services
│   │   │   └── models/               # TypeScript interfaces
│   │   └── assets/                   # Static assets
│   └── package.json
│
└── server/                            # Node.js Backend
    ├── config/                        # Database configuration
    ├── controllers/                   # Business logic
    │   ├── auth.controller.js         # Authentication logic
    │   ├── user.controller.js         # User management
    │   ├── course.controller.js       # Course operations
    │   ├── subscription.controller.js # Subscription management
    │   ├── payment.controller.js      # Payment processing
    │   ├── instructor.controller.js   # Instructor features
    │   ├── corporate.controller.js    # Corporate features
    │   └── analytics.controller.js    # Analytics data
    ├── models/                        # Mongoose schemas
    │   ├── user.model.js
    │   ├── course.model.js
    │   ├── subscription.model.js
    │   ├── payment.model.js
    │   ├── company.model.js
    │   └── ...
    ├── routes/                        # API routes
    │   ├── auth.routes.js
    │   ├── subscription.routes.js
    │   ├── payment.routes.js
    │   ├── instructor.routes.js
    │   ├── corporate.routes.js
    │   └── index.js
    ├── middleware/                    # Custom middleware
    │   ├── auth.js                    # JWT verification
    │   ├── role.middleware.js         # Role-based access
    │   └── subscription.middleware.js # Subscription checks
    ├── uploads/                       # File uploads directory
    └── index.js                       # Entry point
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (v8 or higher) - Comes with Node.js
- **MongoDB** (v5 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **Angular CLI** (v16.2) - Install with `npm install -g @angular/cli`

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/e-learning-platform.git
cd e-learning-platform
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

Required packages:
- express
- mongoose
- bcryptjs
- jsonwebtoken
- dotenv
- multer
- pdfkit
- cors

### 3. Install Frontend Dependencies

```bash
cd ../coficab
npm install
```

## ⚙️ Configuration

### Backend Configuration

1. Create a `.env` file in the `server` directory:

```bash
cd server
cp .env.example .env
```

2. Edit the `.env` file with your configuration:

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/elearning_db

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
JWT_EXPIRE=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:4200

# File Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880
```

### Database Setup

1. Start MongoDB:

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

2. The database will be created automatically on first run.

3. Create initial admin and corporate users (optional):

```bash
# Run the setup scripts
node setup-corporate-admin.js your-email@example.com
```

## 🏃 Running the Application

### Development Mode

#### Start the Backend Server

```bash
cd server
npm start
```

The server will start on `http://localhost:8000`

#### Start the Frontend Application

Open a new terminal:

```bash
cd coficab
npm start
```

The Angular app will start on `http://localhost:4200`

### Production Mode

#### Build the Frontend

```bash
cd coficab
npm run build
```

#### Start the Backend

```bash
cd server
NODE_ENV=production npm start
```

## 📡 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user (returns JWT token) |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | Get all users (Admin) |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user profile |
| DELETE | `/api/users/:id` | Delete user (Admin) |

### Course Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | Get all courses |
| GET | `/api/courses/:id` | Get course by ID |
| POST | `/api/courses` | Create new course (Admin/Instructor) |
| PUT | `/api/courses/:id` | Update course (Admin/Instructor) |
| DELETE | `/api/courses/:id` | Delete course (Admin) |

### Subscription Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subscriptions/plans` | Get all subscription plans |
| POST | `/api/subscriptions/subscribe` | Subscribe to a plan |
| GET | `/api/subscriptions/my-subscription` | Get current subscription |
| POST | `/api/subscriptions/cancel` | Cancel subscription |

### Instructor Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/instructor/dashboard` | Get instructor dashboard data |
| GET | `/api/instructor/courses` | Get instructor's courses |
| GET | `/api/instructor/earnings` | Get earnings data |

### Corporate Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/corporate/companies` | Create company |
| GET | `/api/corporate/dashboard` | Get corporate dashboard |
| POST | `/api/corporate/employees` | Add employee |
| POST | `/api/corporate/assign-course` | Assign course to employees |
| GET | `/api/corporate/compliance-report` | Download compliance report (PDF/CSV) |

## 👥 User Roles

### Student (Default)
- Browse and purchase courses
- Watch course videos
- Track learning progress
- Manage subscriptions
- Rate and review courses
- Generate completion certificates

### Instructor
- All student permissions
- Create and manage own courses
- View course analytics
- Track earnings
- Manage enrolled students

### Corporate Admin
- Manage company employees
- Assign mandatory courses
- Track employee progress
- Download compliance reports
- View training analytics

### Administrator
- All permissions
- Manage all users and courses
- Approve corporate registrations
- View platform analytics
- Manage subscription plans

## 🐛 Known Issues

### PDF Download
- **Issue**: PDF compliance reports may not download properly in some browsers
- **Workaround**: Try using Chrome or Edge, or refresh the page and try again
- **Status**: Under investigation - streaming implementation needs testing

### Search Functionality
- **Issue**: Search filters for departments and employees in assign course page need more testing
- **Status**: Basic functionality implemented, needs UX improvements

### Mobile Responsiveness
- **Issue**: Some dashboard components may not be fully optimized for mobile devices
- **Status**: Needs responsive design improvements for smaller screens

## 🚧 Future Work

### High Priority
1. **Complete PDF Download Fix**
   - Test PDF streaming across different browsers
   - Add error handling and retry logic
   - Implement progress indicators for large reports

2. **Payment Integration**
   - Integrate Stripe or PayPal for subscription payments
   - Add payment history and invoicing
   - Implement refund functionality

3. **Email Notifications**
   - Set up email service (SendGrid/Mailgun)
   - Send course assignment notifications
   - Send subscription renewal reminders
   - Welcome emails for new users

### Medium Priority
4. **Advanced Analytics**
   - Add more detailed charts and graphs
   - Implement real-time analytics
   - Add export functionality for all reports

5. **Course Content Enhancement**
   - Add quiz functionality
   - Implement assignments and submissions
   - Add discussion forums for courses

6. **Mobile App**
   - Develop native mobile apps (iOS/Android)
   - Implement offline course viewing
   - Add push notifications

### Low Priority
7. **Social Features**
   - Add user profiles with social links
   - Implement course sharing
   - Add student-to-student messaging

8. **Gamification**
   - Add badges and achievements
   - Implement leaderboards
   - Add points system

9. **Internationalization**
   - Add multi-language support
   - Implement RTL support for Arabic
   - Add currency conversion

### Technical Improvements
- Add comprehensive unit and integration tests
- Implement CI/CD pipeline
- Add Docker containerization
- Improve error logging and monitoring
- Optimize database queries and indexing
- Add caching layer (Redis)
- Implement rate limiting
- Add API documentation with Swagger

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Coficab E-Learning Team**

## 🙏 Acknowledgments

- Angular team for the amazing framework
- MongoDB for the flexible database solution
- Tailwind CSS for the beautiful styling system
- All contributors who have helped improve this platform

---

**Happy Learning! 🎓**
