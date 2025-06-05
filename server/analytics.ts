import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { db } from "./db";
import { sql, eq, gte, lte, desc, asc, count, avg } from "drizzle-orm";
import { 
  users, courses, enrollments, attendanceRecords, 
  memorizations, assignments, submissions 
} from "@shared/schema";

interface AnalyticsFilters {
  timeRange: string;
  courseId?: string;
  startDate: Date;
  endDate: Date;
}

function getDateRangeFromTimeRange(timeRange: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  let startDate = new Date();

  switch (timeRange) {
    case '1month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case '3months':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case '1year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(endDate.getMonth() - 3);
  }

  return { startDate, endDate };
}

class AnalyticsService {
  async getOverviewMetrics(filters: AnalyticsFilters) {
    try {
      // Total counts
      const totalStudents = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, 'student'));

      const totalTeachers = await db
        .select({ count: count() })
        .from(users)
        .where(eq(users.role, 'teacher'));

      const totalCourses = await db
        .select({ count: count() })
        .from(courses);

      // Attendance metrics
      const attendanceQuery = db
        .select({ count: count() })
        .from(attendanceRecords)
        .where(gte(attendanceRecords.date, filters.startDate));

      const totalAttendanceRecords = await attendanceQuery;

      // Average attendance rate
      const attendanceRateQuery = await db
        .select({
          status: attendanceRecords.status,
          count: count()
        })
        .from(attendanceRecords)
        .where(gte(attendanceRecords.date, filters.startDate))
        .groupBy(attendanceRecords.status);

      const presentCount = attendanceRateQuery.find(r => r.status === 'present')?.count || 0;
      const totalAttendance = attendanceRateQuery.reduce((sum, r) => sum + r.count, 0);
      const averageAttendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

