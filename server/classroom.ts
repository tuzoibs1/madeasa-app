import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { z } from "zod";

// Live classroom session management
export interface ClassroomSession {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  scheduledTime: Date;
  duration: number; // in minutes
  meetingUrl?: string;
  meetingId?: string;
  isActive: boolean;
  createdBy: number;
  createdAt: Date;
}

// Schema for creating classroom sessions
const createSessionSchema = z.object({
  courseId: z.number(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  scheduledTime: z.string().transform((str) => new Date(str)),
  duration: z.number().min(15).max(480), // 15 minutes to 8 hours
});

// Generate meeting room URL based on provider
class ClassroomService {
  private provider: 'jitsi' | 'zoom' | 'webrtc';

  constructor(provider: 'jitsi' | 'zoom' | 'webrtc' = 'jitsi') {
    this.provider = provider;
  }

  generateMeetingUrl(sessionId: number, title: string): string {
    switch (this.provider) {
      case 'jitsi':
        // Generate Jitsi Meet URL
        const roomName = `madrasaapp-${sessionId}-${title.replace(/[^a-zA-Z0-9]/g, '')}`
          .toLowerCase()
          .substring(0, 50);
        return `https://meet.jit.si/${roomName}`;
      
      case 'zoom':
        // For Zoom, you'd integrate with Zoom API to create meetings
        // This would require Zoom API credentials and meeting creation
        return `https://zoom.us/j/placeholder-${sessionId}`;
      
      case 'webrtc':
        // For custom WebRTC implementation
        return `/classroom/room/${sessionId}`;
      
      default:
        return `https://meet.jit.si/madrasaapp-${sessionId}`;
    }
  }

  async createSession(data: any, createdBy: number): Promise<ClassroomSession> {
    const meetingUrl = this.generateMeetingUrl(Date.now(), data.title);
    
    // In a real implementation, you'd save this to database
    const session: ClassroomSession = {
      id: Date.now(),
      courseId: data.courseId,
      title: data.title,
      description: data.description,
      scheduledTime: data.scheduledTime,
      duration: data.duration,
      meetingUrl,
      meetingId: `madrasaapp-${Date.now()}`,
      isActive: false,
      createdBy,
      createdAt: new Date()
    };

    return session;
  }

  async startSession(sessionId: number): Promise<boolean> {
    // Mark session as active and send notifications
    console.log(`Starting classroom session ${sessionId}`);
    
    // Here you could:
    // 1. Update session status in database
    // 2. Send SMS notifications to students/parents
    // 3. Create calendar events
    // 4. Log session start time
    
    return true;
  }

  async endSession(sessionId: number): Promise<boolean> {
    // Mark session as ended and handle cleanup
    console.log(`Ending classroom session ${sessionId}`);
    
    // Here you could:
    // 1. Update session status
    // 2. Store session recording metadata
    // 3. Generate attendance based on participation
    // 4. Send session summary notifications
    
    return true;
  }
}

const classroomService = new ClassroomService('jitsi');

// Temporary in-memory storage for sessions (replace with database)
const activeSessions: Map<number, ClassroomSession> = new Map();

export function setupClassroomRoutes(app: Express) {
  // Create a new classroom session
  app.post("/api/classroom/sessions", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      // Only teachers and directors can create sessions
      if (!['teacher', 'director'].includes(req.user?.role || '')) {
        return res.status(403).json({ error: "Insufficient permissions" });
      }

      const validData = createSessionSchema.parse(req.body);
      const session = await classroomService.createSession(validData, req.user!.id);
      
      // Store in temporary storage
      activeSessions.set(session.id, session);
      
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Failed to create classroom session:", error);
      res.status(500).json({ error: "Failed to create classroom session" });
    }
  });

  // Get all sessions for a course
  app.get("/api/courses/:courseId/sessions", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const courseId = parseInt(req.params.courseId);
      const courseSessions = Array.from(activeSessions.values())
        .filter(session => session.courseId === courseId)
        .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());

      res.json(courseSessions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  // Join a classroom session
  app.get("/api/classroom/sessions/:sessionId/join", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const sessionId = parseInt(req.params.sessionId);
      const session = activeSessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Check if user has access to this course
      // In a real app, you'd verify course enrollment here

      // Log participation
      console.log(`User ${req.user?.fullName} joined session ${sessionId}`);

      res.json({
        meetingUrl: session.meetingUrl,
        title: session.title,
        isActive: session.isActive
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to join session" });
    }
  });

  // Start a classroom session
  app.post("/api/classroom/sessions/:sessionId/start", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const sessionId = parseInt(req.params.sessionId);
      const session = activeSessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Only the creator or directors can start sessions
      if (session.createdBy !== req.user?.id && req.user?.role !== 'director') {
        return res.status(403).json({ error: "Only the session creator can start this session" });
      }

      // Update session status
      session.isActive = true;
      activeSessions.set(sessionId, session);

      await classroomService.startSession(sessionId);

      res.json({ success: true, message: "Session started" });
    } catch (error) {
      res.status(500).json({ error: "Failed to start session" });
    }
  });

  // End a classroom session
  app.post("/api/classroom/sessions/:sessionId/end", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const sessionId = parseInt(req.params.sessionId);
      const session = activeSessions.get(sessionId);

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      // Only the creator or directors can end sessions
      if (session.createdBy !== req.user?.id && req.user?.role !== 'director') {
        return res.status(403).json({ error: "Only the session creator can end this session" });
      }

      // Update session status
      session.isActive = false;
      activeSessions.set(sessionId, session);

      await classroomService.endSession(sessionId);

      res.json({ success: true, message: "Session ended" });
    } catch (error) {
      res.status(500).json({ error: "Failed to end session" });
    }
  });

  // Get active sessions (for dashboard display)
  app.get("/api/classroom/active-sessions", async (req: Request, res: Response) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const activeSessionsList = Array.from(activeSessions.values())
        .filter(session => session.isActive)
        .map(session => ({
          id: session.id,
          title: session.title,
          courseId: session.courseId,
          scheduledTime: session.scheduledTime,
          isActive: session.isActive
        }));

      res.json(activeSessionsList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active sessions" });
    }
  });
}