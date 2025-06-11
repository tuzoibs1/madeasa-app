import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { smsService } from "./notifications";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";

// Weekly Progress Report Interface
interface WeeklyProgressReport {
  studentId: number;
  studentName: string;
  weekStart: string;
  weekEnd: string;
  attendance: {
    totalClasses: number;
    attended: number;
    percentage: number;
  };
  memorization: {
    versesMemorized: number;
    surahasCompleted: string[];
    currentProgress: string;
  };
  assignments: {
    completed: number;
    pending: number;
    averageGrade: number;
  };
  teacherNotes: string[];
  recommendations: string[];
}

// Parent-Teacher Conference Interface
interface ConferenceRequest {
  parentId: number;
  studentId: number;
  teacherId: number;
  preferredTimes: string[];
  topics: string[];
  urgencyLevel: 'low' | 'medium' | 'high';
  message?: string;
}

interface ScheduledConference {
  id: number;
  parentId: number;
  studentId: number;
  teacherId: number;
  scheduledTime: Date;
  duration: number; // minutes
  meetingLink?: string;
  topics: string[];
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  createdAt: Date;
}

class ParentEngagementService {
  // Generate Weekly Progress Report
  async generateWeeklyReport(studentId: number, weekOffset: number = 0): Promise<WeeklyProgressReport> {
    const student = await storage.getUser(studentId);
    if (!student) throw new Error("Student not found");

    const now = new Date();
    const weekStart = startOfWeek(subWeeks(now, weekOffset));
    const weekEnd = endOfWeek(subWeeks(now, weekOffset));

    // Get attendance data for the week
    const attendanceRecords = await storage.getAttendanceByStudent(studentId);
    const weekAttendance = attendanceRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= weekStart && recordDate <= weekEnd;
    });

    const attendanceStats = {
      totalClasses: weekAttendance.length,
      attended: weekAttendance.filter(r => r.status === 'present').length,
      percentage: weekAttendance.length > 0 
        ? Math.round((weekAttendance.filter(r => r.status === 'present').length / weekAttendance.length) * 100)
        : 0
    };

    // Get memorization progress
    const memorizations = await storage.getMemorizationByStudent(studentId);
    const recentMemorizations = memorizations.filter(m => {
      const completionDate = m.completionDate ? new Date(m.completionDate) : null;
      return completionDate && completionDate >= weekStart && completionDate <= weekEnd;
    });

    const memorizationStats = {
      versesMemorized: recentMemorizations.reduce((total, m) => total + (m.versesMemorized || 0), 0),
      surahasCompleted: recentMemorizations.filter(m => m.isCompleted).map(m => m.surah),
      currentProgress: memorizations
        .filter(m => !m.isCompleted)
        .map(m => `${m.surah}: ${m.progress}%`)
        .join(', ') || 'No active memorization'
    };

    // Get assignment data
    const submissions = await storage.getSubmissionsByStudent(studentId);
    const weekSubmissions = submissions.filter(s => {
      const submissionDate = s.submittedAt ? new Date(s.submittedAt) : null;
      return submissionDate && submissionDate >= weekStart && submissionDate <= weekEnd;
    });

    const assignmentStats = {
      completed: weekSubmissions.filter(s => s.status === 'submitted' || s.status === 'graded').length,
      pending: weekSubmissions.filter(s => s.status === 'pending').length,
      averageGrade: weekSubmissions.length > 0
        ? Math.round(weekSubmissions.reduce((sum, s) => sum + (s.grade || 0), 0) / weekSubmissions.length)
        : 0
    };

    // Generate teacher notes and recommendations
    const teacherNotes = [
      attendanceStats.percentage >= 90 ? "Excellent attendance this week!" : 
      attendanceStats.percentage >= 70 ? "Good attendance, keep it up!" : "Please improve attendance",
      
      memorizationStats.versesMemorized > 0 ? 
        `Memorized ${memorizationStats.versesMemorized} verses this week` : 
        "Focus on daily memorization practice",
      
      assignmentStats.averageGrade >= 85 ? "Outstanding academic performance" :
      assignmentStats.averageGrade >= 70 ? "Good progress on assignments" : "Needs more focus on homework"
    ];

    const recommendations = [
      "Continue daily Quran recitation (15-20 minutes)",
      "Practice Arabic pronunciation with family",
      attendanceStats.percentage < 80 ? "Prioritize regular class attendance" : "Maintain excellent attendance",
      memorizationStats.versesMemorized === 0 ? "Start with shorter surahs for memorization" : "Continue current memorization schedule"
    ];

    return {
      studentId,
      studentName: student.fullName,
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      attendance: attendanceStats,
      memorization: memorizationStats,
      assignments: assignmentStats,
      teacherNotes,
      recommendations
    };
  }

  // Send Weekly Report via SMS/Email
  async sendWeeklyReport(studentId: number, parentPhone: string): Promise<boolean> {
    try {
      const report = await this.generateWeeklyReport(studentId);
      
      const message = `📚 Weekly Progress for ${report.studentName}
📅 ${report.weekStart} to ${report.weekEnd}

✅ Attendance: ${report.attendance.percentage}% (${report.attendance.attended}/${report.attendance.totalClasses} classes)
📖 Memorization: ${report.memorization.versesMemorized} verses this week
📝 Assignments: ${report.assignments.completed} completed, avg grade: ${report.assignments.averageGrade}%

💡 Recommendation: ${report.recommendations[0]}

View full report in the app: /parent/reports`;

      return await smsService.sendSMS(parentPhone, message);
    } catch (error) {
      console.error('Failed to send weekly report:', error);
      return false;
    }
  }

  // Schedule Parent-Teacher Conference
  async requestConference(request: ConferenceRequest): Promise<{ success: boolean; conferenceId?: number; message: string }> {
    try {
      // In a real implementation, this would integrate with a calendar system
      // For now, we'll simulate the scheduling process
      
      const student = await storage.getUser(request.studentId);
      const teacher = await storage.getUser(request.teacherId);
      const parent = await storage.getUser(request.parentId);

      if (!student || !teacher || !parent) {
        return { success: false, message: "Invalid user IDs provided" };
      }

      // Generate a mock conference ID and schedule
      const conferenceId = Math.floor(Math.random() * 10000);
      const scheduledTime = new Date(request.preferredTimes[0]); // Use first preferred time

      // In a real system, this would be stored in a conferences table
      const conferenceData = {
        id: conferenceId,
        parentId: request.parentId,
        studentId: request.studentId,
        teacherId: request.teacherId,
        scheduledTime,
        duration: 30,
        meetingLink: `https://meet.madrasaapp.com/conference/${conferenceId}`,
        topics: request.topics,
        status: 'scheduled' as const,
        createdAt: new Date()
      };

      // Send confirmation SMS to parent
      const confirmationMessage = `🎓 Conference Scheduled!

📅 Date: ${format(scheduledTime, 'MMMM do, yyyy')}
🕐 Time: ${format(scheduledTime, 'h:mm a')}
👨‍🏫 Teacher: ${teacher.fullName}
👨‍💼 Student: ${student.fullName}

Topics: ${request.topics.join(', ')}

Meeting Link: ${conferenceData.meetingLink}

You'll receive a reminder 1 hour before the meeting.`;

      await smsService.sendSMS(parent.email, confirmationMessage); // Assuming email field has phone

      return {
        success: true,
        conferenceId,
        message: "Conference scheduled successfully. You'll receive SMS confirmations."
      };
    } catch (error) {
      console.error('Failed to schedule conference:', error);
      return { success: false, message: "Failed to schedule conference. Please try again." };
    }
  }

  // Get Home Practice Guidelines
  async getHomePracticeGuidelines(studentId: number): Promise<string[]> {
    const student = await storage.getUser(studentId);
    const memorizations = await storage.getMemorizationByStudent(studentId);
    const attendanceRate = await this.calculateAttendanceRate(studentId);

    const guidelines = [
      "🕐 **Daily Schedule**",
      "- Morning: 15 minutes Quran recitation after Fajr",
      "- Afternoon: 20 minutes Arabic vocabulary practice",
      "- Evening: 10 minutes memorization review before Maghrib",
      "",
      "📖 **Current Focus Areas**"
    ];

    // Add personalized recommendations based on student progress
    if (memorizations.length > 0) {
      const activeMemorization = memorizations.find(m => !m.isCompleted);
      if (activeMemorization) {
        guidelines.push(`- Continue memorizing ${activeMemorization.surah} (${activeMemorization.progress}% complete)`);
        guidelines.push("- Practice with family member daily");
        guidelines.push("- Record recitation for self-assessment");
      }
    }

    if (attendanceRate < 80) {
      guidelines.push("- Prioritize regular class attendance");
      guidelines.push("- Review missed lessons at home");
    }

    guidelines.push("", "🤲 **Spiritual Development**");
    guidelines.push("- Practice the 5 daily prayers together");
    guidelines.push("- Read Islamic stories before bedtime");
    guidelines.push("- Discuss Islamic values during family time");
    guidelines.push("", "📱 **Using the App**");
    guidelines.push("- Check daily assignments in the evening");
    guidelines.push("- Review progress with your child weekly");
    guidelines.push("- Contact teachers through the app for questions");

    return guidelines;
  }

  private async calculateAttendanceRate(studentId: number): Promise<number> {
    const attendanceRecords = await storage.getAttendanceByStudent(studentId);
    if (attendanceRecords.length === 0) return 0;
    
    const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
    return Math.round((presentCount / attendanceRecords.length) * 100);
  }
}

