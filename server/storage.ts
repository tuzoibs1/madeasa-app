import { 
  users, type User, type InsertUser,
  courses, type Course, type InsertCourse,
  enrollments, type Enrollment, type InsertEnrollment,
  attendanceRecords, type AttendanceRecord, type InsertAttendance,
  memorizations, type Memorization, type InsertMemorization,
  lessons, type Lesson, type InsertLesson,
  events, type Event, type InsertEvent
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, count } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
  
  // Session store
  sessionStore: any;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // 24 hours
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
}

export const storage = new DatabaseStorage();
