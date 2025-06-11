import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  Compass, 
  Download, 
  Calendar,
  MapPin,
  Bell,
  Mic,
  Play,
  Pause,
  Volume2
} from "lucide-react";
import { format } from "date-fns";

interface PrayerTimes {
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
}

interface QiblaDirection {
  direction: number;
  distance: number;
  location: string;
}

interface LearningPath {
  currentLevel: string;
  recommendations: Array<{
    type: 'memorization' | 'reading' | 'understanding' | 'practice';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedTime: string;
  }>;
  progressMetrics: {
    attendanceRate: number;
    memorizationProgress: number;
    overallScore: number;
  };
  nextMilestone: {
    title: string;
    description: string;
    targetDate: string;
    progress: number;
  };
}

interface OfflineSurah {
  id: number;
  name: string;
  arabicText: string;
  transliteration: string;
  translation: string;
  audioUrl: string;
  verses: number;
}

export default function MobileStudentDashboard() {
  const { user } = useAuth();
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState<{ [key: number]: boolean }>({});
  const [selectedTab, setSelectedTab] = useState("dashboard");

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.log("Location access denied");
          // Default to a sample location
          setLocation({ lat: 40.7128, lon: -74.0060 }); // New York
        }
      );
    }
  }, []);

  // Prayer times query
  const { data: prayerTimes, isLoading: prayerLoading } = useQuery<PrayerTimes>({
    queryKey: ['/api/mobile/prayer-times', location?.lat, location?.lon],
    enabled: !!location,
    queryFn: async () => {
      const response = await fetch(`/api/mobile/prayer-times?lat=${location!.lat}&lng=${location!.lon}`);
      return response.json();
    }
  });

  // Qibla direction query
  const { data: qiblaDirection } = useQuery<QiblaDirection>({
    queryKey: ['/api/mobile/qibla-direction', location?.lat, location?.lon],
    enabled: !!location,
    queryFn: async () => {
      const response = await fetch(`/api/mobile/qibla-direction?lat=${location!.lat}&lng=${location!.lon}`);
      return response.json();
    }
  });

  // Learning path query
  const { data: learningPath } = useQuery<LearningPath>({
    queryKey: ['/api/mobile/learning-path', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const response = await fetch(`/api/mobile/learning-path/${user!.id}`);
      return response.json();
    }
  });

  // Offline surahs query
  const { data: offlineSurahs } = useQuery<{ success: boolean; downloadedSurahs: OfflineSurah[] }>({
    queryKey: ['/api/mobile/download-surahs'],
    queryFn: async () => {
      const response = await fetch('/api/mobile/download-surahs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user!.id, surahIds: [1, 2, 112, 113, 114] })
      });
      return response.json();
    }
  });

  const handlePrayerNotifications = async () => {
    if (!location) return;
    
    try {
      const response = await fetch('/api/mobile/prayer-notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user!.id,
          latitude: location.lat,
          longitude: location.lon
        })
      });
      
      const result = await response.json();
      alert(result.message);
    } catch (error) {
      alert("Failed to setup prayer notifications");
    }
  };

  const toggleAudio = (surahId: number) => {
    setIsPlaying(prev => ({
      ...prev,
      [surahId]: !prev[surahId]
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen">Please log in to access mobile dashboard</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 pb-20">
      {/* Mobile Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">السلام عليكم</h1>
            <p className="text-emerald-100">{user.fullName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-emerald-100">Today</p>
            <p className="font-semibold">{format(new Date(), 'MMM dd, yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Prayer Times Card */}
      {prayerTimes && (
        <Card className="mx-4 mt-4 shadow-lg border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-emerald-600" />
                Prayer Times
              </CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrayerNotifications}
                className="text-xs"
              >
                <Bell className="h-4 w-4 mr-1" />
                Notify
              </Button>
            </div>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <MapPin className="h-4 w-4" />
              {prayerTimes.location}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Next Prayer Highlight */}
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-800">
                  Next: {prayerTimes.nextPrayer.name}
                </span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
                  {prayerTimes.nextPrayer.countdown}
                </Badge>
              </div>
            </div>
            
            {/* Prayer Times Grid */}
            <div className="grid grid-cols-3 gap-2 text-sm">
              {Object.entries(prayerTimes.prayers).map(([prayer, time]) => (
                <div key={prayer} className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-medium capitalize text-gray-700">{prayer}</div>
                  <div className="text-lg font-bold text-gray-900">{time}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Qibla Direction Card */}
      {qiblaDirection && (
        <Card className="mx-4 mt-4 shadow-lg border-0">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Compass className="h-5 w-5 text-emerald-600" />
              Qibla Direction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32 border-4 border-emerald-200 rounded-full flex items-center justify-center">
                <div
                  className="absolute w-1 h-16 bg-emerald-600 origin-bottom"
                  style={{
                    transform: `rotate(${qiblaDirection.direction}deg)`,
                    transformOrigin: 'bottom center'
                  }}
                />
                <div className="w-3 h-3 bg-emerald-600 rounded-full" />
              </div>
            </div>
            <div className="text-center mt-3 space-y-1">
              <p className="font-semibold">{qiblaDirection.direction}° from North</p>
              <p className="text-sm text-gray-600">{qiblaDirection.distance} km to Mecca</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <div className="mx-4 mt-4">
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-lg">
            <TabsTrigger value="dashboard" className="text-xs">Dashboard</TabsTrigger>
            <TabsTrigger value="learning" className="text-xs">Learning</TabsTrigger>
            <TabsTrigger value="quran" className="text-xs">Quran</TabsTrigger>
            <TabsTrigger value="progress" className="text-xs">Progress</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-4 mt-4">
            {learningPath && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-emerald-600" />
                    Learning Progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      {learningPath.currentLevel}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {learningPath.progressMetrics.attendanceRate}%
                      </div>
                      <div className="text-xs text-blue-700">Attendance</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {learningPath.progressMetrics.memorizationProgress}%
                      </div>
                      <div className="text-xs text-green-700">Memorization</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {learningPath.progressMetrics.overallScore}%
                      </div>
                      <div className="text-xs text-purple-700">Overall</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Next Milestone</h4>
                    <p className="text-sm font-medium">{learningPath.nextMilestone.title}</p>
                    <p className="text-xs text-gray-600 mb-2">{learningPath.nextMilestone.description}</p>
                    <Progress value={learningPath.nextMilestone.progress} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">
                      Target: {format(new Date(learningPath.nextMilestone.targetDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Learning Tab */}
          <TabsContent value="learning" className="space-y-4 mt-4">
            {learningPath && (
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-emerald-600" />
                    Recommended Learning Path
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {learningPath.recommendations.map((recommendation, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-3">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-sm">{recommendation.title}</h4>
                        <Badge 
                          variant="secondary" 
                          className={`text-xs ${getPriorityColor(recommendation.priority)}`}
                        >
                          {recommendation.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{recommendation.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-blue-600 font-medium capitalize">{recommendation.type}</span>
                        <span className="text-gray-500">{recommendation.estimatedTime}</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Quran Tab */}
          <TabsContent value="quran" className="space-y-4 mt-4">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-emerald-600" />
                  Offline Quran
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {offlineSurahs?.downloadedSurahs.map((surah) => (
                  <div key={surah.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{surah.name}</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleAudio(surah.id)}
                        className="h-8 w-8 p-0"
                      >
                        {isPlaying[surah.id] ? 
                          <Pause className="h-4 w-4" /> : 
                          <Play className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="text-right text-xl font-arabic leading-relaxed">
                        {surah.arabicText}
                      </div>
                      <div className="text-gray-600 italic">
                        {surah.transliteration}
                      </div>
                      <div className="text-gray-700">
                        {surah.translation}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">{surah.verses} verses</span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Volume2 className="h-3 w-3" />
                        Audio Available
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-4 mt-4">
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Weekly Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Detailed progress analytics</p>
                  <p className="text-sm">Check back tomorrow for updates</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Actions Floating Button */}
      <div className="fixed bottom-6 right-6">
        <Button 
          size="lg" 
          className="rounded-full w-14 h-14 bg-emerald-600 hover:bg-emerald-700 shadow-lg"
        >
          <Mic className="h-6 w-6" />
        </Button>
      </div>
    </div>
  );
}