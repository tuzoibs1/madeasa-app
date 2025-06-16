import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, varchar, date, time } from "drizzle-orm/pg-core";
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
export const insertAssignmentSchema = createInsertSchema(assignments).omit({ id: true, createdAt: true }).extend({
  dueDate: z.string().optional().transform((val) => val ? new Date(val) : null)
});
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

// Study Groups Schema
export const studyGroups = pgTable("study_groups", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  courseId: integer("course_id").references(() => courses.id),
  teacherId: integer("teacher_id").references(() => users.id),
  maxMembers: integer("max_members").default(10),
  type: varchar("type", { length: 50 }).notNull(), // memorization, arabic, islamic_history, general
  meetingSchedule: text("meeting_schedule"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const studyGroupMemberships = pgTable("study_group_memberships", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => studyGroups.id),
  studentId: integer("student_id").references(() => users.id),
  role: varchar("role", { length: 20 }).default("member"), // member, leader
  joinedAt: timestamp("joined_at").defaultNow(),
  contributions: integer("contributions").default(0),
});

// Video Conferences Schema
export const conferences = pgTable("conferences", {
  id: serial("id").primaryKey(),
  parentId: integer("parent_id").references(() => users.id),
  studentId: integer("student_id").references(() => users.id),
  teacherId: integer("teacher_id").references(() => users.id),
  scheduledTime: timestamp("scheduled_time").notNull(),
  duration: integer("duration").default(30), // minutes
  meetingLink: varchar("meeting_link", { length: 500 }),
  topics: text("topics").array(),
  status: varchar("status", { length: 20 }).default("scheduled"), // scheduled, completed, cancelled, rescheduled
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Islamic Calendar Events Schema
export const islamicCalendarEvents = pgTable("islamic_calendar_events", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // religious, historical, educational
  hijriDate: varchar("hijri_date", { length: 100 }),
  gregorianDate: date("gregorian_date"),
  description: text("description"),
  significance: text("significance"),
  educationalContent: text("educational_content").array(),
  recommendedActivities: text("recommended_activities").array(),
  isActive: boolean("is_active").default(true),
});

// Madrasa Network Schema
export const madrasaNetwork = pgTable("madrasa_network", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  establishedYear: integer("established_year"),
  studentCount: integer("student_count"),
  specializations: text("specializations").array(),
  isPartner: boolean("is_partner").default(false),
  connectionType: varchar("connection_type", { length: 50 }), // sister_school, exchange_program, resource_sharing
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Knowledge Sharing Schema
export const knowledgeSharing = pgTable("knowledge_sharing", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // curriculum, teaching_methods, resources, events
  authorId: integer("author_id").references(() => users.id),
  madrasaId: integer("madrasa_id").references(() => madrasaNetwork.id),
  tags: text("tags").array(),
  likes: integer("likes").default(0),
  comments: integer("comments").default(0),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Weekly Progress Reports Schema
export const weeklyReports = pgTable("weekly_reports", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id),
  weekStart: date("week_start").notNull(),
  weekEnd: date("week_end").notNull(),
  attendanceRate: integer("attendance_rate"),
  versesMemorized: integer("verses_memorized"),
  assignmentsCompleted: integer("assignments_completed"),
  averageGrade: integer("average_grade"),
  teacherNotes: text("teacher_notes").array(),
  recommendations: text("recommendations").array(),
  sentToParent: boolean("sent_to_parent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Certificates Schema
export const certificates = pgTable("certificates", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id),
  courseId: integer("course_id").references(() => courses.id),
  type: varchar("type", { length: 50 }).notNull(), // completion, memorization, excellence
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  issuedDate: date("issued_date").defaultNow(),
  certificateUrl: varchar("certificate_url", { length: 500 }),
  verificationCode: varchar("verification_code", { length: 100 }),
  isActive: boolean("is_active").default(true),
});

// Voice Recordings Schema
export const voiceRecordings = pgTable("voice_recordings", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").references(() => users.id),
  assignmentId: integer("assignment_id").references(() => assignments.id),
  surah: varchar("surah", { length: 100 }),
  verses: varchar("verses", { length: 100 }),
  recordingUrl: varchar("recording_url", { length: 500 }),
  duration: integer("duration"), // seconds
  teacherFeedback: text("teacher_feedback"),
  grade: integer("grade"),
  isApproved: boolean("is_approved").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Prayer Times Schema
export const prayerTimes = pgTable("prayer_times", {
  id: serial("id").primaryKey(),
  location: varchar("location", { length: 255 }).notNull(),
  date: date("date").notNull(),
  fajr: time("fajr"),
  sunrise: time("sunrise"),
  dhuhr: time("dhuhr"),
  asr: time("asr"),
  maghrib: time("maghrib"),
  isha: time("isha"),
});

// Add versesMemorized to memorizations table
export const memorizationsExtended = pgTable("memorizations", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id),
  studentId: integer("student_id").references(() => users.id),
  surah: varchar("surah", { length: 100 }).notNull(),
  ayahStart: integer("ayah_start").notNull(),
  ayahEnd: integer("ayah_end").notNull(),
  versesMemorized: integer("verses_memorized").default(0),
  completionDate: timestamp("completion_date"),
  progress: integer("progress").default(0),
  isCompleted: boolean("is_completed").default(false),
});

// Extended schemas for insertion
export const insertStudyGroupSchema = createInsertSchema(studyGroups).omit({ id: true, createdAt: true });
export const insertStudyGroupMembershipSchema = createInsertSchema(studyGroupMemberships).omit({ id: true, joinedAt: true });
export const insertConferenceSchema = createInsertSchema(conferences).omit({ id: true, createdAt: true });
export const insertIslamicEventSchema = createInsertSchema(islamicCalendarEvents).omit({ id: true });
export const insertMadrasaNetworkSchema = createInsertSchema(madrasaNetwork).omit({ id: true, joinedAt: true });
export const insertKnowledgeSharingSchema = createInsertSchema(knowledgeSharing).omit({ id: true, createdAt: true, likes: true, comments: true });
export const insertWeeklyReportSchema = createInsertSchema(weeklyReports).omit({ id: true, createdAt: true });
export const insertCertificateSchema = createInsertSchema(certificates).omit({ id: true });
export const insertVoiceRecordingSchema = createInsertSchema(voiceRecordings).omit({ id: true, createdAt: true });
export const insertPrayerTimesSchema = createInsertSchema(prayerTimes).omit({ id: true });

// Extended types for insertion
export type InsertStudyGroup = z.infer<typeof insertStudyGroupSchema>;
export type InsertStudyGroupMembership = z.infer<typeof insertStudyGroupMembershipSchema>;
export type InsertConference = z.infer<typeof insertConferenceSchema>;
export type InsertIslamicEvent = z.infer<typeof insertIslamicEventSchema>;
export type InsertMadrasaNetwork = z.infer<typeof insertMadrasaNetworkSchema>;
export type InsertKnowledgeSharing = z.infer<typeof insertKnowledgeSharingSchema>;
export type InsertWeeklyReport = z.infer<typeof insertWeeklyReportSchema>;
export type InsertCertificate = z.infer<typeof insertCertificateSchema>;
export type InsertVoiceRecording = z.infer<typeof insertVoiceRecordingSchema>;
export type InsertPrayerTimes = z.infer<typeof insertPrayerTimesSchema>;

// Extended types for selection
export type StudyGroup = typeof studyGroups.$inferSelect;
export type StudyGroupMembership = typeof studyGroupMemberships.$inferSelect;
export type Conference = typeof conferences.$inferSelect;
export type IslamicCalendarEvent = typeof islamicCalendarEvents.$inferSelect;
export type MadrasaNetwork = typeof madrasaNetwork.$inferSelect;
export type KnowledgeSharing = typeof knowledgeSharing.$inferSelect;
export type WeeklyReport = typeof weeklyReports.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type VoiceRecording = typeof voiceRecordings.$inferSelect;
export type PrayerTimes = typeof prayerTimes.$inferSelect;

// Extended schemas for login
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
