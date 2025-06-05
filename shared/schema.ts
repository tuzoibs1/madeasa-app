import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['company_admin', 'director', 'teacher', 'student', 'parent']);
export const submissionStatusEnum = pgEnum('submission_status', ['submitted', 'graded', 'returned']);
export const feedbackStatusEnum = pgEnum('feedback_status', ['open', 'in_progress', 'resolved', 'closed']);
export const feedbackPriorityEnum = pgEnum('feedback_priority', ['low', 'medium', 'high', 'critical']);
export const organizationStatusEnum = pgEnum('organization_status', ['active', 'suspended', 'trial', 'cancelled']);

// Table definitions
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  website: text("website"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  status: organizationStatusEnum("status").notNull().default('trial'),
  subscriptionPlan: text("subscription_plan").default('basic'),
  subscriptionExpiry: timestamp("subscription_expiry"),
  maxUsers: integer("max_users").default(50),
  currentUsers: integer("current_users").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").notNull().default('student'),
  email: text("email"),
  profilePicture: text("profile_picture"),
  organizationId: integer("organization_id").references(() => organizations.id),
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

export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  uploadedBy: integer("uploaded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  totalPoints: integer("total_points").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: integer("created_by").references(() => users.id).notNull(),
});

export const submissions = pgTable("submissions", {
  id: serial("id").primaryKey(),
  assignmentId: integer("assignment_id").references(() => assignments.id).notNull(),
  studentId: integer("student_id").references(() => users.id).notNull(),
  filePath: text("file_path").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  comments: text("comments"),
  submittedAt: timestamp("submitted_at").defaultNow(),
  grade: integer("grade"),
  feedback: text("feedback"),
  status: submissionStatusEnum("status").notNull().default('submitted'),
  gradedAt: timestamp("graded_at"),
  gradedBy: integer("graded_by").references(() => users.id),
});

export const userFeedback = pgTable("user_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'bug', 'feature_request', 'support', 'complaint'
  priority: feedbackPriorityEnum("priority").notNull().default('medium'),
  status: feedbackStatusEnum("status").notNull().default('open'),
  assignedTo: integer("assigned_to").references(() => users.id),
  resolution: text("resolution"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  attachments: text("attachments").array(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

export const feedbackComments = pgTable("feedback_comments", {
  id: serial("id").primaryKey(),
  feedbackId: integer("feedback_id").references(() => userFeedback.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  comment: text("comment").notNull(),
  isInternal: boolean("is_internal").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const organizationLogs = pgTable("organization_logs", {
  id: serial("id").primaryKey(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  action: text("action").notNull(),
  description: text("description").notNull(),
  performedBy: integer("performed_by").references(() => users.id),
  metadata: text("metadata"), // JSON string for additional data
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation and insertion
export const insertOrganizationSchema = createInsertSchema(organizations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCourseSchema = createInsertSchema(courses).omit({ id: true, createdAt: true });
export const insertEnrollmentSchema = createInsertSchema(enrollments).omit({ id: true, enrollmentDate: true });
export const insertAttendanceSchema = createInsertSchema(attendanceRecords).omit({ id: true });
export const insertMemorizationSchema = createInsertSchema(memorizations).omit({ id: true });
export const insertLessonSchema = createInsertSchema(lessons).omit({ id: true, createdAt: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true });
export const insertParentStudentRelationSchema = createInsertSchema(parentStudentRelations).omit({ id: true, createdAt: true });
export const insertMaterialSchema = createInsertSchema(materials).omit({ id: true, createdAt: true });
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true });
export const insertSubmissionSchema = createInsertSchema(submissions).omit({ id: true, submittedAt: true, gradedAt: true });
export const insertUserFeedbackSchema = createInsertSchema(userFeedback).omit({ id: true, createdAt: true, updatedAt: true, resolvedAt: true });
export const insertFeedbackCommentSchema = createInsertSchema(feedbackComments).omit({ id: true, createdAt: true });
export const insertOrganizationLogSchema = createInsertSchema(organizationLogs).omit({ id: true, createdAt: true });

// Types for insertion
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type InsertEnrollment = z.infer<typeof insertEnrollmentSchema>;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type InsertMemorization = z.infer<typeof insertMemorizationSchema>;
export type InsertLesson = z.infer<typeof insertLessonSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertParentStudentRelation = z.infer<typeof insertParentStudentRelationSchema>;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;
export type InsertAssignment = z.infer<typeof insertAssignmentSchema>;
export type InsertSubmission = z.infer<typeof insertSubmissionSchema>;
export type InsertUserFeedback = z.infer<typeof insertUserFeedbackSchema>;
export type InsertFeedbackComment = z.infer<typeof insertFeedbackCommentSchema>;
export type InsertOrganizationLog = z.infer<typeof insertOrganizationLogSchema>;

// Types for selection
export type Organization = typeof organizations.$inferSelect;
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Enrollment = typeof enrollments.$inferSelect;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;
export type Memorization = typeof memorizations.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Event = typeof events.$inferSelect;
export type ParentStudentRelation = typeof parentStudentRelations.$inferSelect;
export type Material = typeof materials.$inferSelect;
export type Assignment = typeof assignments.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type UserFeedback = typeof userFeedback.$inferSelect;
export type FeedbackComment = typeof feedbackComments.$inferSelect;
export type OrganizationLog = typeof organizationLogs.$inferSelect;

// Extended schemas for login
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
