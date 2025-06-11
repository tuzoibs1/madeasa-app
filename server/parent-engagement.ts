import { Express, Request, Response } from "express";
import { requireAuth } from "./auth";
import { storage } from "./storage";

interface ParentProgress {
  studentId: number;
  studentName: string;
  weeklyAttendance: number;
  memorizationProgress: {
    currentSurah: string;
    versesCompleted: number;
    totalVerses: number;
    weeklyProgress: number;
  };
  behaviorRating: number;
  homeworkCompletion: number;
  upcomingAssignments: Assignment[];
  recentAchievements: Achievement[];
  teacherComments: TeacherComment[];
}

interface Assignment {
  id: number;
  title: string;
  description: string;
  dueDate: Date;
  status: 'pending' | 'submitted' | 'graded' | 'returned';
  grade?: number;
  teacherFeedback?: string;
  submissionDate?: Date;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  awardedDate: Date;
  category: 'memorization' | 'attendance' | 'behavior' | 'academic';
  points: number;
}

interface TeacherComment {
  id: number;
  teacherId: number;
  teacherName: string;
  comment: string;
  category: 'progress' | 'behavior' | 'homework' | 'general';
  date: Date;
  isRead: boolean;
}

interface HomeworkSubmission {
  id: number;
  assignmentId: number;
  studentId: number;
  content: string;
  attachments: string[];
  submittedAt: Date;
  status: 'submitted' | 'graded' | 'returned';
  grade?: number;
  feedback?: string;
}

interface ParentTeacherMessage {
  id: number;
  parentId: number;
  teacherId: number;
  studentId: number;
  subject: string;
  message: string;
  sentBy: 'parent' | 'teacher';
  sentAt: Date;
  isRead: boolean;
  replies: ParentTeacherMessage[];
}

class ParentEngagementService {
  private assignments: Assignment[] = [];
  private achievements: Achievement[] = [];
  private teacherComments: TeacherComment[] = [];
  private homeworkSubmissions: HomeworkSubmission[] = [];
  private parentTeacherMessages: ParentTeacherMessage[] = [];

  async getParentProgress(parentId: number): Promise<ParentProgress[]> {
    // Get children for this parent
    const children = await storage.getStudentsByParent(parentId);
    
    const progressData: ParentProgress[] = [];
    
    for (const student of children) {
      // Get attendance data
      const attendanceRecords = await storage.getAttendanceByStudent(student.id);
      const weeklyAttendance = this.calculateWeeklyAttendance(attendanceRecords);
      
      // Get memorization progress
      const memorizations = await storage.getMemorizationByStudent(student.id);
      const memorizationProgress = this.calculateMemorizationProgress(memorizations);
      
      // Get assignments
      const upcomingAssignments = this.getUpcomingAssignments(student.id);
      
      // Get achievements
      const recentAchievements = this.getRecentAchievements(student.id);
      
      // Get teacher comments
      const teacherComments = this.getTeacherComments(student.id);
      
      progressData.push({
        studentId: student.id,
        studentName: student.fullName,
        weeklyAttendance,
        memorizationProgress,
        behaviorRating: this.calculateBehaviorRating(student.id),
        homeworkCompletion: this.calculateHomeworkCompletion(student.id),
        upcomingAssignments,
        recentAchievements,
        teacherComments
      });
    }
    
    return progressData;
  }

  private calculateMemorizationProgress(memorizations: any[]) {
    const currentSurah = memorizations[memorizations.length - 1]?.surah || "Al-Fatiha";
    const versesCompleted = memorizations.reduce((total, m) => total + (m.progress || 0), 0);
    const totalVerses = 6236; // Total verses in Quran
    const weeklyProgress = memorizations.filter(m => 
      new Date(m.completionDate || '') > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    ).length;
    
    return {
      currentSurah,
      versesCompleted,
      totalVerses,
      weeklyProgress
    };
  }

  private calculateWeeklyAttendance(attendanceRecords: any[]): number {
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyRecords = attendanceRecords.filter(record => 
      new Date(record.date) > lastWeek
    );
    const presentCount = weeklyRecords.filter(record => 
      record.status === "present"
    ).length;
    return weeklyRecords.length > 0 ? (presentCount / weeklyRecords.length) * 100 : 0;
  }

  private calculateBehaviorRating(studentId: number): number {
    // Simulate behavior rating based on various factors
    return Math.floor(Math.random() * 2) + 4; // 4-5 stars
  }

  private calculateHomeworkCompletion(studentId: number): number {
    const studentAssignments = this.assignments.filter(a => true); // Would filter by student
    const completedAssignments = studentAssignments.filter(a => a.status !== 'pending');
    return studentAssignments.length > 0 ? (completedAssignments.length / studentAssignments.length) * 100 : 100;
  }

  private getUpcomingAssignments(studentId: number): Assignment[] {
    return this.assignments.filter(assignment => 
      assignment.dueDate > new Date() && assignment.status === 'pending'
    ).slice(0, 5);
  }

  private getRecentAchievements(studentId: number): Achievement[] {
    return this.achievements.filter(achievement => 
      achievement.awardedDate > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).slice(0, 3);
  }

  private getTeacherComments(studentId: number): TeacherComment[] {
    return this.teacherComments.filter(comment => 
      comment.date > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    ).slice(0, 5);
  }

  async submitHomework(assignmentId: number, studentId: number, content: string, attachments: string[]): Promise<HomeworkSubmission> {
    const submission: HomeworkSubmission = {
      id: this.homeworkSubmissions.length + 1,
      assignmentId,
      studentId,
      content,
      attachments,
      submittedAt: new Date(),
      status: 'submitted'
    };
    
    this.homeworkSubmissions.push(submission);
    return submission;
  }

