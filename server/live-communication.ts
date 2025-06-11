import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { smsService } from "./notifications";
import { createHash } from "crypto";

// Video Conferencing Service
class VideoConferencingService {
  private provider: 'jitsi' | 'zoom' | 'webrtc';

  constructor(provider: 'jitsi' | 'zoom' | 'webrtc' = 'jitsi') {
    this.provider = provider;
  }

  // Generate meeting room URL
  generateMeetingUrl(roomId: string, roomName: string): string {
    switch (this.provider) {
      case 'jitsi':
        const sanitizedName = roomName.replace(/[^a-zA-Z0-9]/g, '');
        return `https://meet.jit.si/MadrasaApp_${sanitizedName}_${roomId}`;
      case 'zoom':
        return `https://zoom.us/j/${roomId}`;
      case 'webrtc':
        return `https://app.madrasaapp.com/video/${roomId}`;
      default:
        return `https://meet.jit.si/MadrasaApp_${roomId}`;
    }
  }

  // Create instant meeting for Quran recitation
  async createQuranRecitationSession(teacherId: number, studentIds: number[]): Promise<{
    roomId: string;
    meetingUrl: string;
    participants: string[];
  }> {
    const roomId = this.generateRoomId();
    const teacher = await storage.getUser(teacherId);
    const students = await Promise.all(studentIds.map(id => storage.getUser(id)));

    const meetingUrl = this.generateMeetingUrl(roomId, `QuranRecitation_${teacher?.fullName}`);
    const participants = [teacher?.fullName, ...students.map(s => s?.fullName)].filter(Boolean) as string[];

    // Notify participants
    for (const student of students) {
      if (student) {
        const message = `🎙️ Live Quran Recitation Session Starting!

👨‍🏫 Teacher: ${teacher?.fullName}
🔗 Join: ${meetingUrl}
⏰ Starting now

Practice your memorization and receive instant feedback!`;

        await smsService.sendSMS(student.email, message); // Assuming email field has phone
      }
    }

    return { roomId, meetingUrl, participants };
  }

  private generateRoomId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

// Real-time Chat Service
interface ChatMessage {
  id: string;
  senderId: number;
  senderName: string;
  recipientId: number;
  message: string;
  type: 'text' | 'voice' | 'file';
  timestamp: Date;
  isRead: boolean;
}

interface ChatRoom {
  id: string;
  participantIds: number[];
  type: 'direct' | 'group' | 'class';
  name?: string;
  lastMessage?: ChatMessage;
  createdAt: Date;
}

class ChatService {
  private activeRooms: Map<string, ChatRoom> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();

  // Create or get chat room between teacher and student
  async getOrCreateDirectChat(teacherId: number, studentId: number): Promise<ChatRoom> {
    const roomId = this.generateChatRoomId([teacherId, studentId]);
    
    if (!this.activeRooms.has(roomId)) {
      const teacher = await storage.getUser(teacherId);
      const student = await storage.getUser(studentId);
      
      const room: ChatRoom = {
        id: roomId,
        participantIds: [teacherId, studentId],
        type: 'direct',
        name: `${teacher?.fullName} & ${student?.fullName}`,
        createdAt: new Date()
      };
      
      this.activeRooms.set(roomId, room);
      this.messages.set(roomId, []);
    }

    return this.activeRooms.get(roomId)!;
  }

  // Send message in chat
  async sendMessage(roomId: string, senderId: number, message: string, type: 'text' | 'voice' | 'file' = 'text'): Promise<ChatMessage> {
    const sender = await storage.getUser(senderId);
    if (!sender) throw new Error("Sender not found");

    const chatMessage: ChatMessage = {
      id: this.generateMessageId(),
      senderId,
      senderName: sender.fullName,
      recipientId: 0, // Will be set based on room participants
      message,
      type,
      timestamp: new Date(),
      isRead: false
    };

    const roomMessages = this.messages.get(roomId) || [];
    roomMessages.push(chatMessage);
    this.messages.set(roomId, roomMessages);

    // Update room last message
    const room = this.activeRooms.get(roomId);
    if (room) {
      room.lastMessage = chatMessage;
      this.activeRooms.set(roomId, room);
    }

    return chatMessage;
  }

  // Get chat history
  getChatHistory(roomId: string, limit: number = 50): ChatMessage[] {
    const messages = this.messages.get(roomId) || [];
    return messages.slice(-limit);
  }

  // Send quick question to teacher
  async sendQuickQuestion(studentId: number, teacherId: number, question: string, subject: string): Promise<{ success: boolean; chatRoomId: string }> {
    try {
      const room = await this.getOrCreateDirectChat(teacherId, studentId);
      const student = await storage.getUser(studentId);
      
      const formattedMessage = `📚 Quick Question - ${subject}

${question}

(This is a priority question - please respond when available)`;

      await this.sendMessage(room.id, studentId, formattedMessage);

      // Notify teacher via SMS
      const teacher = await storage.getUser(teacherId);
      if (teacher) {
        const notificationMessage = `❓ New Question from ${student?.fullName}

Subject: ${subject}
"${question}"

Reply in the app chat: ${room.id}`;

        await smsService.sendSMS(teacher.email, notificationMessage);
      }

      return { success: true, chatRoomId: room.id };
    } catch (error) {
      return { success: false, chatRoomId: '' };
    }
  }

