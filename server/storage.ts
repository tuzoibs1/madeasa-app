import { 
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  enrollments, type Enrollment, type InsertEnrollment,
  attendanceRecords, type AttendanceRecord, type InsertAttendance,
  memorizations, type Memorization, type InsertMemorization,
  lessons, type Lesson, type InsertLesson,
  events, type Event, type InsertEvent,
  parentStudentRelations, type ParentStudentRelation, type InsertParentStudentRelation,
  materials, type Material, type InsertMaterial,
  assignments, type Assignment, type InsertAssignment,
  submissions, type Submission, type InsertSubmission,
  organizations, type Organization, type InsertOrganization,
  userFeedback, type UserFeedback, type InsertUserFeedback,
  feedbackComments, type FeedbackComment, type InsertFeedbackComment,
  organizationLogs, type OrganizationLog, type InsertOrganizationLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

const PostgresStore = connectPgSimple(session);

// Interface for storage operations
export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByRole(role: string): Promise<User[]>;
  countStudents(): Promise<number>;
  countTeachers(): Promise<number>;
  
  // Courses
  getAllCourses(): Promise<Course[]>;
  getCourse(id: number): Promise<Course | undefined>;
  createCourse(course: InsertCourse): Promise<Course>;
  countCourses(): Promise<number>;
  
  // Enrollments
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  getStudentsByCourse(courseId: number): Promise<User[]>;
  getEnrollmentsByStudent(studentId: number): Promise<Enrollment[]>;
  
  // Attendance
  createAttendance(attendance: InsertAttendance): Promise<AttendanceRecord>;
  getAttendanceByCourseAndDate(courseId: number, date: string): Promise<AttendanceRecord[]>;
  getAttendanceByStudent(studentId: number): Promise<AttendanceRecord[]>;
  getAttendanceRate(): Promise<number>;
  
  // Memorization
  createMemorization(memorization: InsertMemorization): Promise<Memorization>;
  getMemorizationByCourse(courseId: number): Promise<Memorization[]>;
  getMemorizationByStudent(studentId: number): Promise<Memorization[]>;
  updateMemorization(id: number, data: Partial<Memorization>): Promise<Memorization>;
  
  // Lessons
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  getLessonsByCourse(courseId: number): Promise<Lesson[]>;
  
  // Events
  createEvent(event: InsertEvent): Promise<Event>;
  getAllEvents(): Promise<Event[]>;
  
  // Parent Portal
  createParentStudentRelation(relation: InsertParentStudentRelation): Promise<ParentStudentRelation>;
  getStudentsByParent(parentId: number): Promise<User[]>;
  getParentsByStudent(studentId: number): Promise<User[]>;
  getParentStudentRelations(parentId: number): Promise<ParentStudentRelation[]>;
  getStudentProgressSummary(studentId: number): Promise<any>; // Comprehensive summary for parent portal
  
  // Materials & Assignments
  createMaterial(material: InsertMaterial): Promise<Material>;
  getMaterialsByCourse(courseId: number): Promise<Material[]>;
  getMaterial(id: number): Promise<Material | undefined>;
  
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getAssignmentsByCourse(courseId: number): Promise<Assignment[]>;
  getAssignment(id: number): Promise<Assignment | undefined>;
  
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: number): Promise<Submission[]>;
  updateSubmissionGrade(id: number, grade: number, feedback: string, gradedBy: number): Promise<Submission>;
  
  // Company Admin - Organization Management
  createOrganization(organization: InsertOrganization): Promise<Organization>;
  getAllOrganizations(): Promise<Organization[]>;
  getOrganization(id: number): Promise<Organization | undefined>;
  updateOrganization(id: number, data: Partial<Organization>): Promise<Organization>;
  getOrganizationUsers(organizationId: number): Promise<User[]>;
  getOrganizationStats(organizationId: number): Promise<any>;
  
  // Company Admin - User Feedback Management
  createUserFeedback(feedback: InsertUserFeedback): Promise<UserFeedback>;
  getAllUserFeedback(filters?: any): Promise<UserFeedback[]>;
  getUserFeedback(id: number): Promise<UserFeedback | undefined>;
  updateUserFeedback(id: number, data: Partial<UserFeedback>): Promise<UserFeedback>;
  getFeedbackByOrganization(organizationId: number): Promise<UserFeedback[]>;
  
  // Company Admin - Feedback Comments
  createFeedbackComment(comment: InsertFeedbackComment): Promise<FeedbackComment>;
  getFeedbackComments(feedbackId: number): Promise<FeedbackComment[]>;
  
  // Company Admin - Organization Logs
  createOrganizationLog(log: InsertOrganizationLog): Promise<OrganizationLog>;
  getOrganizationLogs(organizationId: number, limit?: number): Promise<OrganizationLog[]>;
  
  // Company Admin - System Overview
  getCompanyOverviewStats(): Promise<any>;
  getAllUsersWithOrganizations(): Promise<any[]>;
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresStore({
      pool: pool,
      tableName: 'session',
      createTableIfMissing: true,
      ttl: 86400 // 1 day in seconds
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, role as any));
  }

  async countStudents(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'student' as any));
    return result.count;
  }

  async countTeachers(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'teacher' as any));
    return result.count;
  }

  // Course operations
  async getAllCourses(): Promise<Course[]> {
    return await db.select().from(courses);
  }

  async getCourse(id: number): Promise<Course | undefined> {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const [course] = await db
      .insert(courses)
      .values(insertCourse)
      .returning();
    return course;
  }

  async countCourses(): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(courses);
    return result.count;
  }

  // Enrollment operations
  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const [enrollment] = await db
      .insert(enrollments)
      .values(insertEnrollment)
      .returning();
    return enrollment;
  }

  async getStudentsByCourse(courseId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .innerJoin(enrollments, eq(users.id, enrollments.studentId))
      .where(and(
        eq(enrollments.courseId, courseId),
        eq(users.role, 'student')
      ))
      .then(rows => rows.map(row => row.users));
  }

  // Attendance operations
  async createAttendance(insertAttendance: InsertAttendance): Promise<AttendanceRecord> {
    const [attendance] = await db
      .insert(attendanceRecords)
      .values(insertAttendance)
      .returning();
    return attendance;
  }

  async getAttendanceByCourseAndDate(courseId: number, date: string): Promise<AttendanceRecord[]> {
    return await db
      .select()
      .from(attendanceRecords)
      .where(and(
        eq(attendanceRecords.courseId, courseId),
        sql`DATE(${attendanceRecords.date}) = DATE(${date})`
      ));
  }

  async getAttendanceByStudent(studentId: number): Promise<AttendanceRecord[]> {
    return await db
      .select()
      .from(attendanceRecords)
      .where(eq(attendanceRecords.studentId, studentId))
      .orderBy(desc(attendanceRecords.date));
  }

  async getAttendanceRate(): Promise<number> {
    // Calculate attendance rate for the last 30 days
    const [presentCount] = await db
      .select({ count: count() })
      .from(attendanceRecords)
      .where(and(
        sql`${attendanceRecords.date} >= NOW() - INTERVAL '30 days'`,
        eq(attendanceRecords.status, 'present')
      ));
    
    const [totalCount] = await db
      .select({ count: count() })
      .from(attendanceRecords)
      .where(sql`${attendanceRecords.date} >= NOW() - INTERVAL '30 days'`);
    
    if (totalCount.count === 0) return 0;
    return Math.round((presentCount.count / totalCount.count) * 100);
  }

  // Memorization operations
  async createMemorization(insertMemorization: InsertMemorization): Promise<Memorization> {
    const [memorization] = await db
      .insert(memorizations)
      .values(insertMemorization)
      .returning();
    return memorization;
  }

  async getMemorizationByCourse(courseId: number): Promise<Memorization[]> {
    return await db
      .select()
      .from(memorizations)
      .where(eq(memorizations.courseId, courseId));
  }

  async getMemorizationByStudent(studentId: number): Promise<Memorization[]> {
    return await db
      .select()
      .from(memorizations)
      .where(eq(memorizations.studentId, studentId))
      .orderBy(desc(memorizations.completionDate));
  }

  async updateMemorization(id: number, data: Partial<Memorization>): Promise<Memorization> {
    const [updatedMemorization] = await db
      .update(memorizations)
      .set(data)
      .where(eq(memorizations.id, id))
      .returning();
    return updatedMemorization;
  }

  // Lesson operations
  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    const [lesson] = await db
      .insert(lessons)
      .values(insertLesson)
      .returning();
    return lesson;
  }

  async getLessonsByCourse(courseId: number): Promise<Lesson[]> {
    return await db
      .select()
      .from(lessons)
      .where(eq(lessons.courseId, courseId))
      .orderBy(lessons.orderIndex);
  }

  // Event operations
  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values(insertEvent)
      .returning();
    return event;
  }

  async getAllEvents(): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .orderBy(events.date);
  }

  // Parent Portal operations
  async createParentStudentRelation(relation: InsertParentStudentRelation): Promise<ParentStudentRelation> {
    const [parentStudentRelation] = await db
      .insert(parentStudentRelations)
      .values(relation)
      .returning();
    return parentStudentRelation;
  }

  async getStudentsByParent(parentId: number): Promise<User[]> {
    const relations = await db
      .select()
      .from(parentStudentRelations)
      .innerJoin(users, eq(parentStudentRelations.studentId, users.id))
      .where(eq(parentStudentRelations.parentId, parentId));
    
    return relations.map(r => r.users);
  }

  async getParentsByStudent(studentId: number): Promise<User[]> {
    const relations = await db
      .select()
      .from(parentStudentRelations)
      .innerJoin(users, eq(parentStudentRelations.parentId, users.id))
      .where(eq(parentStudentRelations.studentId, studentId));
    
    return relations.map(r => r.users);
  }

  async getParentStudentRelations(parentId: number): Promise<ParentStudentRelation[]> {
    return await db
      .select()
      .from(parentStudentRelations)
      .where(eq(parentStudentRelations.parentId, parentId));
  }

  async getStudentProgressSummary(studentId: number): Promise<any> {
    // Get attendance data
    const attendanceRecords = await this.getAttendanceByStudent(studentId);
    
    // Get memorization progress
    const memorizationRecords = await this.getMemorizationByStudent(studentId);
    
    // Get enrollment data to find courses the student is enrolled in
    const enrollmentData = await db
      .select()
      .from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id))
      .where(eq(enrollments.studentId, studentId));
    
    const courseIds = enrollmentData.map(e => e.courses.id);
    
    // Calculate attendance rate
    const totalAttendance = attendanceRecords.length;
    const presentAttendance = attendanceRecords.filter(a => a.status === 'present').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;
    
    // Calculate memorization progress
    const completedMemorizations = memorizationRecords.filter(m => m.isCompleted).length;
    const totalMemorizations = memorizationRecords.length;
    const memorizationRate = totalMemorizations > 0 ? Math.round((completedMemorizations / totalMemorizations) * 100) : 0;
    
    // Get the most recent 5 attendance records
    const recentAttendance = attendanceRecords.slice(0, 5);
    
    // Calculate average progress on memorizations
    const averageProgress = memorizationRecords.length > 0 
      ? Math.round(memorizationRecords.reduce((sum, m) => sum + m.progress, 0) / memorizationRecords.length) 
      : 0;
    
    return {
      studentId,
      courses: enrollmentData.map(e => e.courses),
      attendanceRate,
      memorizationRate,
      averageProgress,
      totalCourses: courseIds.length,
      recentAttendance,
      recentMemorizations: memorizationRecords.slice(0, 5)
    };
  }

  // Materials operations
  async createMaterial(insertMaterial: InsertMaterial): Promise<Material> {
    const [material] = await db
      .insert(materials)
      .values(insertMaterial)
      .returning();
    return material;
  }

  async getMaterialsByCourse(courseId: number): Promise<Material[]> {
    return await db
      .select()
      .from(materials)
      .where(eq(materials.courseId, courseId))
      .orderBy(desc(materials.createdAt));
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const [material] = await db
      .select()
      .from(materials)
      .where(eq(materials.id, id));
    return material;
  }

  // Assignments operations
  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const [assignment] = await db
      .insert(assignments)
      .values(insertAssignment)
      .returning();
    return assignment;
  }

  async getAssignmentsByCourse(courseId: number): Promise<Assignment[]> {
    return await db
      .select()
      .from(assignments)
      .where(eq(assignments.courseId, courseId))
      .orderBy(desc(assignments.createdAt));
  }

  async getAssignment(id: number): Promise<Assignment | undefined> {
    const [assignment] = await db
      .select()
      .from(assignments)
      .where(eq(assignments.id, id));
    return assignment;
  }

  // Submissions operations
  async createSubmission(insertSubmission: InsertSubmission): Promise<Submission> {
    const [submission] = await db
      .insert(submissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async getSubmissionsByAssignment(assignmentId: number): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.assignmentId, assignmentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async getSubmissionsByStudent(studentId: number): Promise<Submission[]> {
    return await db
      .select()
      .from(submissions)
      .where(eq(submissions.studentId, studentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async updateSubmissionGrade(id: number, grade: number, feedback: string, gradedBy: number): Promise<Submission> {
    const [updatedSubmission] = await db
      .update(submissions)
      .set({
        grade,
        feedback,
        status: 'graded',
        gradedAt: new Date(),
        gradedBy
      })
      .where(eq(submissions.id, id))
      .returning();
    return updatedSubmission;
  }

  // Company Admin - Organization Management
  async createOrganization(insertOrganization: InsertOrganization): Promise<Organization> {
    const [organization] = await db
      .insert(organizations)
      .values(insertOrganization)
      .returning();
    return organization;
  }

  async getAllOrganizations(): Promise<Organization[]> {
    return await db
      .select()
      .from(organizations)
      .orderBy(desc(organizations.createdAt));
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));
    return organization;
  }

  async updateOrganization(id: number, data: Partial<Organization>): Promise<Organization> {
    const [updatedOrganization] = await db
      .update(organizations)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return updatedOrganization;
  }

  async getOrganizationUsers(organizationId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.organizationId, organizationId))
      .orderBy(desc(users.createdAt));
  }

  async getOrganizationStats(organizationId: number): Promise<any> {
    const orgUsers = await this.getOrganizationUsers(organizationId);
    const directors = orgUsers.filter(u => u.role === 'director').length;
    const teachers = orgUsers.filter(u => u.role === 'teacher').length;
    const students = orgUsers.filter(u => u.role === 'student').length;
    const parents = orgUsers.filter(u => u.role === 'parent').length;

    return {
      totalUsers: orgUsers.length,
      directors,
      teachers,
      students,
      parents,
      lastActivity: orgUsers[0]?.createdAt || null
    };
  }

  // Company Admin - User Feedback Management
  async createUserFeedback(insertUserFeedback: InsertUserFeedback): Promise<UserFeedback> {
    const [feedback] = await db
      .insert(userFeedback)
      .values(insertUserFeedback)
      .returning();
    return feedback;
  }

  async getAllUserFeedback(filters?: any): Promise<UserFeedback[]> {
    let query = db.select().from(userFeedback);
    
    if (filters?.status) {
      query = query.where(eq(userFeedback.status, filters.status));
    }
    if (filters?.priority) {
      query = query.where(eq(userFeedback.priority, filters.priority));
    }
    if (filters?.category) {
      query = query.where(eq(userFeedback.category, filters.category));
    }
    
    return await query.orderBy(desc(userFeedback.createdAt));
  }

  async getUserFeedback(id: number): Promise<UserFeedback | undefined> {
    const [feedback] = await db
      .select()
      .from(userFeedback)
      .where(eq(userFeedback.id, id));
    return feedback;
  }

  async updateUserFeedback(id: number, data: Partial<UserFeedback>): Promise<UserFeedback> {
    const updateData: any = { ...data, updatedAt: new Date() };
    if (data.status === 'resolved' && !data.resolvedAt) {
      updateData.resolvedAt = new Date();
    }
    
    const [updatedFeedback] = await db
      .update(userFeedback)
      .set(updateData)
      .where(eq(userFeedback.id, id))
      .returning();
    return updatedFeedback;
  }

  async getFeedbackByOrganization(organizationId: number): Promise<UserFeedback[]> {
    return await db
      .select()
      .from(userFeedback)
      .where(eq(userFeedback.organizationId, organizationId))
      .orderBy(desc(userFeedback.createdAt));
  }

  // Company Admin - Feedback Comments
  async createFeedbackComment(insertFeedbackComment: InsertFeedbackComment): Promise<FeedbackComment> {
    const [comment] = await db
      .insert(feedbackComments)
      .values(insertFeedbackComment)
      .returning();
    return comment;
  }

  async getFeedbackComments(feedbackId: number): Promise<FeedbackComment[]> {
    return await db
      .select()
      .from(feedbackComments)
      .where(eq(feedbackComments.feedbackId, feedbackId))
      .orderBy(feedbackComments.createdAt);
  }

  // Company Admin - Organization Logs
  async createOrganizationLog(insertOrganizationLog: InsertOrganizationLog): Promise<OrganizationLog> {
    const [log] = await db
      .insert(organizationLogs)
      .values(insertOrganizationLog)
      .returning();
    return log;
  }

  async getOrganizationLogs(organizationId: number, limit: number = 50): Promise<OrganizationLog[]> {
    return await db
      .select()
      .from(organizationLogs)
      .where(eq(organizationLogs.organizationId, organizationId))
      .orderBy(desc(organizationLogs.createdAt))
      .limit(limit);
  }

  // Company Admin - System Overview
  async getCompanyOverviewStats(): Promise<any> {
    const totalOrganizations = await db.select({ count: count() }).from(organizations);
    const totalUsers = await db.select({ count: count() }).from(users);
    const activeFeedback = await db
      .select({ count: count() })
      .from(userFeedback)
      .where(eq(userFeedback.status, 'open'));
    
    const organizationsByStatus = await db
      .select({
        status: organizations.status,
        count: count()
      })
      .from(organizations)
      .groupBy(organizations.status);

    const usersByRole = await db
      .select({
        role: users.role,
        count: count()
      })
      .from(users)
      .groupBy(users.role);

    return {
      totalOrganizations: totalOrganizations[0].count,
      totalUsers: totalUsers[0].count,
      activeFeedback: activeFeedback[0].count,
      organizationsByStatus,
      usersByRole
    };
  }

  async getAllUsersWithOrganizations(): Promise<any[]> {
    return await db
      .select({
        id: users.id,
        username: users.username,
        fullName: users.fullName,
        role: users.role,
        email: users.email,
        createdAt: users.createdAt,
        organizationId: users.organizationId,
        organizationName: organizations.name,
        organizationStatus: organizations.status
      })
      .from(users)
      .leftJoin(organizations, eq(users.organizationId, organizations.id))
      .orderBy(desc(users.createdAt));
  }
}

export const storage = new DatabaseStorage();
