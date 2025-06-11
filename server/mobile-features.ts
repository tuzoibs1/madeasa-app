import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { smsService } from "./notifications";
import { format, addMinutes, isAfter, isBefore } from "date-fns";

// Prayer Times Service
class PrayerTimesService {
  // Get prayer times for a specific location and date
  async getPrayerTimes(latitude: number, longitude: number, date: Date): Promise<{
    location: string;
    date: string;
    prayers: {
      fajr: string;
      sunrise: string;
      dhuhr: string;
      asr: string;
      maghrib: string;
      isha: string;
    };
    nextPrayer: {
      name: string;
      time: string;
      countdown: string;
    };
  }> {
    // In production, this would use an Islamic prayer times API
    // For now, providing calculated times based on location
    const prayerTimes = this.calculatePrayerTimes(latitude, longitude, date);
    const nextPrayer = this.getNextPrayer(prayerTimes);
    
    return {
      location: await this.getLocationName(latitude, longitude),
      date: format(date, 'yyyy-MM-dd'),
      prayers: prayerTimes,
      nextPrayer
    };
  }

  // Calculate Qibla direction
  async getQiblaDirection(latitude: number, longitude: number): Promise<{
    direction: number;
    distance: number;
    location: string;
  }> {
    // Kaaba coordinates: 21.4225° N, 39.8262° E
    const kaabaLat = 21.4225;
    const kaabaLng = 39.8262;
    
    const direction = this.calculateBearing(latitude, longitude, kaabaLat, kaabaLng);
    const distance = this.calculateDistance(latitude, longitude, kaabaLat, kaabaLng);
    
    return {
      direction: Math.round(direction),
      distance: Math.round(distance),
      location: await this.getLocationName(latitude, longitude)
    };
  }

  // Send prayer notifications
  async schedulePrayerNotifications(userId: number, latitude: number, longitude: number): Promise<{ success: boolean; message: string }> {
    try {
      const user = await storage.getUser(userId);
      if (!user) throw new Error("User not found");

      const today = new Date();
      const prayerData = await this.getPrayerTimes(latitude, longitude, today);
      
      const message = `🕌 Prayer Times for ${prayerData.location}

🌅 Fajr: ${prayerData.prayers.fajr}
☀️ Sunrise: ${prayerData.prayers.sunrise}
🌞 Dhuhr: ${prayerData.prayers.dhuhr}
🌇 Asr: ${prayerData.prayers.asr}
🌆 Maghrib: ${prayerData.prayers.maghrib}
🌙 Isha: ${prayerData.prayers.isha}

Next: ${prayerData.nextPrayer.name} in ${prayerData.nextPrayer.countdown}`;

      await smsService.sendSMS(user.email, message);
      
      return { success: true, message: "Prayer time notifications scheduled" };
    } catch (error) {
      return { success: false, message: "Failed to schedule notifications" };
    }
  }

  private calculatePrayerTimes(lat: number, lng: number, date: Date) {
    // Simplified prayer time calculation - in production use precise Islamic calculations
    const baseHour = 6; // Fajr base time
    return {
      fajr: this.formatTime(baseHour, 0),
      sunrise: this.formatTime(baseHour + 1, 30),
      dhuhr: this.formatTime(12, 15),
      asr: this.formatTime(15, 30),
      maghrib: this.formatTime(18, 45),
      isha: this.formatTime(20, 15)
    };
  }

  private getNextPrayer(prayers: any) {
    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    
    const prayerList = [
      { name: 'Fajr', time: prayers.fajr },
      { name: 'Sunrise', time: prayers.sunrise },
      { name: 'Dhuhr', time: prayers.dhuhr },
      { name: 'Asr', time: prayers.asr },
      { name: 'Maghrib', time: prayers.maghrib },
      { name: 'Isha', time: prayers.isha }
    ];

    for (const prayer of prayerList) {
      if (prayer.time > currentTime) {
        return {
          name: prayer.name,
          time: prayer.time,
          countdown: this.calculateCountdown(prayer.time)
        };
      }
    }

    // If all prayers passed, return next day's Fajr
    return {
      name: 'Fajr (Tomorrow)',
      time: prayers.fajr,
      countdown: this.calculateCountdown(prayers.fajr, true)
    };
  }

  private formatTime(hour: number, minute: number): string {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  }

  private calculateCountdown(prayerTime: string, nextDay: boolean = false): string {
    const now = new Date();
    const [hour, minute] = prayerTime.split(':').map(Number);
    let prayerDate = new Date(now);
    prayerDate.setHours(hour, minute, 0, 0);
    
    if (nextDay || prayerDate <= now) {
      prayerDate.setDate(prayerDate.getDate() + 1);
    }
    
    const diff = prayerDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  }

  private calculateBearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (deg: number) => deg * (Math.PI / 180);
    const toDeg = (rad: number) => rad * (180 / Math.PI);
    