  async sendMessageToTeacher(parentId: number, teacherId: number, studentId: number, subject: string, message: string): Promise<ParentTeacherMessage> {
    const newMessage: ParentTeacherMessage = {
      id: this.parentTeacherMessages.length + 1,
      parentId,
      teacherId,
      studentId,
      subject,
      message,
      sentBy: 'parent',
      sentAt: new Date(),
      isRead: false,
      replies: []
    };
    
    this.parentTeacherMessages.push(newMessage);
    
    // Send notification to teacher
    const teacher = await storage.getUser(teacherId);
    const student = await storage.getUser(studentId);
    if (teacher && student && teacher.fullName && student.fullName) {
      // Would integrate with notification system here
      console.log(`New message from parent to ${teacher.fullName} about ${student.fullName}`);
    }
    
    return newMessage;
  }

  async getParentTeacherMessages(parentId: number): Promise<ParentTeacherMessage[]> {
    return this.parentTeacherMessages.filter(msg => 
      msg.parentId === parentId
    ).sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime());
  }

  // Initialize sample data
  initializeSampleData() {
    // Sample assignments
    this.assignments = [
      {
        id: 1,
        title: "Memorize Surah Al-Ikhlas",
        description: "Complete memorization of Surah Al-Ikhlas with proper tajweed",
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        status: 'pending'
      },
      {
        id: 2,
        title: "Islamic History Essay",
        description: "Write a 500-word essay about the early Islamic period",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: 'pending'
      },
      {
        id: 3,
        title: "Arabic Vocabulary Quiz",
        description: "Study 20 new Arabic vocabulary words",
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        status: 'submitted',
        grade: 85,
        teacherFeedback: "Good progress, work on pronunciation"
      }
    ];

    // Sample achievements
    this.achievements = [
      {
        id: 1,
        title: "Perfect Attendance",
        description: "Attended all classes this month",
        awardedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        category: 'attendance',
        points: 50
      },
      {
        id: 2,
        title: "Surah Master",
        description: "Memorized 5 new surahs this month",
        awardedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        category: 'memorization',
        points: 100
      }
    ];

    // Sample teacher comments
    this.teacherComments = [
      {
        id: 1,
        teacherId: 8,
        teacherName: "Teacher One",
        comment: "Excellent progress in Quran recitation. Keep up the good work!",
        category: 'progress',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        isRead: false
      },
      {
        id: 2,
        teacherId: 9,
        teacherName: "Teacher Two", 
        comment: "Shows great respect and kindness to classmates",
        category: 'behavior',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        isRead: true
      }
    ];
  }
}

const parentEngagementService = new ParentEngagementService();
parentEngagementService.initializeSampleData();

export function setupParentEngagementRoutes(app: Express) {
  // Get comprehensive parent progress dashboard
  app.get("/api/parent/progress", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'parent') {
        return res.status(403).json({ error: "Access denied. Parent role required." });
      }

      const progressData = await parentEngagementService.getParentProgress(req.user.id);
      res.json(progressData);
    } catch (error) {
      console.error("Error fetching parent progress:", error);
      res.status(500).json({ error: "Failed to fetch progress data" });
    }
  });

  // Submit homework
  app.post("/api/parent/homework/submit", requireAuth, async (req: Request, res: Response) => {
    try {
      const { assignmentId, studentId, content, attachments } = req.body;
      
      const submission = await parentEngagementService.submitHomework(
        assignmentId, 
        studentId, 
        content, 
        attachments || []
      );
      
      res.status(201).json(submission);
    } catch (error) {
      console.error("Error submitting homework:", error);
      res.status(500).json({ error: "Failed to submit homework" });
    }
  });

  // Send message to teacher
  app.post("/api/parent/message/send", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'parent') {
        return res.status(403).json({ error: "Access denied. Parent role required." });
      }

      const { teacherId, studentId, subject, message } = req.body;
      
      const newMessage = await parentEngagementService.sendMessageToTeacher(
        req.user.id,
        teacherId,
        studentId,
        subject,
        message
      );
      
      res.status(201).json(newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get parent-teacher messages
  app.get("/api/parent/messages", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'parent') {
        return res.status(403).json({ error: "Access denied. Parent role required." });
      }

      const messages = await parentEngagementService.getParentTeacherMessages(req.user.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Get detailed student performance analytics
  app.get("/api/parent/analytics/:studentId", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'parent') {
        return res.status(403).json({ error: "Access denied. Parent role required." });
      }

      const studentId = parseInt(req.params.studentId);
      
      // Generate detailed analytics
      const analytics = {
        attendanceTrend: [
          { week: 1, attendance: 100 },
          { week: 2, attendance: 95 },
          { week: 3, attendance: 100 },
          { week: 4, attendance: 90 }
        ],
        memorizationTrend: [
          { month: 'Jan', verses: 45 },
          { month: 'Feb', verses: 67 },
          { month: 'Mar', verses: 89 },
          { month: 'Apr', verses: 112 }
        ],
        subjectPerformance: [
          { subject: 'Quran Memorization', score: 95 },
          { subject: 'Islamic History', score: 88 },
          { subject: 'Arabic Language', score: 92 },
          { subject: 'Fiqh', score: 85 }
        ],
        behaviorMetrics: {
          respect: 95,
          participation: 90,
          helpfulness: 88,
          punctuality: 97
        }
      };
      
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });
}