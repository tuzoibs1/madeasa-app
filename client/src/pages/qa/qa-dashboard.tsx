import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, CheckCircle, XCircle, Clock, Download, RefreshCw,
  AlertCircle, Database, Shield, Users, GraduationCap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Layout from "@/components/layout/layout";

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

interface QAResults {
  overallStatus: 'PASS' | 'FAIL';
  totalSuites: number;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  executionTime: number;
  suites: TestSuite[];
}

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'error';
  checks: {
    database: boolean;
    authentication: boolean;
    storage: boolean;
    timestamp: string;
  };
}

export default function QADashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<QAResults | null>(null);

  // Health check query
  const { data: healthCheck, refetch: refetchHealth } = useQuery<HealthCheck>({
    queryKey: ["/api/qa/health-check"],
    enabled: !!user && user.role === 'director',
    refetchInterval: 30000 // Check every 30 seconds
  });

  // Run QA tests mutation
  const runTestsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/qa/run-tests");
      return await response.json();
    },
    onSuccess: (data) => {
      setTestResults(data.results);
      toast({
        title: "QA Tests Completed",
        description: `${data.results.passedTests}/${data.results.totalTests} tests passed`,
        variant: data.results.overallStatus === 'PASS' ? "default" : "destructive"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Execution Failed",
        description: error.message || "Failed to run QA tests",
        variant: "destructive"
      });
    }
  });

  // Create test data mutation
  const createTestDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/qa/create-test-data");
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Test Data Created",
        description: "Sample test data has been generated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Data Creation Failed",
        description: error.message || "Failed to create test data",
        variant: "destructive"
      });
    }
  });

  // Download test report
  const downloadReport = async () => {
    try {
      const response = await fetch("/api/qa/test-report?format=markdown", {
        credentials: 'include'
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `madrasaapp-qa-report-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Report Downloaded",
          description: "QA test report has been downloaded successfully"
        });
      }
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download test report",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAIL':
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'SKIP':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'PASS' || status === 'healthy' ? 'default' : 
                   status === 'FAIL' || status === 'unhealthy' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  if (!user || user.role !== 'director') {
    return (
      <Layout title="QA Dashboard">
        <div className="text-center py-12">
          <AlertCircle className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-slate-600">
            QA Dashboard is only accessible to directors.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="QA Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">QA Testing Dashboard</h1>
            <p className="text-slate-600">Comprehensive quality assurance testing for MadrasaApp</p>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={() => refetchHealth()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Health
            </Button>
            
            <Button
              onClick={() => createTestDataMutation.mutate()}
              variant="outline"
              size="sm"
              disabled={createTestDataMutation.isPending}
            >
              Create Test Data
            </Button>
            
            <Button
              onClick={() => runTestsMutation.mutate()}
              disabled={runTestsMutation.isPending}
              size="sm"
            >
              {runTestsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Run All Tests
            </Button>
          </div>
        </div>

        {/* Health Status Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              {getStatusIcon(healthCheck?.status || 'unknown')}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getStatusBadge(healthCheck?.status || 'unknown')}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Overall system status
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Database</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getStatusBadge(healthCheck?.checks?.database ? 'healthy' : 'unhealthy')}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                PostgreSQL connection
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Authentication</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getStatusBadge(healthCheck?.checks?.authentication ? 'healthy' : 'unhealthy')}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                User auth system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Storage</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {getStatusBadge(healthCheck?.checks?.storage ? 'healthy' : 'unhealthy')}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Data storage layer
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Test Results */}
        {testResults && (
          <Tabs defaultValue="overview" className="space-y-4">
            <div className="flex justify-between items-center">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="suites">Test Suites</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
              
              <Button
                onClick={downloadReport}
                variant="outline"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getStatusIcon(testResults.overallStatus)}
                    Test Execution Summary
                  </CardTitle>
                  <CardDescription>
                    Overall test results and performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{testResults.passedTests}</div>
                      <div className="text-sm text-green-700">Passed</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{testResults.failedTests}</div>
                      <div className="text-sm text-red-700">Failed</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{testResults.skippedTests}</div>
                      <div className="text-sm text-yellow-700">Skipped</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{testResults.executionTime}ms</div>
                      <div className="text-sm text-blue-700">Total Time</div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Success Rate</span>
                      <span>{Math.round((testResults.passedTests / testResults.totalTests) * 100)}%</span>
                    </div>
                    <Progress 
                      value={(testResults.passedTests / testResults.totalTests) * 100} 
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="suites" className="space-y-4">
              <div className="grid gap-4">
                {testResults.suites.map((suite, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          {getStatusIcon(suite.failedTests === 0 ? 'PASS' : 'FAIL')}
                          {suite.suiteName}
                        </span>
                        <Badge variant={suite.failedTests === 0 ? "default" : "destructive"}>
                          {suite.passedTests}/{suite.totalTests}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        Execution time: {suite.executionTime}ms
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {suite.tests.map((test, testIndex) => (
                          <div key={testIndex} className="flex items-center justify-between p-2 border rounded">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(test.status)}
                              <span className="font-medium">{test.testName}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">{test.duration}ms</div>
                              {test.status === 'FAIL' && (
                                <div className="text-xs text-red-600 max-w-xs truncate">{test.message}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Detailed Test Results</CardTitle>
                  <CardDescription>
                    Complete test execution details and error messages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {testResults.suites.map((suite, suiteIndex) => (
                      <div key={suiteIndex} className="border-l-4 border-primary pl-4">
                        <h3 className="font-semibold text-lg mb-2">{suite.suiteName}</h3>
                        {suite.tests.map((test, testIndex) => (
                          <div key={testIndex} className="mb-3 p-3 bg-slate-50 rounded">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{test.testName}</span>
                              {getStatusBadge(test.status)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Message: {test.message}</p>
                              <p>Duration: {test.duration}ms</p>
                              <p>Timestamp: {new Date(test.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Getting Started */}
        {!testResults && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Getting Started with QA Testing
              </CardTitle>
              <CardDescription>
                Run comprehensive tests to validate MadrasaApp functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Test Categories</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Authentication & Security Tests</li>
                      <li>• Educational System Tests</li>
                      <li>• Database Integrity Tests</li>
                      <li>• Parent Portal Tests</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Test Coverage</h3>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• User management and roles</li>
                      <li>• Course and attendance systems</li>
                      <li>• Data relationships</li>
                      <li>• Performance and reliability</li>
                    </ul>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    Click "Run All Tests" to execute the comprehensive test suite and validate system functionality.
                  </p>
                  <Button
                    onClick={() => runTestsMutation.mutate()}
                    disabled={runTestsMutation.isPending}
                    className="w-full md:w-auto"
                  >
                    {runTestsMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Start QA Testing
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}