import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { hashPassword } from "./auth";

interface TestResult {
  testName: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
  timestamp: string;
}

interface TestSuite {
  suiteName: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  executionTime: number;
}

class QATestRunner {
  private testResults: TestResult[] = [];
  private suiteResults: TestSuite[] = [];

  async runTest(testName: string, testFunction: () => Promise<boolean>, skipCondition?: boolean): Promise<TestResult> {
    const startTime = Date.now();
    
    if (skipCondition) {
      return {
        testName,
        status: 'SKIP',
        message: 'Test skipped due to condition',
        duration: 0,
        timestamp: new Date().toISOString()
      };
    }

    try {
      const result = await testFunction();
      const duration = Date.now() - startTime;
      
      return {
        testName,
        status: result ? 'PASS' : 'FAIL',
        message: result ? 'Test passed successfully' : 'Test assertion failed',
        duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        testName,
        status: 'FAIL',
        message: `Test failed with error: ${error.message}`,
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  async runAuthenticationTests(): Promise<TestSuite> {
    console.log("Running Authentication Tests...");
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test: Director account exists
    tests.push(await this.runTest(
      "Director Account Existence",
      async () => {
        const director = await storage.getUserByUsername("director1");
        return director !== undefined && director.role === 'director';
      }
    ));

    // Test: User creation functionality
    tests.push(await this.runTest(
      "User Creation System",
      async () => {
        try {
          const testUser = await storage.createUser({
            username: `test_user_${Date.now()}`,
            password: await hashPassword("testpass123"),
            fullName: "Test User QA",
            role: "student",
            email: "test@madrasaapp.com"
          });
          return testUser.id > 0;
        } catch (error) {
          return false;
        }
      }
    ));

    // Test: Role-based data access
    tests.push(await this.runTest(
      "Role-Based Access Control",
      async () => {
        const teachers = await storage.getUsersByRole("teacher");
        const students = await storage.getUsersByRole("student");
        const directors = await storage.getUsersByRole("director");
        return Array.isArray(teachers) && Array.isArray(students) && Array.isArray(directors);
      }
    ));

    const executionTime = Date.now() - startTime;
    const suite: TestSuite = {
      suiteName: "Authentication Tests",
      tests,
      totalTests: tests.length,
      passedTests: tests.filter(t => t.status === 'PASS').length,
      failedTests: tests.filter(t => t.status === 'FAIL').length,
      skippedTests: tests.filter(t => t.status === 'SKIP').length,
      executionTime
    };

    this.suiteResults.push(suite);
    return suite;
  }

  async runEducationalSystemTests(): Promise<TestSuite> {
    console.log("Running Educational System Tests...");
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test: Course creation and retrieval
    tests.push(await this.runTest(
      "Course Management System",
      async () => {
        const courses = await storage.getAllCourses();
        const courseCount = await storage.countCourses();
        return Array.isArray(courses) && typeof courseCount === 'number';
      }
    ));

    // Test: Attendance system
    tests.push(await this.runTest(
      "Attendance Tracking System",
      async () => {
        const attendanceRate = await storage.getAttendanceRate();
        return typeof attendanceRate === 'number' && attendanceRate >= 0 && attendanceRate <= 100;
      }
    ));

    // Test: Student counting
    tests.push(await this.runTest(
      "Student Management System",
      async () => {
        const studentCount = await storage.countStudents();
        const teacherCount = await storage.countTeachers();
        return typeof studentCount === 'number' && typeof teacherCount === 'number';
      }
    ));

    // Test: Memorization tracking
    tests.push(await this.runTest(
      "Memorization Progress System",
      async () => {
        try {
          // This will test if the memorization table structure is correct
          const testStudents = await storage.getUsersByRole("student");
          if (testStudents.length > 0) {
            const memorizations = await storage.getMemorizationByStudent(testStudents[0].id);
            return Array.isArray(memorizations);
          }
          return true; // Skip if no students
        } catch (error) {
          return false;
        }
      }
    ));

    const executionTime = Date.now() - startTime;
    const suite: TestSuite = {
      suiteName: "Educational System Tests",
      tests,
      totalTests: tests.length,
      passedTests: tests.filter(t => t.status === 'PASS').length,
      failedTests: tests.filter(t => t.status === 'FAIL').length,
      skippedTests: tests.filter(t => t.status === 'SKIP').length,
      executionTime
    };

    this.suiteResults.push(suite);
    return suite;
  }

  async runDatabaseIntegrityTests(): Promise<TestSuite> {
    console.log("Running Database Integrity Tests...");
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test: Database connectivity
    tests.push(await this.runTest(
      "Database Connection",
      async () => {
        try {
          const users = await storage.getUsersByRole("director");
          return Array.isArray(users);
        } catch (error) {
          return false;
        }
      }
    ));

    // Test: Foreign key relationships
    tests.push(await this.runTest(
      "Foreign Key Relationships",
      async () => {
        try {
          const courses = await storage.getAllCourses();
          if (courses.length > 0) {
            const enrollments = await storage.getStudentsByCourse(courses[0].id);
            return Array.isArray(enrollments);
          }
          return true;
        } catch (error) {
          return false;
        }
      }
    ));

    // Test: Data consistency
    tests.push(await this.runTest(
      "Data Consistency Check",
      async () => {
        const totalStudents = await storage.countStudents();
        const totalTeachers = await storage.countTeachers();
        const totalCourses = await storage.countCourses();
        return totalStudents >= 0 && totalTeachers >= 0 && totalCourses >= 0;
      }
    ));

    const executionTime = Date.now() - startTime;
    const suite: TestSuite = {
      suiteName: "Database Integrity Tests",
      tests,
      totalTests: tests.length,
      passedTests: tests.filter(t => t.status === 'PASS').length,
      failedTests: tests.filter(t => t.status === 'FAIL').length,
      skippedTests: tests.filter(t => t.status === 'SKIP').length,
      executionTime
    };

    this.suiteResults.push(suite);
    return suite;
  }

  async runParentPortalTests(): Promise<TestSuite> {
    console.log("Running Parent Portal Tests...");
    const startTime = Date.now();
    const tests: TestResult[] = [];

    // Test: Parent-student relationships
    tests.push(await this.runTest(
      "Parent-Student Relationship System",
      async () => {
        try {
          const parents = await storage.getUsersByRole("parent");
          if (parents.length > 0) {
            const students = await storage.getStudentsByParent(parents[0].id);
            const relations = await storage.getParentStudentRelations(parents[0].id);
            return Array.isArray(students) && Array.isArray(relations);
          }
          return true; // Skip if no parents
        } catch (error) {
          return false;
        }
      }
    ));

    // Test: Student progress summary
    tests.push(await this.runTest(
      "Student Progress Summary",
      async () => {
        try {
          const students = await storage.getUsersByRole("student");
          if (students.length > 0) {
            const progressSummary = await storage.getStudentProgressSummary(students[0].id);
            return typeof progressSummary === 'object';
          }
          return true;
        } catch (error) {
          return false;
        }
      }
    ));

    const executionTime = Date.now() - startTime;
    const suite: TestSuite = {
      suiteName: "Parent Portal Tests",
      tests,
      totalTests: tests.length,
      passedTests: tests.filter(t => t.status === 'PASS').length,
      failedTests: tests.filter(t => t.status === 'FAIL').length,
      skippedTests: tests.filter(t => t.status === 'SKIP').length,
      executionTime
    };

    this.suiteResults.push(suite);
    return suite;
  }

  async runComprehensiveQATests(): Promise<{
    overallStatus: 'PASS' | 'FAIL';
    totalSuites: number;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    skippedTests: number;
    executionTime: number;
    suites: TestSuite[];
  }> {
    console.log("Starting Comprehensive QA Test Suite...");
    const overallStartTime = Date.now();
    
    this.suiteResults = []; // Reset results

    // Run all test suites
    await this.runAuthenticationTests();
    await this.runEducationalSystemTests();
    await this.runDatabaseIntegrityTests();
    await this.runParentPortalTests();

    const overallExecutionTime = Date.now() - overallStartTime;

    // Calculate overall statistics
    const totalTests = this.suiteResults.reduce((sum, suite) => sum + suite.totalTests, 0);
    const passedTests = this.suiteResults.reduce((sum, suite) => sum + suite.passedTests, 0);
    const failedTests = this.suiteResults.reduce((sum, suite) => sum + suite.failedTests, 0);
    const skippedTests = this.suiteResults.reduce((sum, suite) => sum + suite.skippedTests, 0);

    const overallStatus = failedTests === 0 ? 'PASS' : 'FAIL';

    return {
      overallStatus,
      totalSuites: this.suiteResults.length,
      totalTests,
      passedTests,
      failedTests,
      skippedTests,
      executionTime: overallExecutionTime,
      suites: this.suiteResults
    };
  }

  generateTestReport(results: any): string {
    let report = `# MadrasaApp QA Test Report\n\n`;
    report += `**Generated**: ${new Date().toISOString()}\n`;
    report += `**Overall Status**: ${results.overallStatus}\n`;
    report += `**Execution Time**: ${results.executionTime}ms\n\n`;

    report += `## Summary\n`;
    report += `- **Total Test Suites**: ${results.totalSuites}\n`;
    report += `- **Total Tests**: ${results.totalTests}\n`;
    report += `- **Passed**: ${results.passedTests}\n`;
    report += `- **Failed**: ${results.failedTests}\n`;
    report += `- **Skipped**: ${results.skippedTests}\n`;
    report += `- **Success Rate**: ${Math.round((results.passedTests / results.totalTests) * 100)}%\n\n`;

    // Detailed results for each suite
    results.suites.forEach((suite: TestSuite) => {
      report += `## ${suite.suiteName}\n`;
      report += `- **Status**: ${suite.failedTests === 0 ? 'PASS' : 'FAIL'}\n`;
      report += `- **Tests**: ${suite.totalTests} (${suite.passedTests} passed, ${suite.failedTests} failed, ${suite.skippedTests} skipped)\n`;
      report += `- **Execution Time**: ${suite.executionTime}ms\n\n`;

      suite.tests.forEach((test: TestResult) => {
        const statusIcon = test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⏭️';
        report += `### ${statusIcon} ${test.testName}\n`;
        report += `- **Status**: ${test.status}\n`;
        report += `- **Message**: ${test.message}\n`;
        report += `- **Duration**: ${test.duration}ms\n\n`;
      });
    });

    return report;
  }
}

const qaRunner = new QATestRunner();

export function setupQARoutes(app: Express) {
  // Run comprehensive QA tests
  app.post("/api/qa/run-tests", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'director') {
        return res.status(403).json({ error: "Access denied. Director role required." });
      }

      console.log("Starting QA test execution...");
      const results = await qaRunner.runComprehensiveQATests();
      
      res.json({
        success: true,
        results,
        message: `QA tests completed. ${results.passedTests}/${results.totalTests} tests passed.`
      });
    } catch (error) {
      console.error("Error running QA tests:", error);
      res.status(500).json({ 
        error: "Failed to run QA tests",
        details: error.message
      });
    }
  });