      // Active students this month
      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);
      
      const activeStudentsThisMonth = await db
        .selectDistinct({ studentId: attendanceRecords.studentId })
        .from(attendanceRecords)
        .where(gte(attendanceRecords.date, thisMonthStart));

      // Completed assignments
      const completedAssignments = await db
        .select({ count: count() })
        .from(submissions)
        .where(eq(submissions.status, 'graded'));

      return {
        totalStudents: totalStudents[0]?.count || 0,
        totalTeachers: totalTeachers[0]?.count || 0,
        totalCourses: totalCourses[0]?.count || 0,
        totalAttendanceRecords: totalAttendanceRecords[0]?.count || 0,
        averageAttendanceRate,
        totalMemorizationProgress: 0, // Will calculate based on memorizations
        activeStudentsThisMonth: activeStudentsThisMonth.length,
        completedAssignments: completedAssignments[0]?.count || 0
      };
    } catch (error) {
      console.error("Error fetching overview metrics:", error);
      throw error;
    }
  }

  async getAttendanceTrends(filters: AnalyticsFilters) {
    try {
      const attendanceTrends = await db
        .select({
          date: sql<string>`DATE(${attendanceRecords.date})`,
          status: attendanceRecords.status,
          count: count()
        })
        .from(attendanceRecords)
        .where(gte(attendanceRecords.date, filters.startDate))
        .groupBy(sql`DATE(${attendanceRecords.date})`, attendanceRecords.status)
        .orderBy(asc(sql`DATE(${attendanceRecords.date})`));

      // Transform data for chart
      const trendMap = new Map();
      
      attendanceTrends.forEach(record => {
        if (!trendMap.has(record.date)) {
          trendMap.set(record.date, { date: record.date, present: 0, absent: 0 });
        }
        const trend = trendMap.get(record.date);
        if (record.status === 'present') {
          trend.present = record.count;
        } else if (record.status === 'absent') {
          trend.absent = record.count;
        }
      });

      return Array.from(trendMap.values()).map(trend => ({
        ...trend,
        rate: trend.present + trend.absent > 0 
          ? Math.round((trend.present / (trend.present + trend.absent)) * 100) 
          : 0
      }));
    } catch (error) {
      console.error("Error fetching attendance trends:", error);
      return [];
    }
  }

  async getCoursePerformance(filters: AnalyticsFilters) {
    try {
      const coursePerformance = await db
        .select({
          courseId: courses.id,
          courseName: courses.name,
          enrolledStudents: count(enrollments.studentId),
        })
        .from(courses)
        .leftJoin(enrollments, eq(courses.id, enrollments.courseId))
        .groupBy(courses.id, courses.name);

      // Enhance with attendance and assignment data
      const enhancedPerformance = await Promise.all(
        coursePerformance.map(async (course) => {
          // Average attendance for course
          const courseAttendance = await db
            .select({
              status: attendanceRecords.status,
              count: count()
            })
            .from(attendanceRecords)
            .where(eq(attendanceRecords.courseId, course.courseId))
            .groupBy(attendanceRecords.status);

          const presentCount = courseAttendance.find(r => r.status === 'present')?.count || 0;
          const totalAttendance = courseAttendance.reduce((sum, r) => sum + r.count, 0);
          const averageAttendance = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

          // Assignment completion
          const courseAssignments = await db
            .select({ count: count() })
            .from(assignments)
            .where(eq(assignments.courseId, course.courseId));

          const completedAssignments = await db
            .select({ count: count() })
            .from(submissions)
            .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
            .where(eq(assignments.courseId, course.courseId));

          // Average grade
          const avgGradeResult = await db
            .select({ avgGrade: avg(submissions.grade) })
            .from(submissions)
            .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
            .where(eq(assignments.courseId, course.courseId));

          return {
            courseName: course.courseName,
            enrolledStudents: course.enrolledStudents,
            averageAttendance,
            completedAssignments: completedAssignments[0]?.count || 0,
            averageGrade: Math.round(Number(avgGradeResult[0]?.avgGrade) || 0)
          };
        })
      );

      return enhancedPerformance;
    } catch (error) {
      console.error("Error fetching course performance:", error);
      return [];
    }
  }

  async getMemorizationProgress(filters: AnalyticsFilters) {
    try {
      const memorizationData = await db
        .select({
          surah: memorizations.surah,
          studentsCompleted: count(memorizations.id),
          avgProgress: avg(memorizations.progress)
        })
        .from(memorizations)
        .where(gte(memorizations.completionDate, filters.startDate))
        .groupBy(memorizations.surah)
        .orderBy(desc(count(memorizations.id)));

      return memorizationData.map(item => ({
        surah: item.surah,
        studentsCompleted: item.studentsCompleted,
        averageProgress: Math.round(Number(item.avgProgress) || 0)
      }));
    } catch (error) {
      console.error("Error fetching memorization progress:", error);
      return [];
    }
  }

  async getStudentPerformance(filters: AnalyticsFilters) {
    try {
      const studentPerformance = await db
        .select({
          studentId: users.id,
          studentName: users.fullName
        })
        .from(users)
        .where(eq(users.role, 'student'))
        .limit(20); // Top 20 students

      const enhancedPerformance = await Promise.all(
        studentPerformance.map(async (student) => {
          // Attendance rate
          const studentAttendance = await db
            .select({
              status: attendanceRecords.status,
              count: count()
            })
            .from(attendanceRecords)
            .where(eq(attendanceRecords.studentId, student.studentId))
            .groupBy(attendanceRecords.status);

          const presentCount = studentAttendance.find(r => r.status === 'present')?.count || 0;
          const totalAttendance = studentAttendance.reduce((sum, r) => sum + r.count, 0);
          const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

          // Assignment completion
          const assignmentsCompleted = await db
            .select({ count: count() })
            .from(submissions)
            .where(eq(submissions.studentId, student.studentId));

          // Average grade
          const avgGradeResult = await db
            .select({ avgGrade: avg(submissions.grade) })
            .from(submissions)
            .where(eq(submissions.studentId, student.studentId));

          // Memorization progress
          const memorizationResult = await db
            .select({ avgProgress: avg(memorizations.progress) })
            .from(memorizations)
            .where(eq(memorizations.studentId, student.studentId));

          return {
            studentName: student.studentName,
            attendanceRate,
            assignmentsCompleted: assignmentsCompleted[0]?.count || 0,
            averageGrade: Math.round(Number(avgGradeResult[0]?.avgGrade) || 0),
            memorizationProgress: Math.round(Number(memorizationResult[0]?.avgProgress) || 0)
          };
        })
      );

      // Sort by overall performance
      return enhancedPerformance.sort((a, b) => {
        const scoreA = (a.attendanceRate + a.averageGrade + a.memorizationProgress) / 3;
        const scoreB = (b.attendanceRate + b.averageGrade + b.memorizationProgress) / 3;
        return scoreB - scoreA;
      });
    } catch (error) {
      console.error("Error fetching student performance:", error);
      return [];
    }
  }

  async getTeacherEffectiveness(filters: AnalyticsFilters) {
    try {
      const teacherData = await db
        .select({
          teacherId: users.id,
          teacherName: users.fullName
        })
        .from(users)
        .where(eq(users.role, 'teacher'));

      const enhancedTeachers = await Promise.all(
        teacherData.map(async (teacher) => {
          // Courses teaching
          const teacherCourses = await db
            .select({ count: count() })
            .from(courses)
            .where(eq(courses.teacherId, teacher.teacherId));

          // Student count
          const studentCount = await db
            .select({ count: count() })
            .from(enrollments)
            .innerJoin(courses, eq(enrollments.courseId, courses.id))
            .where(eq(courses.teacherId, teacher.teacherId));

          // Average student performance in their classes
          const studentPerformance = await db
            .select({ avgGrade: avg(submissions.grade) })
            .from(submissions)
            .innerJoin(assignments, eq(submissions.assignmentId, assignments.id))
            .innerJoin(courses, eq(assignments.courseId, courses.id))
            .where(eq(courses.teacherId, teacher.teacherId));

          // Class attendance rate
          const classAttendance = await db
            .select({
              status: attendanceRecords.status,
              count: count()
            })
            .from(attendanceRecords)
            .innerJoin(courses, eq(attendanceRecords.courseId, courses.id))
            .where(eq(courses.teacherId, teacher.teacherId))
            .groupBy(attendanceRecords.status);

          const presentCount = classAttendance.find(r => r.status === 'present')?.count || 0;
          const totalAttendance = classAttendance.reduce((sum, r) => sum + r.count, 0);
          const classAttendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

          return {
            teacherName: teacher.teacherName,
            coursesTeaching: teacherCourses[0]?.count || 0,
            studentCount: studentCount[0]?.count || 0,
            averageStudentPerformance: Math.round(Number(studentPerformance[0]?.avgGrade) || 0),
            classAttendanceRate
          };
        })
      );

      return enhancedTeachers.filter(teacher => teacher.coursesTeaching > 0);
    } catch (error) {
      console.error("Error fetching teacher effectiveness:", error);
      return [];
    }
  }

  async getComprehensiveAnalytics(timeRange: string, courseId?: string) {
    const filters: AnalyticsFilters = {
      timeRange,
      courseId,
      ...getDateRangeFromTimeRange(timeRange)
    };

    const [
      overview,
      attendanceTrends,
      coursePerformance,
      memorizationProgress,
      studentPerformance,
      teacherEffectiveness
    ] = await Promise.all([
      this.getOverviewMetrics(filters),
      this.getAttendanceTrends(filters),
      this.getCoursePerformance(filters),
      this.getMemorizationProgress(filters),
      this.getStudentPerformance(filters),
      this.getTeacherEffectiveness(filters)
    ]);

    return {
      overview,
      attendanceTrends,
      coursePerformance,
      memorizationProgress,
      studentPerformance,
      teacherEffectiveness
    };
  }
}

