import { Express, Request, Response } from "express";
import { requireAuth } from "./auth";
import { storage } from "./storage";

interface StudyGroup {
  id: number;
  name: string;
  description: string;
  courseId: number;
  teacherId: number;
  maxMembers: number;
  currentMembers: number;
  memberIds: number[];
  type: 'memorization' | 'arabic' | 'islamic_history' | 'general';
  meetingSchedule: string;
  isActive: boolean;
  createdAt: Date;
}

interface StudyGroupMembership {
  groupId: number;
  studentId: number;
  joinedAt: Date;
  role: 'member' | 'leader';
  contributions: number;
}

interface IslamicCalendarEvent {
  id: number;
  name: string;
  type: 'religious' | 'historical' | 'educational';
  hijriDate: string;
  gregorianDate: string;
  description: string;
  significance: string;
  educationalContent: string[];
  recommendedActivities: string[];
  isActive: boolean;
}

interface MadrasaNetwork {
  id: number;
  name: string;
  location: string;
  contactEmail: string;
  establishedYear: number;
  studentCount: number;
  specializations: string[];
  isPartner: boolean;
  connectionType: 'sister_school' | 'exchange_program' | 'resource_sharing';
  joinedAt: Date;
}

interface KnowledgeSharing {
  id: number;
  title: string;
  content: string;
  category: 'curriculum' | 'teaching_methods' | 'resources' | 'events';
  authorId: number;
  madrasaId: number;
  tags: string[];
  likes: number;
  comments: number;
  isPublic: boolean;
  createdAt: Date;
}

class CommunityService {
  private studyGroups: StudyGroup[] = [];
  private studyGroupMemberships: StudyGroupMembership[] = [];
  private islamicCalendarEvents: IslamicCalendarEvent[] = [];
  private madrasaNetwork: MadrasaNetwork[] = [];
  private knowledgeSharing: KnowledgeSharing[] = [];

  async createStudyGroup(groupData: Omit<StudyGroup, 'id' | 'currentMembers' | 'memberIds' | 'createdAt'>): Promise<StudyGroup> {
    const studyGroup: StudyGroup = {
      id: this.studyGroups.length + 1,
      ...groupData,
      currentMembers: 0,
      memberIds: [],
      createdAt: new Date()
    };
    
    this.studyGroups.push(studyGroup);
    return studyGroup;
  }

  async joinStudyGroup(groupId: number, studentId: number): Promise<{ success: boolean; message: string }> {
    const group = this.studyGroups.find(g => g.id === groupId);
    if (!group) {
      return { success: false, message: "Study group not found" };
    }

    if (group.currentMembers >= group.maxMembers) {
      return { success: false, message: "Study group is full" };
    }

    if (group.memberIds.includes(studentId)) {
      return { success: false, message: "Already a member of this group" };
    }

    group.memberIds.push(studentId);
    group.currentMembers++;

    const membership: StudyGroupMembership = {
      groupId,
      studentId,
      joinedAt: new Date(),
      role: 'member',
      contributions: 0
    };

    this.studyGroupMemberships.push(membership);

    return { success: true, message: "Successfully joined study group" };
  }

  async getStudyGroups(courseId?: number, type?: string): Promise<StudyGroup[]> {
    let groups = this.studyGroups.filter(group => group.isActive);
    
    if (courseId) {
      groups = groups.filter(group => group.courseId === courseId);
    }
    
    if (type) {
      groups = groups.filter(group => group.type === type);
    }
    
    return groups;
  }

  async getIslamicCalendarEvents(month?: number, year?: number): Promise<IslamicCalendarEvent[]> {
    let events = this.islamicCalendarEvents.filter(event => event.isActive);
    
    if (month && year) {
      events = events.filter(event => {
        const eventDate = new Date(event.gregorianDate);
        return eventDate.getMonth() === month - 1 && eventDate.getFullYear() === year;
      });
    }
    
    return events.sort((a, b) => new Date(a.gregorianDate).getTime() - new Date(b.gregorianDate).getTime());
  }

  async getMadrasaNetwork(): Promise<MadrasaNetwork[]> {
    return this.madrasaNetwork.filter(madrasa => madrasa.isPartner);
  }

  async shareKnowledge(knowledgeData: Omit<KnowledgeSharing, 'id' | 'likes' | 'comments' | 'createdAt'>): Promise<KnowledgeSharing> {
    const knowledge: KnowledgeSharing = {
      id: this.knowledgeSharing.length + 1,
      ...knowledgeData,
      likes: 0,
      comments: 0,
      createdAt: new Date()
    };
    
    this.knowledgeSharing.push(knowledge);
    return knowledge;
  }

