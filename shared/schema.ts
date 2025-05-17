import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['director', 'teacher', 'student', 'parent']);

// Table definitions
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default('student'),
  email: text("email"),
  profilePicture: text("profile_picture"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  teacherId: integer("teacher_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const enrollments = pgTable("enrollments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  enrollmentDate: timestamp("enrollment_date").defaultNow(),
});

export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  status: text("status").notNull(), // 'present', 'absent', 'late', 'excused'
  notes: text("notes"),
});

export const memorizations = pgTable("memorizations", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  surah: text("surah").notNull(),
  ayahStart: integer("ayah_start").notNull(),
  ayahEnd: integer("ayah_end").notNull(),
  completionDate: timestamp("completion_date"),
  progress: integer("progress").notNull().default(0), // Percentage of completion
  isCompleted: boolean("is_completed").notNull().default(false),
});

export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  content: text("content"),
  orderIndex: integer("order_index").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"),
  location: text("location"),
  createdById: integer("created_by_id").references(() => users.id),
});

export const parentStudentRelations = pgTable("parent_student_relations", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").references(() => users.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  relationship: text("relationship").notNull(), // e.g., "father", "mother", "guardian"
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation and insertion
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrollmentDate: true });
export const insertAttendanceSchema = createInsertSchema(attendanceRecords).omit({ id: true });
export const insertMemorizationSchema = createInsertSchema(memorizations).omit({ id: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertParentStudentRelationSchema = createInsertSchema(parentStudentRelations).omit({ id: true, createdAt: true });

// Types for insertion
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertMemorization = z.infer<typeof insertMemorizationSchema>;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertParentStudentRelation = z.infer<typeof insertParentStudentRelationSchema>;

// Types for selection
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type Memorization = typeof memorizations.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Event = typeof events.$inferSelect;
export type ParentStudentRelation = typeof parentStudentRelations.$inferSelect;

// Extended schemas for login
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