    const dLng = toRad(lng2 - lng1);
    lat1 = toRad(lat1);
    lat2 = toRad(lat2);
    
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    
    let bearing = toDeg(Math.atan2(y, x));
    return (bearing + 360) % 360;
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // Earth's radius in km
    const toRad = (deg: number) => deg * (Math.PI / 180);
    
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private async getLocationName(lat: number, lng: number): Promise<string> {
    // In production, use reverse geocoding API
    return `Location ${lat.toFixed(2)}, ${lng.toFixed(2)}`;
  }
}

// Offline Content Service
class OfflineContentService {
  // Download Quran surahs for offline access
  async downloadSurahsForOffline(studentId: number, surahIds: number[]): Promise<{
    success: boolean;
    downloadedSurahs: Array<{
      id: number;
      name: string;
      arabicText: string;
      transliteration: string;
      translation: string;
      audioUrl: string;
      verses: number;
    }>;
  }> {
    try {
      const student = await storage.getUser(studentId);
      if (!student) throw new Error("Student not found");

      const surahs = await this.getSurahData(surahIds);
      
      return {
        success: true,
        downloadedSurahs: surahs
      };
    } catch (error) {
      return {
        success: false,
        downloadedSurahs: []
      };
    }
  }

  // Get offline study materials
  async getOfflineStudyMaterials(courseId: number): Promise<{
    lessons: Array<{
      id: number;
      title: string;
      content: string;
      exercises: string[];
      downloadSize: string;
    }>;
    assignments: Array<{
      id: number;
      title: string;
      description: string;
      dueDate: string;
    }>;
  }> {
    const lessons = await storage.getLessonsByCourse(courseId);
    const assignments = await storage.getAssignmentsByCourse(courseId);

    return {
      lessons: lessons.map(lesson => ({
        id: lesson.id,
        title: lesson.title,
        content: lesson.content || '',
        exercises: lesson.exercises || [],
        downloadSize: this.calculateContentSize(lesson.content || '')
      })),
      assignments: assignments.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description || '',
        dueDate: format(assignment.dueDate, 'yyyy-MM-dd')
      }))
    };
  }

  private async getSurahData(surahIds: number[]) {
    // In production, this would fetch from Quran API
    const mockSurahs = [
      {
        id: 1,
        name: "Al-Fatiha",
        arabicText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
        transliteration: "Bismillahir Rahmanir Raheem",
        translation: "In the name of Allah, the Most Gracious, the Most Merciful",
        audioUrl: "/audio/surah-001.mp3",
        verses: 7
      },
      {
        id: 2,
        name: "Al-Baqarah",
        arabicText: "الم ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ",
        transliteration: "Alif Lam Meem. Zalikal kitabu la rayba feeh",
        translation: "Alif Lam Meem. This is the Book about which there is no doubt",
        audioUrl: "/audio/surah-002.mp3",
        verses: 286
      }
    ];

    return mockSurahs.filter(surah => surahIds.includes(surah.id));
  }

  private calculateContentSize(content: string): string {
    const bytes = new Blob([content]).size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Advanced Analytics Service
class AdvancedAnalyticsService {
  // Generate learning path recommendations
  async generateLearningPath(studentId: number): Promise<{
    currentLevel: string;
    recommendations: Array<{
      type: 'memorization' | 'reading' | 'understanding' | 'practice';
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      estimatedTime: string;
    }>;
    progressPrediction: {
      nextMilestone: string;
      estimatedCompletion: string;
      confidenceLevel: number;
    };
  }> {
    const student = await storage.getUser(studentId);
    const memorizations = await storage.getMemorizationByStudent(studentId);
    const attendance = await storage.getAttendanceByStudent(studentId);
    
    const attendanceRate = this.calculateAttendanceRate(attendance);
    const memorizationProgress = this.calculateMemorizationProgress(memorizations);
    
    const currentLevel = this.determineCurrentLevel(attendanceRate, memorizationProgress);
    const recommendations = this.generateRecommendations(currentLevel, memorizations);
    const prediction = this.predictProgress(memorizations, attendanceRate);

    return {
      currentLevel,
      recommendations,
      progressPrediction: prediction
    };
  }

  // Get comparative analytics
  async getComparativeAnalytics(studentId: number): Promise<{
    studentPerformance: {
      attendanceRank: number;
      memorizationRank: number;
      overallRank: number;
    };
    classAverage: {
      attendance: number;
      memorization: number;
      assignments: number;
    };
    insights: string[];
  }> {
    // In production, this would compare with anonymized class data
    return {
      studentPerformance: {
        attendanceRank: 3,
        memorizationRank: 5,
        overallRank: 4
      },
      classAverage: {
        attendance: 85,
        memorization: 75,
        assignments: 80
      },
      insights: [
        "Your attendance is above class average",
        "Focus on memorization practice to improve ranking",
        "Assignment completion rate is excellent"
      ]
    };
  }

  private calculateAttendanceRate(attendance: any[]): number {
    if (attendance.length === 0) return 0;
    const present = attendance.filter(a => a.status === 'present').length;
    return Math.round((present / attendance.length) * 100);
  }

  private calculateMemorizationProgress(memorizations: any[]): number {
    if (memorizations.length === 0) return 0;
    const totalProgress = memorizations.reduce((sum, m) => sum + m.progress, 0);
    return Math.round(totalProgress / memorizations.length);
  }

  private determineCurrentLevel(attendance: number, memorization: number): string {
    const average = (attendance + memorization) / 2;
    if (average >= 90) return "Advanced";
    if (average >= 75) return "Intermediate";
    if (average >= 60) return "Beginner";
    return "Foundation";
  }

  private generateRecommendations(level: string, memorizations: any[]) {
    const recommendations = [];
    
    if (level === "Foundation" || level === "Beginner") {
      recommendations.push({
        type: 'reading' as const,
        title: "Daily Quran Reading",
        description: "Start with 15 minutes daily reading to build fluency",
        priority: 'high' as const,
        estimatedTime: "15 minutes/day"
      });
    }
    
    recommendations.push({
      type: 'memorization' as const,
      title: "Short Surahs Practice",
      description: "Focus on memorizing shorter surahs first",
      priority: 'high' as const,
      estimatedTime: "20 minutes/day"
    });

    recommendations.push({
      type: 'understanding' as const,
      title: "Tafsir Study",
      description: "Learn the meanings and context of verses",
      priority: 'medium' as const,
      estimatedTime: "10 minutes/day"
    });

    return recommendations;
  }

  private predictProgress(memorizations: any[], attendanceRate: number) {
    // Simple prediction based on current progress
    const avgProgress = memorizations.length > 0 
      ? memorizations.reduce((sum, m) => sum + m.progress, 0) / memorizations.length 
      : 0;
    
    const confidenceLevel = Math.min(95, attendanceRate + (avgProgress * 0.3));
    
    return {
      nextMilestone: "Complete current surah memorization",
      estimatedCompletion: "2-3 weeks",
      confidenceLevel: Math.round(confidenceLevel)
    };
  }
}

const prayerService = new PrayerTimesService();
const offlineService = new OfflineContentService();
const analyticsService = new AdvancedAnalyticsService();

// API Routes for Mobile Features
export function setupMobileFeaturesRoutes(app: Express) {
  // Prayer Times APIs
  app.get("/api/mobile/prayer-times", async (req: Request, res: Response) => {
    try {
      const { lat, lng, date } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      const prayerDate = date ? new Date(date as string) : new Date();
      const prayerTimes = await prayerService.getPrayerTimes(
        parseFloat(lat as string), 
        parseFloat(lng as string), 
        prayerDate
      );
      
      res.json({ success: true, data: prayerTimes });
    } catch (error) {
      res.status(500).json({ error: "Failed to get prayer times" });
    }
  });

  app.get("/api/mobile/qibla-direction", async (req: Request, res: Response) => {
    try {
      const { lat, lng } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }

      const qiblaData = await prayerService.getQiblaDirection(
        parseFloat(lat as string), 
        parseFloat(lng as string)
      );
      
      res.json({ success: true, data: qiblaData });
    } catch (error) {
      res.status(500).json({ error: "Failed to get Qibla direction" });
    }
  });

  app.post("/api/mobile/prayer-notifications", async (req: Request, res: Response) => {
    try {
      const { userId, latitude, longitude } = req.body;
      
      const result = await prayerService.schedulePrayerNotifications(userId, latitude, longitude);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to schedule prayer notifications" });
    }
  });

  // Offline Content APIs
  app.post("/api/mobile/download-surahs", async (req: Request, res: Response) => {
    try {
      const { studentId, surahIds } = req.body;
      
      const result = await offlineService.downloadSurahsForOffline(studentId, surahIds);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to download surahs" });
    }
  });

  app.get("/api/mobile/offline-materials/:courseId", async (req: Request, res: Response) => {
    try {
      const { courseId } = req.params;
      
      const materials = await offlineService.getOfflineStudyMaterials(parseInt(courseId));
      res.json({ success: true, data: materials });
    } catch (error) {
      res.status(500).json({ error: "Failed to get offline materials" });
    }
  });

  // Advanced Analytics APIs
  app.get("/api/mobile/learning-path/:studentId", async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      
      const learningPath = await analyticsService.generateLearningPath(parseInt(studentId));
      res.json({ success: true, data: learningPath });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate learning path" });
    }
  });

  app.get("/api/mobile/comparative-analytics/:studentId", async (req: Request, res: Response) => {
    try {
      const { studentId } = req.params;
      
      const analytics = await analyticsService.getComparativeAnalytics(parseInt(studentId));
      res.json({ success: true, data: analytics });
    } catch (error) {
      res.status(500).json({ error: "Failed to get comparative analytics" });
    }
  });
}

export { prayerService, offlineService, analyticsService };