  async getSharedKnowledge(category?: string): Promise<KnowledgeSharing[]> {
    let knowledge = this.knowledgeSharing.filter(k => k.isPublic);
    
    if (category) {
      knowledge = knowledge.filter(k => k.category === category);
    }
    
    return knowledge.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Initialize sample data
  initializeSampleData() {
    // Sample study groups
    this.studyGroups = [
      {
        id: 1,
        name: "Quran Memorization Circle",
        description: "Weekly group for practicing Quran memorization with peer support",
        courseId: 1,
        teacherId: 8,
        maxMembers: 10,
        currentMembers: 7,
        memberIds: [1, 2, 3, 4, 5, 6, 7],
        type: 'memorization',
        meetingSchedule: "Every Tuesday 4:00 PM",
        isActive: true,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        name: "Arabic Conversation Practice",
        description: "Interactive sessions to improve Arabic speaking skills",
        courseId: 2,
        teacherId: 9,
        maxMembers: 8,
        currentMembers: 5,
        memberIds: [2, 3, 5, 8, 9],
        type: 'arabic',
        meetingSchedule: "Every Thursday 3:30 PM",
        isActive: true,
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)
      },
      {
        id: 3,
        name: "Islamic History Scholars",
        description: "Deep dive into Islamic civilization and historical events",
        courseId: 3,
        teacherId: 8,
        maxMembers: 12,
        currentMembers: 9,
        memberIds: [1, 4, 6, 7, 8, 10, 11, 12, 13],
        type: 'islamic_history',
        meetingSchedule: "Every Saturday 10:00 AM",
        isActive: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    ];

    // Sample Islamic calendar events
    this.islamicCalendarEvents = [
      {
        id: 1,
        name: "Ramadan Begins",
        type: 'religious',
        hijriDate: "1 Ramadan 1446",
        gregorianDate: "2025-02-28",
        description: "The holy month of fasting begins",
        significance: "Month of spiritual reflection, self-discipline, and increased devotion",
        educationalContent: [
          "The importance of fasting in Islam",
          "Spiritual benefits of Ramadan",
          "Community and charity during Ramadan"
        ],
        recommendedActivities: [
          "Begin daily fasting",
          "Increase Quran recitation",
          "Engage in charity (Zakat)",
          "Attend Tarawih prayers"
        ],
        isActive: true
      },
      {
        id: 2,
        name: "Laylat al-Qadr",
        type: 'religious',
        hijriDate: "27 Ramadan 1446",
        gregorianDate: "2025-03-26",
        description: "The Night of Power - better than a thousand months",
        significance: "The night when the Quran was first revealed to Prophet Muhammad (PBUH)",
        educationalContent: [
          "The revelation of the Quran",
          "The significance of this blessed night",
          "Recommended prayers and supplications"
        ],
        recommendedActivities: [
          "Night-long prayers and meditation",
          "Quran recitation",
          "Making sincere du'a",
          "Seeking forgiveness"
        ],
        isActive: true
      },
      {
        id: 3,
        name: "Eid al-Fitr",
        type: 'religious',
        hijriDate: "1 Shawwal 1446",
        gregorianDate: "2025-03-30",
        description: "Festival of Breaking the Fast",
        significance: "Celebration marking the end of Ramadan fasting",
        educationalContent: [
          "The joy of completing Ramadan",
          "Community celebration and unity",
          "Gratitude and charity"
        ],
        recommendedActivities: [
          "Eid prayers",
          "Community gatherings",
          "Gift giving",
          "Charitable donations (Zakat al-Fitr)"
        ],
        isActive: true
      },
      {
        id: 4,
        name: "Islamic New Year",
        type: 'historical',
        hijriDate: "1 Muharram 1447",
        gregorianDate: "2025-06-26",
        description: "Beginning of the Islamic calendar year",
        significance: "Marks the migration (Hijra) of Prophet Muhammad (PBUH) from Mecca to Medina",
        educationalContent: [
          "The significance of Hijra",
          "Early Islamic community in Medina",
          "Lessons from the Prophet's migration"
        ],
        recommendedActivities: [
          "Study the history of Hijra",
          "Reflect on new beginnings",
          "Set spiritual goals for the new year",
          "Community discussions"
        ],
        isActive: true
      }
    ];

    // Sample madrasa network
    this.madrasaNetwork = [
      {
        id: 1,
        name: "Al-Azhar Academy",
        location: "Cairo, Egypt",
        contactEmail: "info@alazharacademy.edu",
        establishedYear: 1985,
        studentCount: 850,
        specializations: ["Quran Studies", "Islamic Jurisprudence", "Arabic Literature"],
        isPartner: true,
        connectionType: 'sister_school',
        joinedAt: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        name: "Madinah Institute",
        location: "London, UK",
        contactEmail: "contact@madinahinstitute.org",
        establishedYear: 1998,
        studentCount: 420,
        specializations: ["Islamic History", "Comparative Religion", "Modern Islamic Thought"],
        isPartner: true,
        connectionType: 'exchange_program',
        joinedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
      },
      {
        id: 3,
        name: "Darul Uloom Singapore",
        location: "Singapore",
        contactEmail: "admin@darululoom.sg",
        establishedYear: 2005,
        studentCount: 320,
        specializations: ["Hadith Studies", "Islamic Finance", "Community Leadership"],
        isPartner: true,
        connectionType: 'resource_sharing',
        joinedAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      }
    ];

    // Sample knowledge sharing
    this.knowledgeSharing = [
      {
        id: 1,
        title: "Effective Quran Memorization Techniques",
        content: "A comprehensive guide to memorizing the Quran using proven methods including repetition patterns, understanding meaning, and creating mental associations.",
        category: 'teaching_methods',
        authorId: 8,
        madrasaId: 1,
        tags: ["memorization", "quran", "teaching", "methods"],
        likes: 45,
        comments: 12,
        isPublic: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: 2,
        title: "Interactive Arabic Learning Resources",
        content: "Collection of digital tools and games that make Arabic language learning engaging for students of all ages.",
        category: 'resources',
        authorId: 9,
        madrasaId: 2,
        tags: ["arabic", "interactive", "resources", "technology"],
        likes: 32,
        comments: 8,
        isPublic: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: 3,
        title: "Organizing Islamic History Exhibitions",
        content: "Step-by-step guide to creating educational exhibitions that bring Islamic history to life for students and the community.",
        category: 'events',
        authorId: 8,
        madrasaId: 1,
        tags: ["history", "exhibitions", "community", "education"],
        likes: 28,
        comments: 15,
        isPublic: true,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ];
  }
}

const communityService = new CommunityService();
communityService.initializeSampleData();

export function setupCommunityRoutes(app: Express) {
  // Get study groups
  app.get("/api/community/study-groups", requireAuth, async (req: Request, res: Response) => {
    try {
      const courseId = req.query.courseId ? parseInt(req.query.courseId as string) : undefined;
      const type = req.query.type as string;
      
      const studyGroups = await communityService.getStudyGroups(courseId, type);
      res.json(studyGroups);
    } catch (error) {
      console.error("Error fetching study groups:", error);
      res.status(500).json({ error: "Failed to fetch study groups" });
    }
  });

  // Create study group
  app.post("/api/community/study-groups", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!['teacher', 'director'].includes(req.user?.role || '')) {
        return res.status(403).json({ error: "Access denied. Teacher or Director role required." });
      }

      const groupData = {
        ...req.body,
        teacherId: req.user.id
      };
      
      const studyGroup = await communityService.createStudyGroup(groupData);
      res.status(201).json(studyGroup);
    } catch (error) {
      console.error("Error creating study group:", error);
      res.status(500).json({ error: "Failed to create study group" });
    }
  });

  // Join study group
  app.post("/api/community/study-groups/:groupId/join", requireAuth, async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'student') {
        return res.status(403).json({ error: "Access denied. Student role required." });
      }

      const groupId = parseInt(req.params.groupId);
      const result = await communityService.joinStudyGroup(groupId, req.user.id);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("Error joining study group:", error);
      res.status(500).json({ error: "Failed to join study group" });
    }
  });

  // Get Islamic calendar events
  app.get("/api/community/islamic-calendar", requireAuth, async (req: Request, res: Response) => {
    try {
      const month = req.query.month ? parseInt(req.query.month as string) : undefined;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      
      const events = await communityService.getIslamicCalendarEvents(month, year);
      res.json(events);
    } catch (error) {
      console.error("Error fetching Islamic calendar events:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  // Get today's Islamic events
  app.get("/api/community/islamic-calendar/today", requireAuth, async (req: Request, res: Response) => {
    try {
      const today = new Date();
      const events = await communityService.getIslamicCalendarEvents(today.getMonth() + 1, today.getFullYear());
      
      const todayEvents = events.filter(event => {
        const eventDate = new Date(event.gregorianDate);
        return eventDate.toDateString() === today.toDateString();
      });
      
      res.json(todayEvents);
    } catch (error) {
      console.error("Error fetching today's events:", error);
      res.status(500).json({ error: "Failed to fetch today's events" });
    }
  });

  // Get madrasa network
  app.get("/api/community/madrasa-network", requireAuth, async (req: Request, res: Response) => {
    try {
      const network = await communityService.getMadrasaNetwork();
      res.json(network);
    } catch (error) {
      console.error("Error fetching madrasa network:", error);
      res.status(500).json({ error: "Failed to fetch madrasa network" });
    }
  });

  // Get shared knowledge
  app.get("/api/community/knowledge-sharing", requireAuth, async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string;
      const knowledge = await communityService.getSharedKnowledge(category);
      res.json(knowledge);
    } catch (error) {
      console.error("Error fetching shared knowledge:", error);
      res.status(500).json({ error: "Failed to fetch shared knowledge" });
    }
  });

  // Share knowledge
  app.post("/api/community/knowledge-sharing", requireAuth, async (req: Request, res: Response) => {
    try {
      if (!['teacher', 'director'].includes(req.user?.role || '')) {
        return res.status(403).json({ error: "Access denied. Teacher or Director role required." });
      }

      const knowledgeData = {
        ...req.body,
        authorId: req.user.id,
        madrasaId: 1 // Would be dynamic based on user's madrasa
      };
      
      const knowledge = await communityService.shareKnowledge(knowledgeData);
      res.status(201).json(knowledge);
    } catch (error) {
      console.error("Error sharing knowledge:", error);
      res.status(500).json({ error: "Failed to share knowledge" });
    }
  });
}