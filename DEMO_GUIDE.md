# Islamic Studies Platform - Demo Guide

## 🔐 Login Credentials

### Parent Accounts
- **Username:** `parent1` | **Password:** `admin123`
  - Full Name: Abdullah Ibn Ahmad
  - Connected to: student1 (Test Student)
  - Phone: +1234567890

- **Username:** `parent2` | **Password:** `admin123`
  - Full Name: Fatima Bint Hassan
  - Connected to: student2
  - Phone: +1987654321

### Other User Roles
- **Company Admin:** `company_admin` | Password: `admin123`
- **Director:** `director1` | Password: `admin123`
- **Teacher:** `teacher1` / `teacher2` | Password: `admin123`
- **Student:** `student1` / `student2` | Password: `admin123`

## 📱 Where to See Updates

### 1. Parent Portal Dashboard
**URL:** `/parent` (after logging in as parent1 or parent2)
- View student progress overview
- Check attendance rates
- Monitor memorization progress
- Review assignments and grades
- Access notification testing interface

### 2. Parent Notification Testing
**URL:** `/parent/notifications` (parent login required)
- Test SMS notification system
- Send assignment alerts
- Trigger class reminders
- Test homework due notifications
- View notification status

### 3. Company Admin Dashboard
**URL:** `/company-admin` (login as company_admin)
- Organization management
- User feedback system
- Analytics overview
- QA testing interface

### 4. QA Testing Suite
**URL:** `/qa` (company admin access)
- Run comprehensive system tests
- View test results (currently 11/12 tests passing)
- Database integrity checks
- Authentication validation

## 🔔 Notification System Features

### Available Notification Types
1. **Assignment Alerts** - New homework/assignments with due dates
2. **Class Reminders** - Upcoming class notifications
3. **Homework Due** - Deadline warnings
4. **Progress Updates** - Memorization and learning progress
5. **Lesson Notifications** - New lesson publications

### Test the Notification System
1. Login as `parent1` or `parent2`
2. Navigate to `/parent/notifications`
3. Use the test buttons to trigger different notification types
4. Check console logs for SMS delivery status

## 📊 Sample Data Available

### Courses
- Quran Memorization (Hifz)
- Islamic History and Seerah
- Arabic Language Fundamentals

### Lessons
- Introduction to Tajweed Rules
- The Life of Prophet Muhammad (PBUH)
- Arabic Alphabet and Pronunciation
- Basic Islamic Etiquette (Adab)

### Scheduled Events
- Daily Quran recitation sessions
- Weekly Islamic history classes
- Arabic language practice sessions
- Monthly progress assessments

## 🧪 API Endpoints for Testing

### Notification APIs
- `POST /api/notifications/test-sms` - Test SMS functionality
- `POST /api/notifications/assignment` - Trigger assignment alerts
- `POST /api/notifications/class-reminder` - Send class reminders
- `POST /api/notifications/homework-due` - Homework deadlines
- `GET /api/notifications/status` - Check system status

### Parent Portal APIs
- `GET /api/parents/{parentId}/students` - Get linked students
- `GET /api/parents/{parentId}/progress/{studentId}` - Student progress
- `GET /api/parents` - Parent information

### QA Testing APIs
- `POST /api/qa/run-tests` - Execute test suite
- `GET /api/qa/test-report` - View test results
- `GET /api/qa/health-check` - System health status

## 🎯 Key Features to Explore

1. **Role-Based Navigation** - Different menu options based on user role
2. **Responsive Design** - Works on desktop, tablet, and mobile
3. **Real-time Updates** - Live data from PostgreSQL database
4. **Comprehensive Analytics** - Student performance tracking
5. **Secure Authentication** - Session-based login system
6. **SMS Integration** - Ready for Twilio integration
7. **QA Testing** - Automated system validation

## 📋 System Status

- **Database:** PostgreSQL (fully configured)
- **Authentication:** Working for all user roles
- **Parent Portal:** Fully functional
- **Notifications:** SMS-ready (needs Twilio credentials for live SMS)
- **QA Tests:** 11/12 passing (91.7% success rate)
- **Navigation:** All warnings fixed, buttons functional

## 🚀 Next Steps

To enable live SMS notifications:
1. Add Twilio credentials to environment variables:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN` 
   - `TWILIO_PHONE_NUMBER`

The system will automatically detect and enable SMS functionality when these are provided.