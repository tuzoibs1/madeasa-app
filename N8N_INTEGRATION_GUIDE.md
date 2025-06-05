# MadrasaApp + n8n Integration Guide

## Overview
MadrasaApp now supports automatic webhook notifications to n8n for attendance tracking, course creation, assignment updates, and memorization progress.

## Setup Instructions

### 1. Environment Variables Required
Add these to your Replit Secrets:

```
N8N_WEBHOOK_URL=https://your-n8n-domain.com/webhook/madrasa-attendance
N8N_API_KEY=mySuperSecretApiKey123!
```

### 2. n8n Webhook Configuration
In your n8n workflow:

**Webhook Node Settings:**
- HTTP Method: `POST`
- Path: `madrasa-attendance`
- Authentication: `Header Auth`
- Header Name: `x-api-key`
- Header Value: `mySuperSecretApiKey123!`
- IP Whitelist: `34.134.149.95` (Your Replit server IP)

### 3. Webhook Events Supported

#### Attendance Events
```json
{
  "event": "attendance_recorded",
  "data": {
    "student": "Ahmed Hassan",
    "course": "Quran Memorization Level 1",
    "status": "absent",
    "date": "2024-06-04T15:30:00.000Z"
  },
  "timestamp": "2024-06-04T15:30:00.000Z",
  "source": "madrasaapp"
}
```

#### Course Creation Events
```json
{
  "event": "course_created",
  "data": {
    "course": "Advanced Arabic Grammar",
    "teacher": "Dr. Fatima Al-Zahra",
    "startDate": "2024-06-10T09:00:00.000Z"
  },
  "timestamp": "2024-06-04T15:30:00.000Z",
  "source": "madrasaapp"
}
```

#### Assignment Events
```json
{
  "event": "assignment_update",
  "data": {
    "student": "Aisha Mohammed",
    "assignment": "Surah Al-Fatiha Recitation",
    "course": "Tajweed Fundamentals",
    "action": "submitted"
  },
  "timestamp": "2024-06-04T15:30:00.000Z",
  "source": "madrasaapp"
}
```

#### Memorization Progress Events
```json
{
  "event": "memorization_progress",
  "data": {
    "student": "Omar Abdullah",
    "surah": "Al-Baqarah",
    "progress": 75,
    "course": "Hifz Program Advanced"
  },
  "timestamp": "2024-06-04T15:30:00.000Z",
  "source": "madrasaapp"
}
```

### 4. API Endpoints for Manual Testing

#### Test Webhook Connection
```bash
POST /api/webhook/test
```

#### Manual Attendance Webhook
```bash
POST /api/webhook/attendance
Content-Type: application/json

{
  "studentName": "Ahmad Ali",
  "courseTitle": "Islamic Studies 101",
  "status": "absent",
  "date": "2024-06-04"
}
```

#### Check Webhook Status
```bash
GET /api/webhook/status
```

### 5. Integration Examples

#### Example 1: Parent SMS Notifications
When a student is marked absent, n8n can:
1. Receive the webhook
2. Look up parent contact info
3. Send personalized SMS via Twilio
4. Log the notification in a spreadsheet

#### Example 2: Attendance Reports
Daily attendance webhooks can:
1. Aggregate attendance data
2. Generate daily/weekly reports
3. Send reports to administrators
4. Update external dashboards

#### Example 3: Course Management
New course webhooks can:
1. Create calendar events
2. Send enrollment invitations
3. Set up automated reminders
4. Update student management systems

### 6. Security Notes
- API key authentication prevents unauthorized access
- IP whitelisting adds extra security layer
- All webhook data is validated before sending
- Sensitive student data is handled securely

### 7. Troubleshooting

#### Check Configuration Status
Visit: `https://workspace.tuzoibsa.repl.co/api/webhook/status`

#### Test Connection
Visit: `https://workspace.tuzoibsa.repl.co/api/webhook/test`

#### Common Issues
1. **Webhook not firing**: Check N8N_WEBHOOK_URL and N8N_API_KEY environment variables
2. **Authentication failed**: Verify x-api-key header matches N8N_API_KEY
3. **IP blocked**: Ensure 34.134.149.95 is in n8n IP whitelist

### 8. Next Steps
1. Set up your n8n webhook with the configuration above
2. Add the environment variables to Replit
3. Test the connection using the test endpoints
4. Create your automation workflows in n8n
5. Monitor webhook executions in n8n's execution logs

The integration is now live and will automatically send webhooks for all educational events in MadrasaApp.