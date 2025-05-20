import { Express, Request, Response, NextFunction } from "express";
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs';
import { storage } from './storage';

export function setupFileUploads(app: Express) {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure express-fileupload middleware
  app.use(fileUpload({
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
    createParentPath: true,
    useTempFiles: true,
    tempFileDir: path.join(uploadsDir, 'temp'),
    abortOnLimit: true
  }));

  // API endpoint for uploading materials (teacher/director role)
  app.post('/api/materials/upload', checkRole(['director', 'teacher']), async (req: Request, res: Response) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: 'No files were uploaded' });
      }

      const { courseId, title, description } = req.body;
      
      if (!courseId || !title) {
        return res.status(400).json({ error: 'Course ID and title are required' });
      }

      const file = req.files.file as fileUpload.UploadedFile;
      
      // Create unique filename
      const timestamp = Date.now();
      const fileExt = path.extname(file.name);
      const fileName = `${timestamp}-${file.name.replace(/\s+/g, '-')}`;
      const filePath = path.join('materials', fileName);
      const uploadPath = path.join(uploadsDir, filePath);
      
      // Move the file to the target location
      await file.mv(uploadPath);
      
      // Create the material record in database
      const newMaterial = await storage.createMaterial({
        courseId: parseInt(courseId as string),
        title: title as string,
        description: description as string || '',
        filePath: filePath,
        fileType: fileExt.replace('.', ''),
        fileSize: file.size,
        uploadedBy: req.user!.id,
        createdAt: new Date()
      });

      res.status(201).json(newMaterial);
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ error: 'File upload failed' });
    }
  });

  // API endpoint for uploading assignments (student role)
  app.post('/api/assignments/submit', checkRole(['student']), async (req: Request, res: Response) => {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: 'No files were uploaded' });
      }

      const { assignmentId, comments } = req.body;
      
      if (!assignmentId) {
        return res.status(400).json({ error: 'Assignment ID is required' });
      }

      const file = req.files.file as fileUpload.UploadedFile;
      
      // Create unique filename
      const timestamp = Date.now();
      const fileExt = path.extname(file.name);
      const fileName = `${timestamp}-${file.name.replace(/\s+/g, '-')}`;
      const filePath = path.join('submissions', fileName);
      const uploadPath = path.join(uploadsDir, filePath);
      
      // Move the file to the target location
      await file.mv(uploadPath);
      
      // Create the submission record in database
      const newSubmission = await storage.createSubmission({
        assignmentId: parseInt(assignmentId as string),
        studentId: req.user!.id,
        filePath: filePath,
        fileType: fileExt.replace('.', ''),
        fileSize: file.size,
        comments: comments as string || '',
        submittedAt: new Date(),
        status: 'submitted'
      });

      res.status(201).json(newSubmission);
    } catch (error) {
      console.error('Assignment submission error:', error);
      res.status(500).json({ error: 'Assignment submission failed' });
    }
  });

  // API endpoint for downloading files
  app.get('/api/files/:fileType/:fileName', async (req: Request, res: Response) => {
    try {
      const { fileType, fileName } = req.params;
      
      // Ensure fileType is either 'materials' or 'submissions' to prevent directory traversal
      if (fileType !== 'materials' && fileType !== 'submissions') {
        return res.status(400).json({ error: 'Invalid file type' });
      }
      
      const filePath = path.join(uploadsDir, fileType, fileName);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      res.download(filePath);
    } catch (error) {
      console.error('File download error:', error);
      res.status(500).json({ error: 'File download failed' });
    }
  });
}

// Middleware to check user role
function checkRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user!.role)) {
      return res.status(403).json({ error: 'Forbidden - insufficient permissions' });
    }
    
    next();
  };
}