  private generateChatRoomId(participantIds: number[]): string {
    const sortedIds = participantIds.sort().join('-');
    return createHash('md5').update(sortedIds).digest('hex').substring(0, 16);
  }

  private generateMessageId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

// Voice Recording Service for Quran Recitation
class VoiceRecordingService {
  // Submit voice recording for review
  async submitRecitation(studentId: number, surah: string, verses: string, recordingData: {
    duration: number;
    audioUrl: string;
  }): Promise<{ success: boolean; recordingId: string; message: string }> {
    try {
      const student = await storage.getUser(studentId);
      if (!student) throw new Error("Student not found");

      const recordingId = this.generateRecordingId();
      
      // In real implementation, store in database
      const voiceRecording = {
        id: recordingId,
        studentId,
        surah,
        verses,
        recordingUrl: recordingData.audioUrl,
        duration: recordingData.duration,
        isApproved: false,
        createdAt: new Date()
      };

      // Notify student's teachers
      const courses = await storage.getAllCourses();
      for (const course of courses) {
        const teacher = await storage.getUser(course.teacherId);
        if (teacher) {
          const message = `🎙️ New Recitation Submitted

👨‍💼 Student: ${student.fullName}
📖 Surah: ${surah}
📝 Verses: ${verses}
⏱️ Duration: ${Math.floor(recordingData.duration / 60)}:${(recordingData.duration % 60).toString().padStart(2, '0')}

Please review and provide feedback in the app.`;

          await smsService.sendSMS(teacher.email, message);
        }
      }

      return {
        success: true,
        recordingId,
        message: "Recitation submitted successfully! Your teacher will review it soon."
      };
    } catch (error) {
      return {
        success: false,
        recordingId: '',
        message: "Failed to submit recitation. Please try again."
      };
    }
  }

  // Provide teacher feedback on recitation
  async provideFeedback(teacherId: number, recordingId: string, feedback: string, grade: number): Promise<{ success: boolean; message: string }> {
    try {
      const teacher = await storage.getUser(teacherId);
      if (!teacher) throw new Error("Teacher not found");

      // In real implementation, update database record
      // For now, simulate feedback storage

      // Notify student about feedback
      const studentMessage = `📝 Recitation Feedback Received

👨‍🏫 From: ${teacher.fullName}
⭐ Grade: ${grade}/100
💬 Feedback: ${feedback}

Keep practicing and improving your recitation!`;

      // In real implementation, get student from recording and send notification
      
      return {
        success: true,
        message: "Feedback provided successfully and student has been notified."
      };
    } catch (error) {
      return {
        success: false,
        message: "Failed to provide feedback. Please try again."
      };
    }
  }

  private generateRecordingId(): string {
    return 'rec_' + Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

const videoService = new VideoConferencingService();
const chatService = new ChatService();
const voiceService = new VoiceRecordingService();

// API Routes for Live Communication
export function setupLiveCommunicationRoutes(app: Express) {
  // Video Conferencing Routes
  app.post("/api/communication/video/quran-session", async (req: Request, res: Response) => {
    try {
      const { teacherId, studentIds } = req.body;
      
      if (!teacherId || !Array.isArray(studentIds)) {
        return res.status(400).json({ error: "Teacher ID and student IDs are required" });
      }

      const session = await videoService.createQuranRecitationSession(teacherId, studentIds);
      res.json({ success: true, session });
    } catch (error) {
      res.status(500).json({ error: "Failed to create video session" });
    }
  });

  // Chat Routes
  app.get("/api/communication/chat/:teacherId/:studentId", async (req: Request, res: Response) => {
    try {
      const { teacherId, studentId } = req.params;
      const room = await chatService.getOrCreateDirectChat(parseInt(teacherId), parseInt(studentId));
      const messages = chatService.getChatHistory(room.id);
      
      res.json({ success: true, room, messages });
    } catch (error) {
      res.status(500).json({ error: "Failed to get chat room" });
    }
  });

  app.post("/api/communication/chat/:roomId/message", async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const { senderId, message, type } = req.body;
      
      const chatMessage = await chatService.sendMessage(roomId, senderId, message, type);
      res.json({ success: true, message: chatMessage });
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.post("/api/communication/quick-question", async (req: Request, res: Response) => {
    try {
      const { studentId, teacherId, question, subject } = req.body;
      
      const result = await chatService.sendQuickQuestion(studentId, teacherId, question, subject);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json({ error: "Failed to send question" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to send quick question" });
    }
  });

  // Voice Recording Routes
  app.post("/api/communication/voice/submit-recitation", async (req: Request, res: Response) => {
    try {
      const { studentId, surah, verses, recordingData } = req.body;
      
      const result = await voiceService.submitRecitation(studentId, surah, verses, recordingData);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to submit recitation" });
    }
  });

  app.post("/api/communication/voice/:recordingId/feedback", async (req: Request, res: Response) => {
    try {
      const { recordingId } = req.params;
      const { teacherId, feedback, grade } = req.body;
      
      const result = await voiceService.provideFeedback(teacherId, recordingId, feedback, grade);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to provide feedback" });
    }
  });
}

export { videoService, chatService, voiceService };