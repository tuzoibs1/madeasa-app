import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { smsService } from "./notifications";
import { format, isToday, isTomorrow, addDays } from "date-fns";

// Study Group Interface
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

// Islamic Calendar Event Interface
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

// Madrasa Network Interface
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
  // Study Groups Management
  async createStudyGroup(groupData: Omit<StudyGroup, 'id' | 'currentMembers' | 'memberIds' | 'createdAt'>): Promise<StudyGroup> {
    const groupId = Math.floor(Math.random() * 10000); // In real app, this would be auto-generated
    
    const studyGroup: StudyGroup = {
      id: groupId,
      ...groupData,
      currentMembers: 0,
      memberIds: [],
      createdAt: new Date()
    };

    // In real implementation, store in database
    return studyGroup;
  }

  async joinStudyGroup(groupId: number, studentId: number): Promise<{ success: boolean; message: string }> {
    try {
      const student = await storage.getUser(studentId);
      if (!student) {
        return { success: false, message: "Student not found" };
      }

      // Mock study group data - in real app, fetch from database
      const studyGroup = {
        id: groupId,
        name: "Quran Memorization Circle",
        currentMembers: 5,
        maxMembers: 10,
        type: 'memorization' as const
      };

      if (studyGroup.currentMembers >= studyGroup.maxMembers) {
        return { success: false, message: "Study group is full" };
      }

      // Send notification to group members
      const welcomeMessage = `🤝 ${student.fullName} has joined the ${studyGroup.name} study group! Let's welcome them and support each other's learning journey.`;
      
      return { 
        success: true, 
        message: "Successfully joined the study group! You'll receive updates about group activities." 
      };
    } catch (error) {
      return { success: false, message: "Failed to join study group" };
    }
  }

  async getStudyGroups(courseId?: number, type?: string): Promise<StudyGroup[]> {
    // Mock study groups data
    const studyGroups: StudyGroup[] = [
      {
        id: 1,
        name: "Quran Memorization Circle",
        description: "Daily memorization practice with peer support and teacher guidance",
        courseId: 1,
        teacherId: 3,
        maxMembers: 10,
        currentMembers: 7,
        memberIds: [6, 7, 8, 9, 10, 11, 12],
        type: 'memorization',
        meetingSchedule: "Daily at 7:00 AM and 6:00 PM",
        isActive: true,
        createdAt: new Date('2025-01-15')
      },
      {
        id: 2,
        name: "Arabic Conversation Partners",
        description: "Practice Arabic speaking with fellow students",
        courseId: 3,
        teacherId: 4,
        maxMembers: 8,
        currentMembers: 5,
        memberIds: [6, 13, 14, 15, 16],
        type: 'arabic',
        meetingSchedule: "Tuesdays and Thursdays at 4:00 PM",
        isActive: true,
        createdAt: new Date('2025-02-01')
      },
      {
        id: 3,
        name: "Islamic History Explorers",
        description: "Deep dive into Islamic civilization and historical events",
        courseId: 2,
        teacherId: 3,
        maxMembers: 12,
        currentMembers: 9,
        memberIds: [6, 7, 17, 18, 19, 20, 21, 22, 23],
        type: 'islamic_history',
        meetingSchedule: "Saturdays at 10:00 AM",
        isActive: true,
        createdAt: new Date('2025-01-20')
      }
    ];

    let filteredGroups = studyGroups;
    
    if (courseId) {
      filteredGroups = filteredGroups.filter(group => group.courseId === courseId);
    }
    
    if (type) {
      filteredGroups = filteredGroups.filter(group => group.type === type);
    }

    return filteredGroups;
  }

  // Islamic Calendar Integration
  async getIslamicCalendarEvents(month?: number, year?: number): Promise<IslamicCalendarEvent[]> {
    const islamicEvents: IslamicCalendarEvent[] = [
      {
        id: 1,
        name: "Laylat al-Qadr (Night of Decree)",
        type: 'religious',
        hijriDate: "27th Ramadan 1446",
        gregorianDate: "2025-03-27",
        description: "The night when the first verses of the Quran were revealed to Prophet Muhammad (PBUH)",
        significance: "This night is better than a thousand months. Muslims spend it in prayer and contemplation.",
        educationalContent: [
          "The revelation of the first verses of Surah Al-Alaq",
          "The importance of seeking knowledge in Islam",
          "The spiritual significance of the night",
          "Recommended prayers and supplications"
        ],
        recommendedActivities: [
          "Extended night prayers (Qiyam al-Layl)",
          "Reading and reflecting on the Quran",
          "Making du'a for forgiveness and guidance",
          "Studying the first revelation"
        ],
        isActive: true
      },
      {
        id: 2,
        name: "Eid al-Fitr",
        type: 'religious',
        hijriDate: "1st Shawwal 1446",
        gregorianDate: "2025-03-30",
        description: "Festival marking the end of Ramadan, the holy month of fasting",
        significance: "A celebration of spiritual achievement and community unity after a month of fasting and reflection.",
        educationalContent: [
          "The significance of completing Ramadan",
          "Zakat al-Fitr and its importance",
          "The spirit of giving and charity",
          "Community celebration and unity"
        ],
        recommendedActivities: [
          "Special Eid prayers at the mosque",
          "Giving Zakat al-Fitr to the needy",
          "Visiting family and friends",
          "Sharing meals and gifts with community"
        ],
        isActive: true
      },
      {
        id: 3,
        name: "Islamic New Year (Muharram)",
        type: 'religious',
        hijriDate: "1st Muharram 1447",
        gregorianDate: "2025-06-26",
        description: "The beginning of the Islamic lunar calendar year",
        significance: "A time for reflection on the Hijra (migration) of Prophet Muhammad from Mecca to Medina.",
        educationalContent: [
          "The history of the Islamic calendar",
          "The significance of the Hijra",
          "The four sacred months in Islam",
          "Setting spiritual goals for the new year"
        ],
        recommendedActivities: [
          "Learning about Islamic history",
          "Setting spiritual resolutions",
          "Studying the story of the Hijra",
          "Community discussions on Islamic values"
        ],
        isActive: true
      },
      {
        id: 4,
        name: "Day of Ashura",
        type: 'historical',
        hijriDate: "10th Muharram 1447",
        gregorianDate: "2025-07-05",
        description: "Commemorating various significant events in Islamic history",
        significance: "Marks multiple historical events including the salvation of Prophet Musa (Moses) and his people.",
        educationalContent: [
          "The story of Prophet Musa and Pharaoh",
          "The significance of fasting on Ashura",
          "Various historical events on this day",
          "The importance of gratitude and reflection"
        ],
        recommendedActivities: [
          "Optional fasting",
          "Learning about Prophet Musa's story",
          "Acts of charity and kindness",
          "Family discussions about Islamic history"
        ],
        isActive: true
      },
      {
        id: 5,
        name: "Mawlid an-Nabi (Prophet's Birthday)",
        type: 'religious',
        hijriDate: "12th Rabi' al-Awwal 1447",
        gregorianDate: "2025-09-05",
        description: "Commemorating the birth of Prophet Muhammad (PBUH)",
        significance: "A time to reflect on the life, teachings, and character of the final messenger.",
        educationalContent: [
          "The life and character of Prophet Muhammad",
          "Key teachings and sayings (Hadith)",
          "The Prophet's role as a teacher and guide",
          "Following the Prophetic example (Sunnah)"
        ],
        recommendedActivities: [
          "Reading about the Prophet's life (Seerah)",
          "Sharing stories of the Prophet's kindness",
          "Acts of charity in his honor",
          "Community gatherings for learning"
        ],
        isActive: true
      }
    ];

    return islamicEvents;
  }

  // Madrasa Network Features
  async getMadrasaNetwork(): Promise<MadrasaNetwork[]> {
    const network: MadrasaNetwork[] = [
      {
        id: 1,
        name: "Al-Noor Islamic Academy",
        location: "London, UK",
        contactEmail: "info@alnoor.edu",
        establishedYear: 1995,
        studentCount: 450,
        specializations: ["Quran Memorization", "Arabic Language", "Islamic Studies"],
        isPartner: true,
        connectionType: 'sister_school',
        joinedAt: new Date('2024-01-15')
      },
      {
        id: 2,
        name: "Madrasa Al-Furqan",
        location: "Toronto, Canada",
        contactEmail: "admin@alfurqan.ca",
        establishedYear: 2002,
        studentCount: 320,
        specializations: ["Tajweed", "Islamic History", "Hadith Studies"],
        isPartner: true,
        connectionType: 'exchange_program',
        joinedAt: new Date('2024-03-10')
      },
      {
        id: 3,
        name: "Dar Al-Ilm Institute",
        location: "Sydney, Australia",
        contactEmail: "contact@daralilm.edu.au",
        establishedYear: 1998,
        studentCount: 280,
        specializations: ["Fiqh", "Arabic Grammar", "Quran Studies"],
        isPartner: true,
        connectionType: 'resource_sharing',
        joinedAt: new Date('2024-05-20')
      },
      {
        id: 4,
        name: "Islamic Learning Center",
        location: "Chicago, USA",
        contactEmail: "info@ilcchicago.org",
        establishedYear: 2005,
        studentCount: 380,
        specializations: ["Youth Programs", "Family Education", "Community Outreach"],
        isPartner: true,
        connectionType: 'sister_school',
        joinedAt: new Date('2024-02-28')
      }
    ];

    return network;
  }

  async shareKnowledge(knowledgeData: Omit<KnowledgeSharing, 'id' | 'likes' | 'comments' | 'createdAt'>): Promise<KnowledgeSharing> {
    const shareId = Math.floor(Math.random() * 10000);
    
    const knowledge: KnowledgeSharing = {
      id: shareId,
      ...knowledgeData,
      likes: 0,
      comments: 0,
      createdAt: new Date()
    };

    return knowledge;
  }

  async getSharedKnowledge(category?: string): Promise<KnowledgeSharing[]> {
    const knowledgeBase: KnowledgeSharing[] = [
      {
        id: 1,
        title: "Effective Memorization Techniques for Young Students",
        content: "A comprehensive guide on helping children memorize Quran verses using visual aids, repetition schedules, and peer support methods.",
        category: 'teaching_methods',
        authorId: 3,
        madrasaId: 1,
        tags: ['memorization', 'children', 'teaching', 'quran'],
        likes: 24,
        comments: 8,
        isPublic: true,
        createdAt: new Date('2025-01-10')
      },
      {
        id: 2,
        title: "Arabic Language Learning Resources",
        content: "Collection of interactive games, worksheets, and digital tools for teaching Arabic alphabet and basic vocabulary to beginners.",
        category: 'resources',
        authorId: 4,
        madrasaId: 2,
        tags: ['arabic', 'resources', 'beginners', 'interactive'],
        likes: 18,
        comments: 5,
        isPublic: true,
        createdAt: new Date('2025-01-15')
      },
      {
        id: 3,
        title: "Islamic History Timeline Project",
        content: "Step-by-step guide to creating an interactive timeline of major Islamic historical events for classroom engagement.",
        category: 'curriculum',
        authorId: 5,
        madrasaId: 3,
        tags: ['history', 'timeline', 'interactive', 'classroom'],
        likes: 32,
        comments: 12,
        isPublic: true,
        createdAt: new Date('2025-01-20')
      }
    ];

    if (category) {
      return knowledgeBase.filter(item => item.category === category);
    }

    return knowledgeBase;
  }
}

