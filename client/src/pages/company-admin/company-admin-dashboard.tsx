import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, Users, MessageSquare, BarChart3, Settings, 
  Eye, Edit, CheckCircle, XCircle, Clock, AlertTriangle,
  Search, Filter, Download, Plus, TestTube
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/layout";

interface Organization {
  id: number;
  name: string;
  status: string;
  subscriptionPlan: string;
  currentUsers: number;
  maxUsers: number;
  stats: {
    totalUsers: number;
    directors: number;
    teachers: number;
    students: number;
    parents: number;
  };
}

interface UserFeedback {
  id: number;
  title: string;
  category: string;
  priority: string;
  status: string;
  createdAt: string;
  user: {
    fullName: string;
    email: string;
    role: string;
  };
  organization: {
    name: string;
  } | null;
  commentsCount: number;
}

export default function CompanyAdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isNewOrgDialogOpen, setIsNewOrgDialogOpen] = useState(false);
  const [newOrgData, setNewOrgData] = useState({
    name: "",
    location: "",
    contactEmail: "",
    adminFullName: "",
    adminUsername: "",
    subscriptionPlan: "trial"
  });

  // Company overview data
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["/api/company-admin/overview"],
    enabled: !!user && user.role === 'company_admin'
  });

  // Organizations data
  const { data: organizationsResponse, isLoading: orgsLoading } = useQuery({
    queryKey: ["/api/company-admin/organizations"],
    enabled: !!user && user.role === 'company_admin'
  });

  // User feedback data
  const { data: feedbackResponse, isLoading: feedbackLoading } = useQuery({
    queryKey: ["/api/company-admin/feedback"],
    enabled: !!user && user.role === 'company_admin'
  });

  const organizations = (organizationsResponse as any)?.data || [];
  const feedback = (feedbackResponse as any)?.data || [];

  // All users data
  const { data: allUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/company-admin/users"],
    enabled: !!user && user.role === 'company_admin'
  });

  // Create organization mutation
  const createOrganizationMutation = useMutation({
    mutationFn: async (orgData: typeof newOrgData) => {
      const response = await apiRequest("POST", "/api/company-admin/organizations", orgData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Organization Created",
        description: "New organization has been successfully created.",
      });
      setIsNewOrgDialogOpen(false);
      setNewOrgData({
        name: "",
        location: "",
        contactEmail: "",
        adminFullName: "",
        adminUsername: "",
        subscriptionPlan: "trial"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/company-admin/organizations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/company-admin/overview"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create organization.",
        variant: "destructive",
      });
    },
  });

  // Export report function
  const handleExportReport = () => {
    try {
      const reportData = {
        overview: (overview as any)?.data,
        organizations,
        feedback,
        allUsers: (allUsers as any)?.data,
        exportDate: new Date().toISOString(),
        exportedBy: user?.fullName
      };

      const dataStr = JSON.stringify(reportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `madrasa-app-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Exported",
        description: "Company report has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle create organization
  const handleCreateOrganization = () => {
    if (!newOrgData.name || !newOrgData.location || !newOrgData.contactEmail || !newOrgData.adminFullName || !newOrgData.adminUsername) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    createOrganizationMutation.mutate(newOrgData);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      active: "default",
      trial: "secondary",
      suspended: "destructive",
      cancelled: "outline",
      open: "destructive",
      in_progress: "secondary",
      resolved: "default",
      closed: "outline"
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, any> = {
      critical: "destructive",
      high: "destructive",
      medium: "secondary",
      low: "outline"
    };
    return <Badge variant={variants[priority] || "outline"}>{priority}</Badge>;
  };

  const filteredFeedback = feedback.filter((item: any) => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.user?.fullName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || item.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  if (!user || user.role !== 'company_admin') {
    return (
      <Layout title="Company Admin">
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-slate-600">
            Company Admin Dashboard is only accessible to company administrators.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Company Admin Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Company Administration</h1>
            <p className="text-slate-600">Complete oversight of all MadrasaApp business accounts</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExportReport}
              className="w-full sm:w-auto touch-manipulation"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
            <Dialog open={isNewOrgDialogOpen} onOpenChange={setIsNewOrgDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-full sm:w-auto touch-manipulation"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Organization
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Organization</DialogTitle>
                  <DialogDescription>
                    Add a new organization to the MadrasaApp platform.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="orgName">Organization Name *</Label>
                    <Input
                      id="orgName"
                      placeholder="Enter organization name"
                      value={newOrgData.name}
                      onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="City, Country"
                      value={newOrgData.location}
                      onChange={(e) => setNewOrgData({ ...newOrgData, location: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contactEmail">Contact Email *</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="admin@organization.com"
                      value={newOrgData.contactEmail}
                      onChange={(e) => setNewOrgData({ ...newOrgData, contactEmail: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="adminFullName">Admin Full Name *</Label>
                    <Input
                      id="adminFullName"
                      placeholder="Administrator full name"
                      value={newOrgData.adminFullName}
                      onChange={(e) => setNewOrgData({ ...newOrgData, adminFullName: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="adminUsername">Admin Username *</Label>
                    <Input
                      id="adminUsername"
                      placeholder="admin_username"
                      value={newOrgData.adminUsername}
                      onChange={(e) => setNewOrgData({ ...newOrgData, adminUsername: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                    <Select 
                      value={newOrgData.subscriptionPlan} 
                      onValueChange={(value) => setNewOrgData({ ...newOrgData, subscriptionPlan: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trial">Trial (30 days)</SelectItem>
                        <SelectItem value="basic">Basic Plan</SelectItem>
                        <SelectItem value="premium">Premium Plan</SelectItem>
                        <SelectItem value="enterprise">Enterprise Plan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsNewOrgDialogOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateOrganization}
                    disabled={createOrganizationMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {createOrganizationMutation.isPending ? "Creating..." : "Create Organization"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(overview as any)?.data?.stats?.totalOrganizations || 0}</div>
              <p className="text-xs text-muted-foreground">Across all subscription plans</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(overview as any)?.data?.stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">All roles combined</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Feedback</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(overview as any)?.data?.stats?.activeFeedback || 0}</div>
              <p className="text-xs text-muted-foreground">Open support tickets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">QA Testing</CardTitle>
              <TestTube className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Available</div>
              <p className="text-xs text-muted-foreground">Company admin exclusive</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="organizations" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="feedback">User Feedback</TabsTrigger>
            <TabsTrigger value="users">All Users</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="organizations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Organization Management</CardTitle>
                <CardDescription>
                  Manage all business accounts and subscription settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orgsLoading ? (
                  <div className="text-center py-8">Loading organizations...</div>
                ) : (
                  <div className="space-y-4">
                    {organizations && organizations.length > 0 ? (
                      organizations.map((org: any) => (
                        <div key={org.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">{org.name}</h3>
                              <div className="flex gap-2 mt-2">
                                {getStatusBadge(org.status)}
                                <Badge variant="outline">{org.subscriptionPlan}</Badge>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </Button>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Total Users:</span>
                              <div className="font-medium">{org.stats.totalUsers}/{org.maxUsers}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Directors:</span>
                              <div className="font-medium">{org.stats.directors}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Teachers:</span>
                              <div className="font-medium">{org.stats.teachers}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Students:</span>
                              <div className="font-medium">{org.stats.students}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Parents:</span>
                              <div className="font-medium">{org.stats.parents}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No organizations found
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Feedback & Support</CardTitle>
                <CardDescription>
                  Manage user feedback, bug reports, and support requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Search feedback..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priority</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {feedbackLoading ? (
                  <div className="text-center py-8">Loading feedback...</div>
                ) : (
                  <div className="space-y-4">
                    {filteredFeedback && filteredFeedback.length > 0 ? (
                      filteredFeedback.map((item: any) => (
                        <div key={item.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold">{item.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                By {item.user?.fullName} ({item.user?.role})
                                {item.organization && ` from ${item.organization.name}`}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {getStatusBadge(item.status)}
                              {getPriorityBadge(item.priority)}
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex gap-4">
                              <span>Category: {item.category}</span>
                              <span>Comments: {item.commentsCount}</span>
                              <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No feedback found
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>All Users</CardTitle>
                <CardDescription>
                  Complete overview of all users across all organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center py-8">Loading users...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Name</th>
                          <th className="text-left p-2">Role</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Organization</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(allUsers as any)?.data?.slice(0, 20)?.map((user: any) => (
                          <tr key={user.id} className="border-b">
                            <td className="p-2 font-medium">{user.fullName || 'N/A'}</td>
                            <td className="p-2">
                              <Badge variant="outline">{user.role || 'Unknown'}</Badge>
                            </td>
                            <td className="p-2 text-sm">{user.email || 'N/A'}</td>
                            <td className="p-2 text-sm">
                              {user.organizationName ? (
                                <div>
                                  {user.organizationName}
                                  {user.organizationStatus && (
                                    <span className="ml-2">
                                      {getStatusBadge(user.organizationStatus)}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No organization</span>
                              )}
                            </td>
                            <td className="p-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            </td>
                            <td className="p-2 text-sm">
                              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={6} className="text-center py-8 text-muted-foreground">
                              No users found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Company Analytics</CardTitle>
                <CardDescription>
                  System-wide analytics and business intelligence
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Advanced Analytics</h3>
                  <p className="text-slate-600 mb-4">
                    Comprehensive business analytics and reporting dashboard
                  </p>
                  <Button>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}