const analyticsService = new AnalyticsService();

export function setupAnalyticsRoutes(app: Express) {
  // Main analytics dashboard endpoint
  app.get("/api/analytics/dashboard", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || (req.user?.role !== 'director' && req.user?.role !== 'teacher')) {
        return res.status(403).json({ error: "Access denied" });
      }

      const timeRange = req.query.timeRange as string || '3months';
      const courseId = req.query.courseId as string;

      const analyticsData = await analyticsService.getComprehensiveAnalytics(timeRange, courseId);
      res.json(analyticsData);
    } catch (error) {
      console.error("Error fetching analytics dashboard:", error);
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  });

  // Export analytics report
  app.get("/api/analytics/export", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'director') {
        return res.status(403).json({ error: "Access denied" });
      }

      const timeRange = req.query.timeRange as string || '3months';
      const format = req.query.format as string || 'json';

      const analyticsData = await analyticsService.getComprehensiveAnalytics(timeRange);

      if (format === 'csv') {
        // Convert to CSV format
        const csvData = convertAnalyticsToCSV(analyticsData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${timeRange}.csv`);
        res.send(csvData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=analytics-report-${timeRange}.json`);
        res.json(analyticsData);
      }
    } catch (error) {
      console.error("Error exporting analytics:", error);
      res.status(500).json({ error: "Failed to export analytics data" });
    }
  });

  // Specific analytics endpoints
  app.get("/api/analytics/attendance-trends", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const timeRange = req.query.timeRange as string || '3months';
      const filters: AnalyticsFilters = {
        timeRange,
        ...getDateRangeFromTimeRange(timeRange)
      };

      const trends = await analyticsService.getAttendanceTrends(filters);
      res.json(trends);
    } catch (error) {
      console.error("Error fetching attendance trends:", error);
      res.status(500).json({ error: "Failed to fetch attendance trends" });
    }
  });

  app.get("/api/analytics/student-performance", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const timeRange = req.query.timeRange as string || '3months';
      const filters: AnalyticsFilters = {
        timeRange,
        ...getDateRangeFromTimeRange(timeRange)
      };

      const performance = await analyticsService.getStudentPerformance(filters);
      res.json(performance);
    } catch (error) {
      console.error("Error fetching student performance:", error);
      res.status(500).json({ error: "Failed to fetch student performance" });
    }
  });
}

function convertAnalyticsToCSV(data: any): string {
  let csv = 'MadrasaApp Analytics Report\n\n';
  
  // Overview section
  csv += 'OVERVIEW METRICS\n';
  csv += 'Metric,Value\n';
  csv += `Total Students,${data.overview.totalStudents}\n`;
  csv += `Total Teachers,${data.overview.totalTeachers}\n`;
  csv += `Total Courses,${data.overview.totalCourses}\n`;
  csv += `Average Attendance Rate,${data.overview.averageAttendanceRate}%\n`;
  csv += `Completed Assignments,${data.overview.completedAssignments}\n\n`;

  // Student performance section
  csv += 'STUDENT PERFORMANCE\n';
  csv += 'Student Name,Attendance Rate,Assignments Completed,Average Grade,Memorization Progress\n';
  data.studentPerformance.forEach((student: any) => {
    csv += `${student.studentName},${student.attendanceRate}%,${student.assignmentsCompleted},${student.averageGrade}%,${student.memorizationProgress}%\n`;
  });

  return csv;
}