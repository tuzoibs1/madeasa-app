import { Request, Response } from "express";

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  source: string;
}

class N8nWebhookService {
  private webhookUrl: string | null = null;
  private apiKey: string | null = null;
  private isConfigured = false;

  constructor() {
    this.webhookUrl = process.env.N8N_WEBHOOK_URL || null;
    this.apiKey = process.env.N8N_API_KEY || null;
    this.isConfigured = !!(this.webhookUrl && this.apiKey);
    
    if (!this.isConfigured) {
      console.log("n8n webhook not configured - webhook notifications disabled");
      console.log("Set N8N_WEBHOOK_URL and N8N_API_KEY environment variables to enable");
    } else {
      console.log("n8n webhook service configured and ready");
    }
  }

  async sendWebhook(payload: WebhookPayload): Promise<boolean> {
    if (!this.isConfigured) {
      console.log("n8n webhook not configured, skipping notification");
      return false;
    }

    try {
      const response = await fetch(this.webhookUrl!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey!
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        console.log(`n8n webhook sent successfully for event: ${payload.event}`);
        return true;
      } else {
        console.error(`n8n webhook failed with status: ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error("Error sending n8n webhook:", error);
      return false;
    }
  }

  // Attendance notification
  async notifyAttendance(studentName: string, courseTitle: string, status: 'present' | 'absent', date: string) {
    const payload: WebhookPayload = {
      event: 'attendance_recorded',
      data: {
        student: studentName,
        course: courseTitle,
        status: status,
        date: date
      },
      timestamp: new Date().toISOString(),
      source: 'madrasaapp'
    };

    return await this.sendWebhook(payload);
  }

  // Assignment notification
  async notifyAssignment(studentName: string, assignmentTitle: string, courseTitle: string, action: 'assigned' | 'submitted' | 'graded') {
    const payload: WebhookPayload = {
      event: 'assignment_update',
      data: {
        student: studentName,
        assignment: assignmentTitle,
        course: courseTitle,
        action: action
      },
      timestamp: new Date().toISOString(),
      source: 'madrasaapp'
    };

    return await this.sendWebhook(payload);
  }

  // Memorization progress notification
  async notifyMemorizationProgress(studentName: string, surahName: string, progress: number, courseTitle: string) {
    const payload: WebhookPayload = {
      event: 'memorization_progress',
      data: {
        student: studentName,
        surah: surahName,
        progress: progress,
        course: courseTitle
      },
      timestamp: new Date().toISOString(),
      source: 'madrasaapp'
    };

    return await this.sendWebhook(payload);
  }

  // New course notification
  async notifyNewCourse(courseTitle: string, teacherName: string, startDate: string) {
    const payload: WebhookPayload = {
      event: 'course_created',
      data: {
        course: courseTitle,
        teacher: teacherName,
        startDate: startDate
      },
      timestamp: new Date().toISOString(),
      source: 'madrasaapp'
    };

    return await this.sendWebhook(payload);
  }

  // Test webhook
  async testWebhook() {
    const payload: WebhookPayload = {
      event: 'test_connection',
      data: {
        message: 'Test webhook from MadrasaApp',
        appStatus: 'running'
      },
      timestamp: new Date().toISOString(),
      source: 'madrasaapp'
    };

    return await this.sendWebhook(payload);
  }
}

export const webhookService = new N8nWebhookService();

// API routes for webhook management
export function setupWebhookRoutes(app: any) {
  // Test webhook endpoint
  app.post("/api/webhook/test", async (req: Request, res: Response) => {
    try {
      const success = await webhookService.testWebhook();
      
      if (success) {
        res.json({ 
          success: true, 
          message: "Test webhook sent to n8n successfully" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to send test webhook to n8n" 
        });
      }
    } catch (error) {
      console.error("Error testing webhook:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal error testing webhook" 
      });
    }
  });

  // Manual attendance webhook trigger
  app.post("/api/webhook/attendance", async (req: Request, res: Response) => {
    try {
      const { studentName, courseTitle, status, date } = req.body;
      
      if (!studentName || !courseTitle || !status || !date) {
        return res.status(400).json({ 
          error: "Missing required fields: studentName, courseTitle, status, date" 
        });
      }

      const success = await webhookService.notifyAttendance(studentName, courseTitle, status, date);
      
      if (success) {
        res.json({ 
          success: true, 
          message: "Attendance webhook sent to n8n successfully" 
        });
      } else {
        res.status(500).json({ 
          success: false, 
          message: "Failed to send attendance webhook to n8n" 
        });
      }
    } catch (error) {
      console.error("Error sending attendance webhook:", error);
      res.status(500).json({ 
        success: false, 
        message: "Internal error sending attendance webhook" 
      });
    }
  });

  // Webhook configuration status
  app.get("/api/webhook/status", (req: Request, res: Response) => {
    res.json({
      configured: webhookService['isConfigured'],
      webhookUrl: webhookService['webhookUrl'] ? 'configured' : 'not set',
      apiKey: webhookService['apiKey'] ? 'configured' : 'not set'
    });
  });
}