const parentEngagementService = new ParentEngagementService();

// API Routes for Parent Engagement
export function setupParentEngagementRoutes(app: Express) {
  // Get weekly progress report
  app.get("/api/parents/:parentId/students/:studentId/weekly-report", async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const weekOffset = parseInt(req.query.week as string) || 0;
      
      const report = await parentEngagementService.generateWeeklyReport(parseInt(studentId), weekOffset);
      res.json({ success: true, report });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate weekly report" });
    }
  });

  // Send weekly report via SMS
  app.post("/api/parents/:parentId/students/:studentId/send-report", async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const { phoneNumber } = req.body;
      
      const success = await parentEngagementService.sendWeeklyReport(parseInt(studentId), phoneNumber);
      
      if (success) {
        res.json({ success: true, message: "Weekly report sent successfully" });
      } else {
        res.status(500).json({ error: "Failed to send report" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to send weekly report" });
    }
  });

  // Request parent-teacher conference
  app.post("/api/conferences/request", async (req: Request, res: Response) => {
    try {
      const conferenceRequest: ConferenceRequest = req.body;
      const result = await parentEngagementService.requestConference(conferenceRequest);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to request conference" });
    }
  });

  // Get home practice guidelines
  app.get("/api/parents/:parentId/students/:studentId/home-practice", async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      const guidelines = await parentEngagementService.getHomePracticeGuidelines(parseInt(studentId));
      res.json({ success: true, guidelines });
    } catch (error) {
      res.status(500).json({ error: "Failed to get practice guidelines" });
    }
  });

  // Get available conference time slots
  app.get("/api/conferences/available-slots", async (req: Request, res: Response) => {
    try {
      const { teacherId, date } = req.query;
      
      // Mock available time slots for demonstration
      const availableSlots = [
        "09:00 AM - 09:30 AM",
        "10:00 AM - 10:30 AM",
        "02:00 PM - 02:30 PM",
        "03:00 PM - 03:30 PM",
        "04:00 PM - 04:30 PM"
      ];
      
      res.json({ success: true, availableSlots });
    } catch (error) {
      res.status(500).json({ error: "Failed to get available slots" });
    }
  });
}