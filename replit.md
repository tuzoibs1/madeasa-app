# Islamic Studies Learning Platform (MadrasaApp) - Replit Guide

## Overview

MadrasaApp is a comprehensive Islamic Studies Learning Platform designed to provide an educational ecosystem for students, teachers, administrators, and parents. The platform combines traditional Islamic education with modern technology, featuring role-based access control, attendance tracking, Quran memorization progress, assignment management, and parent engagement tools.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite for fast development and optimized builds
- **Mobile Support**: Responsive design with dedicated mobile components

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript for type safety
- **Session Management**: Express-session with PostgreSQL store
- **Authentication**: Passport.js with local strategy and API key support
- **File Uploads**: Express-fileupload middleware

### Database Architecture
- **Primary Database**: PostgreSQL with Neon serverless
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema Management**: Drizzle migrations with shared schema definitions

## Key Components

### User Roles and Access Control
- **Company Admin**: System-wide administration and organization management
- **Director**: Institution-level administration, user creation, analytics
- **Teacher**: Course management, attendance tracking, assignment grading
- **Student**: Course participation, assignment submission, progress tracking
- **Parent**: Child progress monitoring, notification access

### Core Educational Features
1. **Attendance System**: Calendar-based attendance tracking with real-time updates
2. **Quran Memorization Tracker**: Progress tracking with Surah-by-Surah completion
3. **Course Management**: Course creation, enrollment, and material distribution
4. **Assignment System**: Assignment creation, submission, and grading workflow
5. **Lesson Planning**: Structured lesson creation and content management

### Communication and Engagement
- **SMS Notifications**: Twilio integration for parent notifications
- **Webhook Integration**: n8n workflow automation support
- **Parent Portal**: Dedicated interface for parent engagement
- **Real-time Updates**: Live notifications for attendance and progress

### Quality Assurance
- **Comprehensive Testing Suite**: Automated QA testing with 11/12 tests passing
- **Health Monitoring**: System health checks and performance monitoring
- **User Feedback System**: Integrated feedback collection and management

## Data Flow

### Authentication Flow
1. User credentials validated against hashed passwords in database
2. Session established with PostgreSQL session store
3. Role-based routing to appropriate dashboard
4. API endpoints protected with authentication middleware

### Educational Data Flow
1. **Attendance**: Teacher marks attendance → Database update → Parent notification
2. **Memorization**: Student progress recorded → Progress calculation → Achievement tracking
3. **Assignments**: Teacher creates → Student submits → Teacher grades → Results distributed

### Notification Pipeline
1. System events trigger notification functions
2. SMS service sends parent notifications via Twilio
3. Webhook service notifies external n8n workflows
4. Database logs all notification activities

## External Dependencies

### Essential Services
- **Neon PostgreSQL**: Primary database hosting
- **Twilio**: SMS notification service (optional)
- **n8n**: Workflow automation integration (optional)

### Development Dependencies
- **Vite**: Development server and build tool
- **Drizzle Kit**: Database migration management
- **TypeScript**: Type checking and compilation

### UI and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Radix UI**: Headless UI component primitives
- **Lucide React**: Icon library
- **Recharts**: Data visualization components

## Deployment Strategy

### Development Environment
- **Platform**: Replit with PostgreSQL module
- **Hot Reload**: Vite development server with HMR
- **Database**: Local PostgreSQL instance
- **File Storage**: Local uploads directory

### Production Build
- **Build Process**: Vite builds frontend, esbuild bundles backend
- **Server**: Express.js serving static files and API routes
- **Database**: Neon PostgreSQL with connection pooling
- **File Handling**: Persistent uploads directory

### Environment Configuration
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `TWILIO_*`: SMS service credentials (optional)
- `N8N_*`: Webhook integration settings (optional)
- `API_KEY`: External API authentication

## Recent Changes
- June 15, 2025: Fixed 404 error for individual lesson URLs - added missing API endpoint and URL parameter handling for direct lesson access
- June 15, 2025: Fixed "View Profile" button in student directory - added navigation functionality and comprehensive student profile page with detailed information display
- June 15, 2025: Fixed attendance page runtime error - added null checking to prevent undefined name values from causing split() errors
- June 15, 2025: Added "Mark as Unread" functionality to notifications - users can now toggle notification status both ways with proper visual feedback
- June 15, 2025: Fixed "Mark as Read" button functionality in notifications - users can now mark notifications as read with proper state management and visual feedback
- June 15, 2025: Fixed Edit button functionality in Company Admin Dashboard - administrators can now modify organization details through working edit dialog
- June 15, 2025: Added dismissible checkbox to intro guide - users can now permanently hide the onboarding wizard after completing it
- June 15, 2025: Enhanced platform with comprehensive Islamic Studies lesson content showcasing educational capabilities
- June 15, 2025: Fixed profile page tab spacing and notifications button routing for all user roles
- June 15, 2025: Initial platform setup with role-based access control and core educational features

## User Preferences

Preferred communication style: Simple, everyday language.