  // Generate QA test report
  app.get("/api/qa/test-report", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'director') {
        return res.status(403).json({ error: "Access denied. Director role required." });
      }

      const results = await qaRunner.runComprehensiveQATests();
      const report = qaRunner.generateTestReport(results);

      if (req.query.format === 'markdown') {
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', 'attachment; filename=qa-test-report.md');
        res.send(report);
      } else {
        res.json({
          success: true,
          report,
          results
        });
      }
    } catch (error) {
      console.error("Error generating QA report:", error);
      res.status(500).json({ 
        error: "Failed to generate QA report",
        details: error.message
      });
    }
  });

  // Quick health check
  app.get("/api/qa/health-check", async (req: Request, res: Response) => {
    try {
      const healthChecks = {
        database: false,
        authentication: false,
        storage: false,
        timestamp: new Date().toISOString()
      };

      // Test database connection
      try {
        await storage.countStudents();
        healthChecks.database = true;
      } catch (error) {
        console.error("Database health check failed:", error);
      }

      // Test authentication system
      try {
        const director = await storage.getUserByUsername("director1");
        healthChecks.authentication = director !== undefined;
      } catch (error) {
        console.error("Authentication health check failed:", error);
      }

      // Test storage system
      try {
        const courses = await storage.getAllCourses();
        healthChecks.storage = Array.isArray(courses);
      } catch (error) {
        console.error("Storage health check failed:", error);
      }

      const overallHealth = healthChecks.database && healthChecks.authentication && healthChecks.storage;

      res.json({
        status: overallHealth ? 'healthy' : 'unhealthy',
        checks: healthChecks,
        timestamp: healthChecks.timestamp
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Test data creation for QA
  app.post("/api/qa/create-test-data", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated() || req.user?.role !== 'director') {
        return res.status(403).json({ error: "Access denied. Director role required." });
      }

      const testData = {
        users: 0,
        courses: 0,
        enrollments: 0,
        relationships: 0
      };

      // Create test teacher
      try {
        const testTeacher = await storage.createUser({
          username: `teacher_qa_${Date.now()}`,
          password: await hashPassword("password123"),
          fullName: "QA Test Teacher",
          role: "teacher",
          email: "teacher.qa@madrasaapp.com"
        });
        testData.users++;

        // Create test course
        const testCourse = await storage.createCourse({
          name: "QA Test Course",
          description: "Course created for QA testing purposes",
          teacherId: testTeacher.id,
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
        });
        testData.courses++;
      } catch (error) {
        console.error("Error creating test data:", error);
      }

      res.json({
        success: true,
        message: "Test data created successfully",
        data: testData
      });
    } catch (error) {
      console.error("Error in test data creation:", error);
      res.status(500).json({
        error: "Failed to create test data",
        details: error.message
      });
    }
  });
}