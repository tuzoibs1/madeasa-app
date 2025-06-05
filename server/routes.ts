import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { setupFileUploads } from "./uploads";
import { setupNotificationRoutes, notifyParentsAboutStudentAbsence, notifyParentsAboutNewAssignment, notifyParentsAboutMemorizationProgress } from "./notifications";
import { setupClassroomRoutes } from "./classroom";
import { setupWebhookRoutes, webhookService } from "./webhook-service";
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

  // Define API routes
  
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

  app.get("/api/courses/:courseId/lessons", isAuthenticated, async (req, res) => {
    try {
      const courseId = parseInt(req.params.courseId);
      const lessons = await storage.getLessonsByCourse(courseId);
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
