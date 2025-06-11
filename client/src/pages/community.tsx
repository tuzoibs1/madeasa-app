import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Calendar,
  Globe,
  BookOpen,
  Share2,
  Plus,
  Clock,
  MapPin,
  Award,
  Heart,
  Star,
  MessageSquare,
  ThumbsUp,
  ExternalLink,
  School,
  Target,
  Lightbulb,
} from "lucide-react";

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
  createdAt: string;
}

interface IslamicEvent {
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
  joinedAt: string;
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
  createdAt: string;
}

export default function CommunityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [joinGroupDialogOpen, setJoinGroupDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [shareKnowledgeDialogOpen, setShareKnowledgeDialogOpen] = useState(false);
  const [knowledgeForm, setKnowledgeForm] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
    isPublic: true
  });

  // Fetch study groups
  const { data: studyGroups, isLoading: studyGroupsLoading } = useQuery<StudyGroup[]>({
    queryKey: ["/api/community/study-groups"],
  });

  // Fetch Islamic calendar events
  const { data: islamicEvents, isLoading: eventsLoading } = useQuery<IslamicEvent[]>({
    queryKey: ["/api/community/islamic-calendar"],
  });

  // Fetch today's Islamic events
  const { data: todayEvents } = useQuery<IslamicEvent[]>({
    queryKey: ["/api/community/islamic-calendar/today"],
  });

  // Fetch madrasa network
  const { data: madrasaNetwork, isLoading: networkLoading } = useQuery<MadrasaNetwork[]>({
    queryKey: ["/api/community/madrasa-network"],
  });

  // Fetch shared knowledge
  const { data: sharedKnowledge, isLoading: knowledgeLoading } = useQuery<KnowledgeSharing[]>({
    queryKey: ["/api/community/knowledge-sharing"],
  });

  // Join study group mutation
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await apiRequest("POST", `/api/community/study-groups/${groupId}/join`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Successfully joined the study group!",
      });
      setJoinGroupDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/community/study-groups"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to join study group",
        variant: "destructive",
      });
    },
  });

  // Share knowledge mutation
  const shareKnowledgeMutation = useMutation({
    mutationFn: async (knowledgeData: typeof knowledgeForm) => {
      const formattedData = {
        ...knowledgeData,
        tags: knowledgeData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      };
      const res = await apiRequest("POST", "/api/community/knowledge-sharing", formattedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Knowledge shared successfully!",
      });
      setShareKnowledgeDialogOpen(false);
      setKnowledgeForm({ title: "", content: "", category: "", tags: "", isPublic: true });
      queryClient.invalidateQueries({ queryKey: ["/api/community/knowledge-sharing"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to share knowledge",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getGroupTypeIcon = (type: string) => {
    switch (type) {
      case 'memorization': return <BookOpen className="h-4 w-4" />;
      case 'arabic': return <MessageSquare className="h-4 w-4" />;
      case 'islamic_history': return <Clock className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getConnectionTypeIcon = (type: string) => {
    switch (type) {
      case 'sister_school': return <School className="h-4 w-4" />;
      case 'exchange_program': return <ExternalLink className="h-4 w-4" />;
      case 'resource_sharing': return <Share2 className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'curriculum': return <BookOpen className="h-4 w-4" />;
      case 'teaching_methods': return <Target className="h-4 w-4" />;
      case 'resources': return <Share2 className="h-4 w-4" />;
      case 'events': return <Calendar className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  return (
    <Layout title="Community">
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2">Islamic Learning Community</h2>
        <p className="text-slate-600">
          Connect with fellow learners, join study groups, and explore Islamic calendar events
        </p>
      </div>

      {/* Today's Islamic Events Banner */}
      {todayEvents && todayEvents.length > 0 && (
        <Card className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <Calendar className="h-5 w-5 mr-2" />
              Today's Islamic Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayEvents.map((event) => (
                <div key={event.id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-semibold text-green-900">{event.name}</h4>
                    <p className="text-sm text-green-700">{event.description}</p>
                    <p className="text-xs text-green-600">{event.hijriDate}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="study-groups" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="study-groups">Study Groups</TabsTrigger>
          <TabsTrigger value="calendar">Islamic Calendar</TabsTrigger>
          <TabsTrigger value="network">Madrasa Network</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Sharing</TabsTrigger>
        </TabsList>

        {/* Study Groups Tab */}
        <TabsContent value="study-groups" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Study Groups
                  </CardTitle>
                  <CardDescription>
                    Join study groups to learn together with your peers
                  </CardDescription>
                </div>
                {['teacher', 'director'].includes(user?.role || '') && (
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Group
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {studyGroupsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-slate-500">Loading study groups...</p>
                </div>
              ) : studyGroups && studyGroups.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {studyGroups.map((group) => (
                    <Card key={group.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            {getGroupTypeIcon(group.type)}
                            <CardTitle className="text-lg">{group.name}</CardTitle>
                          </div>
                          <Badge variant="outline">{group.type}</Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {group.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center space-x-2 text-sm text-slate-600">
                          <Clock className="h-4 w-4" />
                          <span>{group.meetingSchedule}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">
                            {group.currentMembers}/{group.maxMembers} members
                          </span>
                          {user?.role === 'student' && (
                            <Button 
                              size="sm" 
                              onClick={() => {
                                setSelectedGroup(group);
                                setJoinGroupDialogOpen(true);
                              }}
                              disabled={group.currentMembers >= group.maxMembers}
                            >
                              {group.currentMembers >= group.maxMembers ? 'Full' : 'Join'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Study Groups</h3>
                  <p className="text-slate-500">No study groups are available at the moment.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Islamic Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Islamic Calendar Events
              </CardTitle>
              <CardDescription>
                Important Islamic dates and their significance
              </CardDescription>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-slate-500">Loading events...</p>
                </div>
              ) : islamicEvents && islamicEvents.length > 0 ? (
                <div className="space-y-4">
                  {islamicEvents.map((event) => (
                    <Card key={event.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{event.name}</h4>
                          <p className="text-sm text-slate-600">{event.hijriDate}</p>
                          <p className="text-sm text-slate-500">{formatDate(event.gregorianDate)}</p>
                        </div>
                        <Badge variant={event.type === 'religious' ? 'default' : 'secondary'}>
                          {event.type}
                        </Badge>
                      </div>
                      <p className="text-slate-700 mb-3">{event.description}</p>
                      <div className="space-y-3">
                        <div>
                          <h5 className="font-medium text-sm mb-1">Significance:</h5>
                          <p className="text-sm text-slate-600">{event.significance}</p>
                        </div>
                        {event.recommendedActivities.length > 0 && (
                          <div>
                            <h5 className="font-medium text-sm mb-1">Recommended Activities:</h5>
                            <ul className="text-sm text-slate-600 space-y-1">
                              {event.recommendedActivities.map((activity, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                  <span className="w-1 h-1 bg-slate-400 rounded-full mt-2 flex-shrink-0"></span>
                                  <span>{activity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Calendar className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Events</h3>
                  <p className="text-slate-500">No Islamic calendar events are available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Madrasa Network Tab */}
        <TabsContent value="network" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Partner Madrasa Network
              </CardTitle>
              <CardDescription>
                Connect with sister schools and partner institutions worldwide
              </CardDescription>
            </CardHeader>
            <CardContent>
              {networkLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-slate-500">Loading network...</p>
                </div>
              ) : madrasaNetwork && madrasaNetwork.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {madrasaNetwork.map((madrasa) => (
                    <Card key={madrasa.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{madrasa.name}</h4>
                          <div className="flex items-center space-x-1 text-sm text-slate-600">
                            <MapPin className="h-3 w-3" />
                            <span>{madrasa.location}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          {getConnectionTypeIcon(madrasa.connectionType)}
                          <Badge variant="outline">{madrasa.connectionType}</Badge>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Established:</span>
                          <span>{madrasa.establishedYear}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Students:</span>
                          <span>{madrasa.studentCount}</span>
                        </div>
                        <div>
                          <span className="text-slate-600">Specializations:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {madrasa.specializations.map((spec, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Globe className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Partner Institutions</h3>
                  <p className="text-slate-500">No partner madrasas are available.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Sharing Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Share2 className="h-5 w-5 mr-2" />
                    Knowledge Sharing
                  </CardTitle>
                  <CardDescription>
                    Share and discover educational resources and best practices
                  </CardDescription>
                </div>
                {['teacher', 'director'].includes(user?.role || '') && (
                  <Dialog open={shareKnowledgeDialogOpen} onOpenChange={setShareKnowledgeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Share Knowledge
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Share Your Knowledge</DialogTitle>
                        <DialogDescription>
                          Share educational resources, teaching methods, or insights with the community
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="title">Title</Label>
                          <Input
                            id="title"
                            value={knowledgeForm.title}
                            onChange={(e) => setKnowledgeForm({...knowledgeForm, title: e.target.value})}
                            placeholder="Enter a descriptive title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Select 
                            value={knowledgeForm.category} 
                            onValueChange={(value) => setKnowledgeForm({...knowledgeForm, category: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="curriculum">Curriculum</SelectItem>
                              <SelectItem value="teaching_methods">Teaching Methods</SelectItem>
                              <SelectItem value="resources">Resources</SelectItem>
                              <SelectItem value="events">Events</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="content">Content</Label>
                          <Textarea
                            id="content"
                            value={knowledgeForm.content}
                            onChange={(e) => setKnowledgeForm({...knowledgeForm, content: e.target.value})}
                            placeholder="Share your knowledge, insights, or resources..."
                            rows={6}
                          />
                        </div>
                        <div>
                          <Label htmlFor="tags">Tags (comma separated)</Label>
                          <Input
                            id="tags"
                            value={knowledgeForm.tags}
                            onChange={(e) => setKnowledgeForm({...knowledgeForm, tags: e.target.value})}
                            placeholder="e.g., memorization, teaching, resources"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => shareKnowledgeMutation.mutate(knowledgeForm)}
                          disabled={shareKnowledgeMutation.isPending || !knowledgeForm.title || !knowledgeForm.content || !knowledgeForm.category}
                        >
                          {shareKnowledgeMutation.isPending ? "Sharing..." : "Share Knowledge"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {knowledgeLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-slate-500">Loading knowledge...</p>
                </div>
              ) : sharedKnowledge && sharedKnowledge.length > 0 ? (
                <div className="space-y-4">
                  {sharedKnowledge.map((knowledge) => (
                    <Card key={knowledge.id} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg mb-1">{knowledge.title}</h4>
                          <div className="flex items-center space-x-2 text-sm text-slate-500 mb-2">
                            {getCategoryIcon(knowledge.category)}
                            <Badge variant="outline">{knowledge.category}</Badge>
                            <span>•</span>
                            <span>{formatDate(knowledge.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-slate-700 mb-3">{knowledge.content}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {knowledge.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-slate-500">
                          <div className="flex items-center space-x-1">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{knowledge.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="h-4 w-4" />
                            <span>{knowledge.comments}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Share2 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Shared Knowledge</h3>
                  <p className="text-slate-500">No knowledge has been shared yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Join Study Group Dialog */}
      <Dialog open={joinGroupDialogOpen} onOpenChange={setJoinGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Study Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to join "{selectedGroup?.name}"?
            </DialogDescription>
          </DialogHeader>
          {selectedGroup && (
            <div className="space-y-2">
              <p><strong>Meeting Schedule:</strong> {selectedGroup.meetingSchedule}</p>
              <p><strong>Type:</strong> {selectedGroup.type}</p>
              <p><strong>Members:</strong> {selectedGroup.currentMembers}/{selectedGroup.maxMembers}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinGroupDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedGroup && joinGroupMutation.mutate(selectedGroup.id)}
              disabled={joinGroupMutation.isPending}
            >
              {joinGroupMutation.isPending ? "Joining..." : "Join Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}