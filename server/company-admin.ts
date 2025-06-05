import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { z } from "zod";
import { insertOrganizationSchema, insertUserFeedbackSchema, insertFeedbackCommentSchema } from "@shared/schema";

// Company Admin authorization middleware
export function requireCompanyAdmin(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: "Authentication required" });
  }
  
  if (req.user?.role !== 'company_admin') {
    return res.status(403).json({ error: "Company admin access required" });
  }
  
  next();
}

export function setupCompanyAdminRoutes(app: Express) {
  // Company overview dashboard
  app.get("/api/company-admin/overview", requireCompanyAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getCompanyOverviewStats();
      const recentFeedback = await storage.getAllUserFeedback({ limit: 10 });
      const organizations = await storage.getAllOrganizations();
      
      res.json({
        success: true,
        data: {
          stats,
          recentFeedback: recentFeedback.slice(0, 5),
          organizations: organizations.slice(0, 10),
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Error fetching company overview:", error);
      res.status(500).json({
        error: "Failed to fetch company overview",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Organization management
  app.get("/api/company-admin/organizations", requireCompanyAdmin, async (req: Request, res: Response) => {
    try {
      const organizations = await storage.getAllOrganizations();
      const organizationsWithStats = await Promise.all(
        organizations.map(async (org) => ({
          ...org,
          stats: await storage.getOrganizationStats(org.id)
        }))
      );
      
      res.json({
        success: true,
        data: organizationsWithStats
      });
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({
        error: "Failed to fetch organizations",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/company-admin/organizations", requireCompanyAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(validatedData);
      
      // Log organization creation
      await storage.createOrganizationLog({
        organizationId: organization.id,
        action: "organization_created",
        description: `Organization "${organization.name}" created`,
        performedBy: req.user?.id,
        metadata: JSON.stringify({ organizationId: organization.id }),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.status(201).json({
        success: true,
        data: organization
      });
    } catch (error) {
      console.error("Error creating organization:", error);
      res.status(500).json({
        error: "Failed to create organization",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/company-admin/organizations/:id", requireCompanyAdmin, async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.id);
      const organization = await storage.getOrganization(organizationId);
      
      if (!organization) {
        return res.status(404).json({ error: "Organization not found" });
      }
      
      const users = await storage.getOrganizationUsers(organizationId);
      const stats = await storage.getOrganizationStats(organizationId);
      const feedback = await storage.getFeedbackByOrganization(organizationId);
      const logs = await storage.getOrganizationLogs(organizationId, 20);
      
      res.json({
        success: true,
        data: {
          organization,
          users,
          stats,
          feedback,
          logs
        }
      });
    } catch (error) {
      console.error("Error fetching organization details:", error);
      res.status(500).json({
        error: "Failed to fetch organization details",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/company-admin/organizations/:id", requireCompanyAdmin, async (req: Request, res: Response) => {
    try {
      const organizationId = parseInt(req.params.id);
      const updateData = req.body;
      
      const updatedOrganization = await storage.updateOrganization(organizationId, updateData);
      
      // Log organization update
      await storage.createOrganizationLog({
        organizationId,
        action: "organization_updated",
        description: `Organization settings updated`,
        performedBy: req.user?.id,
        metadata: JSON.stringify(updateData),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json({
        success: true,
        data: updatedOrganization
      });
    } catch (error) {
      console.error("Error updating organization:", error);
      res.status(500).json({
        error: "Failed to update organization",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // User feedback management
  app.get("/api/company-admin/feedback", requireCompanyAdmin, async (req: Request, res: Response) => {
    try {
      const { status, priority, category, organization } = req.query;
      const filters: any = {};
      
      if (status) filters.status = status;
      if (priority) filters.priority = priority;
      if (category) filters.category = category;
      
      const feedback = await storage.getAllUserFeedback(filters);
      
      // Enhance feedback with user and organization details
      const enhancedFeedback = await Promise.all(
        feedback.map(async (item) => {
          const user = await storage.getUser(item.userId);
          const org = item.organizationId ? await storage.getOrganization(item.organizationId) : null;
          const comments = await storage.getFeedbackComments(item.id);
          
          return {
            ...item,
            user: user ? { id: user.id, fullName: user.fullName, email: user.email, role: user.role } : null,
            organization: org ? { id: org.id, name: org.name } : null,
            commentsCount: comments.length
          };
        })
      );
      
      res.json({
        success: true,
        data: enhancedFeedback
      });
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({
        error: "Failed to fetch feedback",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/company-admin/feedback/:id", requireCompanyAdmin, async (req: Request, res: Response) => {
    try {
      const feedbackId = parseInt(req.params.id);
      const feedback = await storage.getUserFeedback(feedbackId);
      
      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }
      
      const user = await storage.getUser(feedback.userId);
      const organization = feedback.organizationId ? await storage.getOrganization(feedback.organizationId) : null;
      const comments = await storage.getFeedbackComments(feedbackId);
      
      // Enhance comments with user details
      const enhancedComments = await Promise.all(
        comments.map(async (comment) => {
          const commentUser = await storage.getUser(comment.userId);
          return {
            ...comment,
            user: commentUser ? { id: commentUser.id, fullName: commentUser.fullName, role: commentUser.role } : null
          };
        })
      );
      
      res.json({
        success: true,
        data: {
          ...feedback,
          user: user ? { id: user.id, fullName: user.fullName, email: user.email, role: user.role } : null,
          organization: organization ? { id: organization.id, name: organization.name } : null,
          comments: enhancedComments
        }
      });
    } catch (error) {
      console.error("Error fetching feedback details:", error);
      res.status(500).json({
        error: "Failed to fetch feedback details",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/company-admin/feedback/:id", requireCompanyAdmin, async (req: Request, res: Response) => {
    try {
      const feedbackId = parseInt(req.params.id);
      const updateData = req.body;
      
      const updatedFeedback = await storage.updateUserFeedback(feedbackId, updateData);
      
      res.json({
        success: true,
        data: updatedFeedback
      });
    } catch (error) {
      console.error("Error updating feedback:", error);
      res.status(500).json({
        error: "Failed to update feedback",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/company-admin/feedback/:id/comments", requireCompanyAdmin, async (req: Request, res: Response) => {
    try {
      const feedbackId = parseInt(req.params.id);
      const { comment, isInternal = true } = req.body;
      
      const newComment = await storage.createFeedbackComment({
        feedbackId,
        userId: req.user?.id!,
        comment,
        isInternal
      });
      
      res.status(201).json({
        success: true,
        data: newComment
      });
    } catch (error) {
      console.error("Error creating feedback comment:", error);
      res.status(500).json({
        error: "Failed to create comment",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // All users with organization details
  app.get("/api/company-admin/users", requireCompanyAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsersWithOrganizations();
      
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        error: "Failed to fetch users",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // System analytics for company admin
  app.get("/api/company-admin/analytics", requireCompanyAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getCompanyOverviewStats();
      const organizations = await storage.getAllOrganizations();
      const feedback = await storage.getAllUserFeedback();
      
      // Calculate additional metrics
      const feedbackByStatus = feedback.reduce((acc: any, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, {});
      
      const feedbackByPriority = feedback.reduce((acc: any, item) => {
        acc[item.priority] = (acc[item.priority] || 0) + 1;
        return acc;
      }, {});
      
      const feedbackByCategory = feedback.reduce((acc: any, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {});
      
      res.json({
        success: true,
        data: {
          overview: stats,
          organizations: {
            total: organizations.length,
            byStatus: stats.organizationsByStatus,
            growth: organizations.filter(org => {
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return org.createdAt && new Date(org.createdAt) > weekAgo;
            }).length
          },
          feedback: {
            total: feedback.length,
            byStatus: feedbackByStatus,
            byPriority: feedbackByPriority,
            byCategory: feedbackByCategory
          }
        }
      });
    } catch (error) {
      console.error("Error fetching company analytics:", error);
      res.status(500).json({
        error: "Failed to fetch analytics",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
}