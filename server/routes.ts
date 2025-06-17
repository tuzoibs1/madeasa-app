import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupFileUploads } from "./uploads";
import { setupNotificationRoutes, notifyParentsAboutStudentAbsence, notifyParentsAboutNewAssignment, notifyParentsAboutMemorizationProgress } from "./notifications";
import { setupClassroomRoutes } from "./classroom";
import { setupWebhookRoutes, webhookService } from "./webhook-service";
import { setupAnalyticsRoutes } from "./analytics";
import { setupQARoutes } from "./qa-testing";
import { setupCompanyAdminRoutes } from "./company-admin";
import { setupParentEngagementRoutes } from "./parent-engagement";
import { setupCommunityRoutes } from "./community-features";
import { z } from "zod";
import {
  insertAttendanceSchema,
  insertCourseSchema,
  insertEnrollmentSchema,
  insertMemorizationSchema,
  insertEventSchema,
  insertLessonSchema,
  insertParentStudentRelationSchema,
  insertAssignmentSchema,
  insertMaterialSchema
} from "@shared/schema";

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

// Middleware to check user role
const checkRole = (roles: string[]) => {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (roles.includes(req.user?.role)) {
      return next();
    }
    
    res.status(403).json({ error: "Forbidden" });
  };
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);
  
  // Setup file upload functionality
  setupFileUploads(app);
  
  // Setup SMS notification functionality
  setupNotificationRoutes(app);
  
  // Setup live classroom functionality
  setupClassroomRoutes(app);
  
  // Setup n8n webhook functionality
  setupWebhookRoutes(app);
  
  // Setup analytics and reporting functionality
  setupAnalyticsRoutes(app);
  
  // Setup QA testing functionality
  setupQARoutes(app);
  
  // Setup Company Admin functionality
  setupCompanyAdminRoutes(app);
  
  // Setup Parent Engagement functionality
  setupParentEngagementRoutes(app);
  
  // Setup Community features
  setupCommunityRoutes(app);

  // Test endpoint to create sample parent accounts (development only)
  if (process.env.NODE_ENV === 'development') {
    app.post("/api/dev/create-test-parents", checkRole(['director']), async (req, res) => {
      try {
        const { createTestParentAccounts } = await import('./seed-parent-accounts');
        const accounts = await createTestParentAccounts();
        res.json({ 
          success: true, 
          message: "Test parent accounts created",
          accounts: {
            parent1: { username: "parent1", password: "password123" },
            parent2: { username: "parent2", password: "password123" }
          }
        });
      } catch (error) {
        console.error("Error creating test parents:", error);
        res.status(500).json({ error: "Failed to create test parent accounts" });
      }
    });
  }

  // Define API routes
  
  // User Management
  app.get("/api/users", checkRole(['director', 'teacher']), async (req, res) => {
    try {
      const role = req.query.role as string;
      let users;
      if (role) {
        users = await storage.getUsersByRole(role);
      } else {
        users = await storage.getUsersByRole('student'); // Default to students
      }
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", checkRole(['director', 'teacher']), async (req, res) => {
    try {
      const { hashPassword } = await import('./auth');
      const userData = req.body;
      
      // Hash the password before storing
      if (userData.password) {
        userData.password = await hashPassword(userData.password);
      }
      
      const newUser = await storage.createUser(userData);
      
      // Remove password from response
      const { password, ...userResponse } = newUser;
      
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });
  
  // Courses
  app.get("/api/courses", isAuthenticated, async (req, res) => {
    try {
      const courses = await storage.getAllCourses();
      res.json(courses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch courses" });
    }
  });

  app.get("/api/courses/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const course = await storage.getCourse(id);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }
      res.json(course);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch course" });
    }
  });

  app.post("/api/courses", checkRole(['director', 'teacher']), async (req, res) => {
    try {
      const validData = insertCourseSchema.parse(req.body);
      const course = await storage.createCourse(validData);
      
      // Get teacher details for webhook notification
      if (validData.teacherId) {
        const teacher = await storage.getUser(validData.teacherId);
        if (teacher) {
          await webhookService.notifyNewCourse(
            course.name,
            teacher.fullName,
            course.startDate?.toISOString() || new Date().toISOString()
          );
        }
      }
      
      res.status(201).json(course);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create course" });
    }
  });

  // Enrollments
  app.post("/api/enrollments", checkRole(['director', 'teacher']), async (req, res) => {
    try {
      const validData = insertEnrollmentSchema.parse(req.body);
      const enrollment = await storage.createEnrollment(validData);
      res.status(201).json(enrollment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create enrollment" });
    }
  });

  app.get("/api/courses/:courseId/students", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const students = await storage.getStudentsByCourse(courseId);
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:studentId/enrollments", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const enrollments = await storage.getEnrollmentsByStudent(studentId);
      res.json(enrollments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student enrollments" });
    }
  });

  // Attendance
  app.post("/api/attendance", checkRole(['director', 'teacher']), async (req, res) => {
    try {
      const validData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(validData);
      
      // Get student and course details for notifications
      const student = await storage.getUser(validData.studentId);
      const course = await storage.getCourse(validData.courseId);
      
      if (student && course) {
        // Send n8n webhook notification
        const dateString = validData.date 
          ? (typeof validData.date === 'string' ? validData.date : validData.date.toISOString())
          : new Date().toISOString();
        
        await webhookService.notifyAttendance(
          student.fullName, 
          course.name, 
          validData.status as 'present' | 'absent',
          dateString
        );
        
        // Send SMS notification to parents if student is absent
        if (validData.status === 'absent') {
          const currentDate = new Date().toLocaleDateString();
          await notifyParentsAboutStudentAbsence(validData.studentId, currentDate);
        }
      }
      
      res.status(201).json(attendance);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to record attendance" });
    }
  });

  app.get("/api/courses/:courseId/attendance", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const date = req.query.date as string;
      const attendanceRecords = await storage.getAttendanceByCourseAndDate(courseId, date);
      res.json(attendanceRecords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance records" });
    }
  });

  app.get("/api/students/:studentId/attendance", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const attendanceRecords = await storage.getAttendanceByStudent(studentId);
      res.json(attendanceRecords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch attendance records" });
    }
  });

  // Memorization
  app.post("/api/memorization", isAuthenticated, async (req, res) => {
    try {
      const validData = insertMemorizationSchema.parse(req.body);
      const memorization = await storage.createMemorization(validData);
      res.status(201).json(memorization);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to record memorization" });
    }
  });

  app.get("/api/courses/:courseId/memorization", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const memorizations = await storage.getMemorizationByCourse(courseId);
      res.json(memorizations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memorization records" });
    }
  });

  app.get("/api/students/:studentId/memorization", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const memorizations = await storage.getMemorizationByStudent(studentId);
      res.json(memorizations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch memorization records" });
    }
  });

  app.patch("/api/memorization/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updatedMemorization = await storage.updateMemorization(id, req.body);
      res.json(updatedMemorization);
    } catch (error) {
      res.status(500).json({ error: "Failed to update memorization" });
    }
  });

  // Events
  app.post("/api/events", checkRole(['director', 'teacher']), async (req, res) => {
    try {
      const validData = insertEventSchema.parse(req.body);
      const event = await storage.createEvent(validData);
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.get("/api/events", isAuthenticated, async (req, res) => {
    try {
      const events = await storage.getAllEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  // Lessons
  app.post("/api/lessons", checkRole(['director', 'teacher']), async (req, res) => {
    try {
      const validData = insertLessonSchema.parse(req.body);
      const lesson = await storage.createLesson(validData);
      res.status(201).json(lesson);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create lesson" });
    }
  });

  app.get("/api/lessons", isAuthenticated, async (req, res) => {
    try {
      // Enhanced dummy data for lessons showcasing Islamic Studies platform capabilities
      const lessons = [
        {
          id: 1,
          title: "Introduction to Surah Al-Fatiha",
          description: "Comprehensive study of the opening chapter of the Quran, including Arabic pronunciation, translation, and Tafseer.",
          content: "Surah Al-Fatiha is known as 'The Opening' and is recited in every unit of prayer. This lesson covers:\n\n• Arabic text and pronunciation guide\n• Word-by-word translation\n• Classical commentary from Ibn Kathir\n• Spiritual significance and benefits\n• Proper recitation with Tajweed rules\n\nKey Learning Objectives:\n- Master correct pronunciation of each verse\n- Understand the meaning and context\n- Learn the spiritual benefits of regular recitation\n- Apply Tajweed rules for beautiful recitation",
          courseId: 1,
          teacherId: 5,
          scheduledDate: "2025-06-16T09:00:00Z",
          duration: 60,
          materials: ["Quran", "Tafseer Ibn Kathir", "Audio recitation"],
          objectives: [
            "Master pronunciation of Al-Fatiha",
            "Understand verse meanings",
            "Learn spiritual significance",
            "Apply basic Tajweed rules"
          ],
          status: "scheduled",
          createdAt: "2025-06-15T10:00:00Z"
        },
        {
          id: 2,
          title: "Arabic Grammar Fundamentals",
          description: "Essential Arabic grammar concepts for understanding Quranic text and Islamic literature.",
          content: "This foundational lesson introduces core Arabic grammar concepts essential for Islamic studies:\n\n• Noun and verb identification\n• Root letter system (Jidhr)\n• Basic sentence structure\n• Definite and indefinite articles\n• Masculine and feminine forms\n\nPractical Applications:\n- Analyzing simple Quranic verses\n- Understanding prayer supplications\n- Reading basic Islamic texts\n- Building vocabulary systematically\n\nHomework Assignment:\n- Practice identifying nouns and verbs in provided verses\n- Memorize 20 essential Arabic roots\n- Complete grammar exercises in workbook",
          courseId: 1,
          teacherId: 5,
          scheduledDate: "2025-06-17T10:00:00Z",
          duration: 75,
          materials: ["Arabic Grammar Textbook", "Workbook", "Quranic examples"],
          objectives: [
            "Identify Arabic nouns and verbs",
            "Understand root letter system",
            "Construct basic sentences",
            "Read simple Islamic texts"
          ],
          status: "scheduled",
          createdAt: "2025-06-15T11:00:00Z"
        },
        {
          id: 3,
          title: "The Life of Prophet Muhammad (PBUH) - Early Years",
          description: "Detailed study of the Prophet's life from birth to the first revelation, emphasizing moral lessons.",
          content: "This comprehensive lesson explores the early life of Prophet Muhammad (Peace Be Upon Him):\n\n• Birth and childhood in Mecca\n• The trustworthy merchant (Al-Amin)\n• Marriage to Khadijah (RA)\n• The incident of Hira Cave\n• First revelation and its impact\n\nMoral Lessons:\n- Importance of honesty in business\n- Respecting and caring for elders\n- The value of contemplation and reflection\n- Courage in facing life's challenges\n\nInteractive Elements:\n- Timeline creation activity\n- Discussion on applying Prophet's character today\n- Role-playing historical events\n- Reflection journal writing",
          courseId: 1,
          teacherId: 5,
          scheduledDate: "2025-06-18T09:30:00Z",
          duration: 90,
          materials: ["Seerah books", "Historical maps", "Timeline worksheets"],
          objectives: [
            "Learn key events of early life",
            "Extract moral lessons",
            "Understand historical context",
            "Apply teachings to modern life"
          ],
          status: "completed",
          createdAt: "2025-06-15T12:00:00Z"
        },
        {
          id: 4,
          title: "Five Pillars of Islam - Practical Implementation",
          description: "Comprehensive guide to understanding and implementing the Five Pillars in daily life.",
          content: "Deep dive into the Five Pillars of Islam with practical guidance:\n\n1. Shahada (Declaration of Faith)\n   - Understanding the meaning\n   - Conditions and implications\n   - Renewing faith daily\n\n2. Salah (Prayer)\n   - Prayer times and their significance\n   - Proper ablution (Wudu)\n   - Prayer positions and recitations\n\n3. Zakat (Charity)\n   - Calculation methods\n   - Types of wealth subject to Zakat\n   - Distribution priorities\n\n4. Sawm (Fasting)\n   - Ramadan preparation\n   - Spiritual benefits\n   - Exemptions and make-up days\n\n5. Hajj (Pilgrimage)\n   - Rituals and their meanings\n   - Spiritual preparation\n   - Virtual tour of holy sites",
          courseId: 1,
          teacherId: 5,
          scheduledDate: "2025-06-19T14:00:00Z",
          duration: 120,
          materials: ["Islamic jurisprudence books", "Prayer guides", "Zakat calculator"],
          objectives: [
            "Master all five pillars",
            "Implement in daily routine",
            "Understand spiritual significance",
            "Help others learn basics"
          ],
          status: "in_progress",
          createdAt: "2025-06-15T13:00:00Z"
        },
        {
          id: 5,
          title: "Islamic Ethics and Moral Character",
          description: "Building strong moral character based on Islamic teachings and prophetic examples.",
          content: "Character development through Islamic principles:\n\n• Concept of Akhlaq in Islam\n• Beautiful names of Allah and character traits\n• Prophetic examples of good character\n• Dealing with anger and patience\n• Truthfulness and trustworthiness\n• Kindness to parents and elders\n\nPractical Character Building:\n- Daily self-reflection exercises\n- Community service projects\n- Conflict resolution techniques\n- Developing empathy and compassion\n\nCase Studies:\n- How Prophet handled difficult situations\n- Stories of righteous companions\n- Modern examples of good character\n- Personal character development plan",
          courseId: 1,
          teacherId: 5,
          scheduledDate: "2025-06-20T11:00:00Z",
          duration: 80,
          materials: ["Character development workbook", "Hadith collections", "Reflection journals"],
          objectives: [
            "Understand Islamic ethics",
            "Develop good character traits",
            "Apply teachings daily",
            "Become positive role model"
          ],
          status: "scheduled",
          createdAt: "2025-06-15T14:00:00Z"
        },
        {
          id: 6,
          title: "Quran Memorization Techniques",
          description: "Proven methods for effective Quran memorization with retention strategies.",
          content: "Systematic approach to Hifz (Quran memorization):\n\n• Setting realistic memorization goals\n• Daily memorization schedule\n• Revision techniques for retention\n• Using audio aids effectively\n• Understanding before memorizing\n• Creating memory associations\n\nMemorization Strategies:\n- Break verses into meaningful segments\n- Use repetition patterns (5-3-1 method)\n- Connect new verses to previously learned\n- Practice during different times of day\n- Group study and peer review\n\nProgress Tracking:\n- Weekly memorization targets\n- Revision tracking charts\n- Quality assessment rubrics\n- Celebration of milestones\n- Individual progress reports",
          courseId: 1,
          teacherId: 5,
          scheduledDate: "2025-06-21T08:00:00Z",
          duration: 100,
          materials: ["Mushaf", "Audio recordings", "Memorization charts", "Progress trackers"],
          objectives: [
            "Learn effective memorization techniques",
            "Establish daily revision routine",
            "Improve retention rates",
            "Track progress systematically"
          ],
          status: "scheduled",
          createdAt: "2025-06-15T15:00:00Z"
        }
      ];
      
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  app.get("/api/lessons/:id", isAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      
      // Enhanced dummy data for lessons - same as in /api/lessons endpoint
      const allLessons = [
        {
          id: 1,
          title: "Introduction to Surah Al-Fatiha",
          description: "Comprehensive study of the opening chapter of the Quran, including Arabic pronunciation, translation, and Tafseer.",
          content: "Surah Al-Fatiha is known as 'The Opening' and is recited in every unit of prayer. This lesson covers:\n\n• Arabic text and pronunciation guide\n• Word-by-word translation\n• Classical commentary from Ibn Kathir\n• Spiritual significance and benefits\n• Proper recitation with Tajweed rules\n\nKey Learning Objectives:\n- Master correct pronunciation of each verse\n- Understand the meaning and context\n- Learn the spiritual benefits of regular recitation\n- Apply Tajweed rules for beautiful recitation",
          courseId: 1,
          teacherId: 5,
          scheduledDate: "2025-06-16T09:00:00Z",
          duration: 60,
          materials: ["Quran", "Tafseer Ibn Kathir", "Audio recitation"],
          objectives: [
            "Master pronunciation of Al-Fatiha",
            "Understand verse meanings",
            "Learn spiritual significance",
            "Apply basic Tajweed rules"
          ],
          status: "scheduled",
          orderIndex: 1,
          createdAt: "2025-06-15T10:00:00Z"
        },
        {
          id: 2,
          title: "Arabic Grammar Fundamentals",
          description: "Essential Arabic grammar concepts for Quranic understanding and proper recitation.",
          content: "Introduction to Arabic grammar essentials:\n\n• Arabic alphabet and letter forms\n• Vowel marks (Harakat) and their sounds\n• Word structure and root patterns\n• Basic sentence formation\n• Common grammatical terms\n• Connection to Quranic text\n\nPractical Applications:\n- Identify word roots in Quranic verses\n- Understand basic sentence structures\n- Recognize common patterns\n- Improve pronunciation accuracy\n- Build vocabulary systematically",
          courseId: 1,
          teacherId: 5,
          scheduledDate: "2025-06-17T10:00:00Z",
          duration: 75,
          materials: ["Arabic grammar book", "Quranic examples", "Practice worksheets"],
          objectives: [
            "Learn Arabic alphabet",
            "Understand basic grammar rules",
            "Apply rules to Quranic text",
            "Build foundational vocabulary"
          ],
          status: "scheduled",
          orderIndex: 2,
          createdAt: "2025-06-15T11:00:00Z"
        },
        {
          id: 3,
          title: "Hadith Study Methodology",
          description: "Understanding the science of Hadith authentication and classification.",
          content: "Comprehensive introduction to Hadith studies:\n\n• Chain of narration (Isnad) analysis\n• Classification system (Sahih, Hasan, Da'if)\n• Major Hadith collections\n• Authentication principles\n• Contextual understanding\n• Application in daily life\n\nKey Collections Covered:\n- Sahih al-Bukhari\n- Sahih Muslim\n- Sunan Abu Dawood\n- Jami' at-Tirmidhi\n- Sunan an-Nasa'i\n- Sunan Ibn Majah",
          courseId: 1,
          teacherId: 5,
          scheduledDate: "2025-06-18T11:00:00Z",
          duration: 90,
          materials: ["Hadith collections", "Authentication charts", "Reference books"],
          objectives: [
            "Understand Hadith classification",
            "Learn authentication methods",
            "Study major collections",
            "Apply knowledge practically"
          ],
          status: "scheduled",
          orderIndex: 3,
          createdAt: "2025-06-15T12:00:00Z"
        },
        {
          id: 4,
          title: "Tajweed Rules for Beginners",
          description: "Fundamental rules of Quranic recitation with proper pronunciation and melody.",
          content: "Essential Tajweed rules for beautiful Quran recitation:\n\n• Proper articulation points (Makharij)\n• Basic rules of pronunciation\n• Elongation (Madd) rules\n• Stopping and starting rules\n• Nasalization (Ghunnah)\n• Common mistakes to avoid\n\nPractical Exercises:\n- Letter pronunciation drills\n- Verse recitation practice\n- Audio comparison exercises\n- Peer review sessions\n- Individual assessment\n\nProgression Levels:\n- Basic letter sounds\n- Simple words\n- Short verses\n- Complete Surahs\n- Fluent recitation",
          courseId: 1,
          teacherId: 5,
          scheduledDate: "2025-06-19T14:00:00Z",
          duration: 85,
          materials: ["Tajweed guide", "Audio recordings", "Practice sheets", "Mushaf with color coding"],
          objectives: [
            "Master letter pronunciation",
            "Learn basic Tajweed rules",
            "Practice verse recitation",
            "Develop listening skills"
          ],
          status: "scheduled",
          orderIndex: 4,
          createdAt: "2025-06-15T13:00:00Z"
        },
        {
          id: 5,
          title: "Islamic Ethics and Character Building",
          description: "Building strong moral character based on Islamic teachings and prophetic example.",
          content: "Comprehensive character development program:\n\n• Prophetic character traits (Akhlaq)\n• Relationship ethics\n• Social responsibility\n• Personal integrity\n• Community engagement\n• Leadership principles\n\nCharacter Traits Covered:\n- Honesty (Sidq)\n- Justice (Adl)\n- Mercy (Rahma)\n- Patience (Sabr)\n- Gratitude (Shukr)\n- Humility (Tawadu)\n\nPractical Applications:\n- Daily character reflection\n- Community service projects\n- Peer mentoring programs\n- Leadership opportunities\n- Conflict resolution skills",
          courseId: 1,
          teacherId: 5,
          scheduledDate: "2025-06-20T13:00:00Z",
          duration: 95,
          materials: ["Character building workbook", "Prophetic sayings compilation", "Reflection journal"],
          objectives: [
            "Understand prophetic character",
            "Develop personal ethics",
            "Practice social responsibility",
            "Become positive role model"
          ],
          status: "scheduled",
          orderIndex: 5,
          createdAt: "2025-06-15T14:00:00Z"
        },
        {
          id: 6,
          title: "Quran Memorization Techniques",
          description: "Proven methods for effective Quran memorization with retention strategies.",
          content: "Systematic approach to Hifz (Quran memorization):\n\n• Setting realistic memorization goals\n• Daily memorization schedule\n• Revision techniques for retention\n• Using audio aids effectively\n• Understanding before memorizing\n• Creating memory associations\n\nMemorization Strategies:\n- Break verses into meaningful segments\n- Use repetition patterns (5-3-1 method)\n- Connect new verses to previously learned\n- Practice during different times of day\n- Group study and peer review\n\nProgress Tracking:\n- Weekly memorization targets\n- Revision tracking charts\n- Quality assessment rubrics\n- Celebration of milestones\n- Individual progress reports",
          courseId: 1,
          teacherId: 5,
          scheduledDate: "2025-06-21T08:00:00Z",
          duration: 100,
          materials: ["Mushaf", "Audio recordings", "Memorization charts", "Progress trackers"],
          objectives: [
            "Learn effective memorization techniques",
            "Establish daily revision routine",
            "Improve retention rates",
            "Track progress systematically"
          ],
          status: "scheduled",
          orderIndex: 6,
          createdAt: "2025-06-15T15:00:00Z"
        }
      ];

      const lesson = allLessons.find(l => l.id === lessonId);
      
      if (!lesson) {
        return res.status(404).json({ error: "Lesson not found" });
      }
      
      res.json(lesson);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lesson" });
    }
  });

  app.get("/api/courses/:courseId/lessons", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      // Return lessons filtered by course ID
      const lessons = [
        {
          id: 1,
          title: "Introduction to Surah Al-Fatiha",
          description: "Comprehensive study of the opening chapter of the Quran",
          courseId: courseId,
          teacherId: 5,
          scheduledDate: "2025-06-16T09:00:00Z",
          duration: 60,
          status: "scheduled"
        },
        {
          id: 2,
          title: "Arabic Grammar Fundamentals",
          description: "Essential Arabic grammar concepts for Quranic understanding",
          courseId: courseId,
          teacherId: 5,
          scheduledDate: "2025-06-17T10:00:00Z",
          duration: 75,
          status: "scheduled"
        }
      ];
      res.json(lessons);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch lessons" });
    }
  });

  // Dashboard stats
  app.get("/api/stats", checkRole(['director', 'teacher']), async (req, res) => {
    try {
      const totalStudents = await storage.countStudents();
      const totalTeachers = await storage.countTeachers();
      const totalCourses = await storage.countCourses();
      const attendanceRate = await storage.getAttendanceRate();
      
      res.json({
        totalStudents,
        totalTeachers,
        totalCourses,
        attendanceRate
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  app.get("/api/users/role/:role", checkRole(['director']), async (req, res) => {
    try {
      const role = req.params.role;
      const users = await storage.getUsersByRole(role);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Controlled user creation - Only directors can create teachers, students, and parents
  app.post("/api/users/create", checkRole(['director']), async (req, res) => {
    try {
      const { username, password, fullName, role, email } = req.body;
      
      // Validate required fields
      if (!username || !password || !fullName || !role) {
        return res.status(400).json({ 
          error: "Missing required fields",
          details: "Username, password, full name, and role are required"
        });
      }

      // Validate role - directors can create any role except other directors
      const allowedRoles = ['teacher', 'student', 'parent'];
      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          error: "Invalid role",
          details: "Directors can only create teachers, students, and parents"
        });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          error: "Username already exists",
          details: "Please choose a different username"
        });
      }

      // Create user with hashed password
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword(password);
      
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        fullName,
        role,
        email: email || null
      });

      // Remove password from response
      const { password: _, ...userResponse } = newUser;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("User creation error:", error);
      res.status(500).json({
        error: "Failed to create user",
        details: "An error occurred while creating the user account"
      });
    }
  });

  // Teachers can create students and parents for their classes only
  app.post("/api/users/create-student-parent", checkRole(['teacher']), async (req, res) => {
    try {
      const { username, password, fullName, role, email } = req.body;
      
      // Teachers can only create students and parents
      const allowedRoles = ['student', 'parent'];
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({
          error: "Insufficient permissions",
          details: "Teachers can only create student and parent accounts"
        });
      }

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          error: "Username already exists",
          details: "Please choose a different username"
        });
      }

      // Create user with hashed password
      const { hashPassword } = await import('./auth');
      const hashedPassword = await hashPassword(password);
      
      const newUser = await storage.createUser({
        username,
        password: hashedPassword,
        fullName,
        role,
        email: email || null
      });

      // Remove password from response
      const { password: _, ...userResponse } = newUser;
      res.status(201).json(userResponse);
    } catch (error) {
      console.error("User creation error:", error);
      res.status(500).json({
        error: "Failed to create user",
        details: "An error occurred while creating the user account"
      });
    }
  });
  
  // Parent Portal Routes
  
  // Link a parent to a student
  app.post("/api/parent-student-relations", checkRole(['director', 'teacher']), async (req, res) => {
    try {
      const validData = insertParentStudentRelationSchema.parse(req.body);
      const relation = await storage.createParentStudentRelation(validData);
      res.status(201).json(relation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create parent-student relation" });
    }
  });
  
  // Get all students associated with a parent
  app.get("/api/parents/:parentId/students", isAuthenticated, async (req, res) => {
    try {
      // Check if the user is the parent or has permission
      if (req.user?.role !== 'director' && req.user?.role !== 'teacher' && 
          req.user?.id !== parseInt(req.params.parentId)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const parentId = parseInt(req.params.parentId);
      const students = await storage.getStudentsByParent(parentId);
      res.json(students);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch students" });
    }
  });
  
  // Get parents associated with a student
  app.get("/api/students/:studentId/parents", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      // Check permissions - student can see their own parents, teacher/director can see all
      if (req.user?.role === 'student' && req.user?.id !== studentId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const parents = await storage.getParentsByStudent(studentId);
      res.json(parents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch parents" });
    }
  });
  
  // Get comprehensive student progress for parent dashboard
  app.get("/api/parent-portal/student/:studentId/progress", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      // Permission check: must be director, teacher, the student, or a parent of the student
      if (req.user?.role !== 'director' && req.user?.role !== 'teacher' && req.user?.id !== studentId) {
        // Check if the user is a parent of this student
        const parents = await storage.getParentsByStudent(studentId);
        const isParent = parents.some(parent => parent.id === req.user?.id);
        
        if (!isParent) {
          return res.status(403).json({ error: "Forbidden" });
        }
      }
      
      const progressSummary = await storage.getStudentProgressSummary(studentId);
      res.json(progressSummary);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch student progress" });
    }
  });
  
  // Assignments routes
  app.post("/api/assignments", checkRole(['director', 'teacher']), async (req, res) => {
    try {
      const validData = insertAssignmentSchema.parse(req.body);
      const assignment = await storage.createAssignment(validData);
      
      // Send SMS notification to parents about new assignment
      await notifyParentsAboutNewAssignment(validData.courseId, validData.title);
      
      res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create assignment" });
    }
  });

  app.get("/api/courses/:courseId/assignments", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const assignments = await storage.getAssignmentsByCourse(courseId);
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignments" });
    }
  });

  app.get("/api/assignments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = await storage.getAssignment(id);
      if (!assignment) {
        return res.status(404).json({ error: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch assignment" });
    }
  });

  app.get("/api/assignments/:assignmentId/submissions", checkRole(['director', 'teacher']), async (req, res) => {
    try {
      const assignmentId = parseInt(req.params.assignmentId);
      const submissions = await storage.getSubmissionsByAssignment(assignmentId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.get("/api/students/:studentId/submissions", isAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      
      // Students can only view their own submissions
      if (req.user?.role === 'student' && req.user.id !== studentId) {
        return res.status(403).json({ error: "Forbidden" });
      }
      
      const submissions = await storage.getSubmissionsByStudent(studentId);
      res.json(submissions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch submissions" });
    }
  });

  app.post("/api/submissions/:id/grade", checkRole(['director', 'teacher']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { grade, feedback } = req.body;
      
      if (grade === undefined || !feedback) {
        return res.status(400).json({ error: "Grade and feedback are required" });
      }
      
      const updatedSubmission = await storage.updateSubmissionGrade(
        id, 
        grade, 
        feedback, 
        req.user!.id
      );
      
      res.json(updatedSubmission);
    } catch (error) {
      res.status(500).json({ error: "Failed to grade submission" });
    }
  });

  // Materials routes
  app.get("/api/courses/:courseId/materials", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const materials = await storage.getMaterialsByCourse(courseId);
      res.json(materials);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch materials" });
    }
  });

  app.get("/api/materials/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ error: "Material not found" });
      }
      res.json(material);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch material" });
    }
  });
  
  // Password reset functionality
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      
      // In a real application, you would:
      // 1. Check if the email exists in your database
      // 2. Generate a unique token and store it with an expiration time
      // 3. Send an email with the reset link/code
      
      // For demo purposes, we'll just return success
      // This simulates the email being sent successfully
      
      return res.status(200).json({ 
        success: true, 
        message: "If an account with that email exists, a password reset code has been sent." 
      });
    } catch (error) {
      console.error("Password reset request error:", error);
      res.status(500).json({ error: "Failed to process password reset request" });
    }
  });
  
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { email, token, newPassword } = req.body;
      
      if (!email || !token || !newPassword) {
        return res.status(400).json({ 
          error: "Email, reset token, and new password are required" 
        });
      }
      
      // In a real application, you would:
      // 1. Verify the token is valid and not expired
      // 2. Find the user by email
      // 3. Update their password with the new hashed password
      
      // For demo purposes, we'll just return success
      
      return res.status(200).json({ 
        success: true, 
        message: "Password has been successfully reset." 
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
