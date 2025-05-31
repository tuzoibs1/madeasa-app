import { Request, Response, Express } from "express";
import { storage } from "./storage";

// SMS notification service using Twilio
class SMSNotificationService {
  private twilioClient: any = null;
  private isConfigured = false;

  constructor() {
    this.initializeTwilio();
  }

  private initializeTwilio() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && phoneNumber) {
      try {
        const twilio = require('twilio');
        this.twilioClient = twilio(accountSid, authToken);
        this.isConfigured = true;
        console.log("Twilio SMS service initialized successfully");
      } catch (error) {
        console.error("Failed to initialize Twilio:", error);
        this.isConfigured = false;
      }
    } else {
      console.log("Twilio credentials not configured - SMS notifications disabled");
      this.isConfigured = false;
    }
  }

  async sendSMS(to: string, message: string): Promise<boolean> {
    if (!this.isConfigured || !this.twilioClient) {
      console.log("SMS service not configured, skipping notification");
      return false;
    }

    try {
      const result = await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: to
      });
      
      console.log(`SMS sent successfully to ${to}, SID: ${result.sid}`);
      return true;
    } catch (error) {
      console.error(`Failed to send SMS to ${to}:`, error);
      return false;
    }
  }

  // Notification templates
  async notifyParentAboutAbsence(parentPhone: string, studentName: string, date: string) {
    const message = `MadrasaApp Alert: ${studentName} was marked absent on ${date}. Please contact the school if this is unexpected.`;
    return this.sendSMS(parentPhone, message);
  }

  async notifyParentAboutAssignment(parentPhone: string, studentName: string, assignmentTitle: string) {
    const message = `MadrasaApp: New assignment "${assignmentTitle}" has been posted for ${studentName}. Please check the app for details.`;
    return this.sendSMS(parentPhone, message);
  }

  async notifyParentAboutMemorizationProgress(parentPhone: string, studentName: string, progress: string) {
    const message = `MadrasaApp: Great news! ${studentName} has completed memorization of ${progress}. Keep up the excellent work!`;
    return this.sendSMS(parentPhone, message);
  }

  async notifyAboutClassStarting(phone: string, className: string, startTime: string) {
    const message = `MadrasaApp Reminder: Your class "${className}" is starting at ${startTime}. Join now through the app.`;
    return this.sendSMS(phone, message);
  }

  async notifyParentAboutNewLesson(parentPhone: string, studentName: string, lessonTitle: string) {
    const message = `MadrasaApp: New lesson "${lessonTitle}" has been posted for ${studentName}'s class. Check the app for materials and details.`;
    return this.sendSMS(parentPhone, message);
  }
}

// Create singleton instance
export const smsService = new SMSNotificationService();

// Notification preference management
export interface NotificationPreferences {
  userId: number;
  enableAbsenceAlerts: boolean;
  enableAssignmentAlerts: boolean;
  enableProgressAlerts: boolean;
  enableClassReminders: boolean;
  enableLessonAlerts: boolean;
  phoneNumber: string | null;
}

// Helper functions to send notifications based on events
export async function notifyParentsAboutStudentAbsence(studentId: number, date: string) {
  try {
    const parents = await storage.getParentsByStudent(studentId);
    const student = await storage.getUser(studentId);
    
    if (!student) return;

    for (const parent of parents) {
      if (parent.email && parent.email.includes('+')) { // Assuming phone stored in email field temporarily
        await smsService.notifyParentAboutAbsence(parent.email, student.fullName, date);
      }
    }
  } catch (error) {
    console.error("Failed to notify parents about absence:", error);
  }
}

export async function notifyParentsAboutNewAssignment(courseId: number, assignmentTitle: string) {
  try {
    const students = await storage.getStudentsByCourse(courseId);
    
    for (const student of students) {
      const parents = await storage.getParentsByStudent(student.id);
      
      for (const parent of parents) {
        if (parent.email && parent.email.includes('+')) {
          await smsService.notifyParentAboutAssignment(parent.email, student.fullName, assignmentTitle);
        }
      }
    }
  } catch (error) {
    console.error("Failed to notify parents about assignment:", error);
  }
}

export async function notifyParentsAboutMemorizationProgress(studentId: number, progress: string) {
  try {
    const parents = await storage.getParentsByStudent(studentId);
    const student = await storage.getUser(studentId);
    
    if (!student) return;

    for (const parent of parents) {
      if (parent.email && parent.email.includes('+')) {
        await smsService.notifyParentAboutMemorizationProgress(parent.email, student.fullName, progress);
      }
    }
  } catch (error) {
    console.error("Failed to notify parents about memorization progress:", error);
  }
}

// API routes for notification management
export function setupNotificationRoutes(app: Express) {
  // Test SMS endpoint (for development)
  app.post("/api/notifications/test-sms", async (req: Request, res: Response) => {
    const { phoneNumber, message } = req.body;
    
    if (!phoneNumber || !message) {
      return res.status(400).json({ error: "Phone number and message are required" });
    }

    const success = await smsService.sendSMS(phoneNumber, message);
    
    if (success) {
      res.json({ success: true, message: "SMS sent successfully" });
    } else {
      res.status(500).json({ error: "Failed to send SMS" });
    }
  });

  // Endpoint to manually trigger absence notification
  app.post("/api/notifications/absence", async (req: Request, res: Response) => {
    const { studentId, date } = req.body;
    
    try {
      await notifyParentsAboutStudentAbsence(studentId, date);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to send notifications" });
    }
  });

  // Get notification service status
  app.get("/api/notifications/status", (req: Request, res: Response) => {
    const isConfigured = process.env.TWILIO_ACCOUNT_SID && 
                        process.env.TWILIO_AUTH_TOKEN && 
                        process.env.TWILIO_PHONE_NUMBER;
    
    res.json({
      smsEnabled: !!isConfigured,
      twilioConfigured: !!isConfigured
    });
  });
}