const communityService = new CommunityService();

export function setupCommunityRoutes(app: Express) {
  // Study Groups APIs
  app.get("/api/community/study-groups", async (req: Request, res: Response) => {
    try {
      const { courseId, type } = req.query;
      const groups = await communityService.getStudyGroups(
        courseId ? parseInt(courseId as string) : undefined,
        type as string
      );
      res.json({ success: true, studyGroups: groups });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch study groups" });
    }
  });

  app.post("/api/community/study-groups", async (req: Request, res: Response) => {
    try {
      const groupData = req.body;
      const newGroup = await communityService.createStudyGroup(groupData);
      res.json({ success: true, studyGroup: newGroup });
    } catch (error) {
      res.status(500).json({ error: "Failed to create study group" });
    }
  });

  app.post("/api/community/study-groups/:groupId/join", async (req: Request, res: Response) => {
    try {
      const { groupId } = req.params;
      const { studentId } = req.body;
      
      const result = await communityService.joinStudyGroup(parseInt(groupId), studentId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to join study group" });
    }
  });

  // Islamic Calendar APIs
  app.get("/api/community/islamic-calendar", async (req: Request, res: Response) => {
    try {
      const { month, year } = req.query;
      const events = await communityService.getIslamicCalendarEvents(
        month ? parseInt(month as string) : undefined,
        year ? parseInt(year as string) : undefined
      );
      res.json({ success: true, events });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  app.get("/api/community/islamic-calendar/today", async (req: Request, res: Response) => {
    try {
      const allEvents = await communityService.getIslamicCalendarEvents();
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const todayEvents = allEvents.filter(event => event.gregorianDate === today);
      const upcomingEvents = allEvents.filter(event => {
        const eventDate = new Date(event.gregorianDate);
        const now = new Date();
        return eventDate > now && eventDate <= addDays(now, 7);
      });

      res.json({ 
        success: true, 
        todayEvents,
        upcomingEvents: upcomingEvents.slice(0, 3)
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch today's events" });
    }
  });

  // Madrasa Network APIs
  app.get("/api/community/madrasa-network", async (req: Request, res: Response) => {
    try {
      const network = await communityService.getMadrasaNetwork();
      res.json({ success: true, network });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch madrasa network" });
    }
  });

  app.get("/api/community/knowledge-sharing", async (req: Request, res: Response) => {
    try {
      const { category } = req.query;
      const knowledge = await communityService.getSharedKnowledge(category as string);
      res.json({ success: true, knowledge });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shared knowledge" });
    }
  });

  app.post("/api/community/knowledge-sharing", async (req: Request, res: Response) => {
    try {
      const knowledgeData = req.body;
      const newKnowledge = await communityService.shareKnowledge(knowledgeData);
      res.json({ success: true, knowledge: newKnowledge });
    } catch (error) {
      res.status(500).json({ error: "Failed to share knowledge" });
    }
  });
}

export { communityService, CommunityService };