import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Ensure uploads directory exists
import fs from 'fs';
const uploadDir = 'uploads/';
const documentsDir = 'uploads/documents/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// File storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Store all supporting documents in documents folder
    if (file.fieldname === 'supportingDocuments') {
      cb(null, documentsDir);
    } else {
      const uploadPath = path.join(uploadDir, file.fieldname);
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    const timestamp = Date.now();
    cb(null, `${timestamp}-${uniqueSuffix}${extension}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedMimeTypes = [
    // PDF files
    'application/pdf',
    // Microsoft Word documents
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Microsoft Excel files
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Additional document types
    'text/plain',
    'text/csv'
  ];

  const allowedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv'];

  const fileExtension = path.extname(file.originalname).toLowerCase();
  const mimeType = file.mimetype;

  if (allowedMimeTypes.includes(mimeType) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX (up to 10MB)`), false);
  }
};

// Multer configuration for supporting documents
export const uploadMultiple = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit per file
    files: 5 // Maximum 5 files per request
  }
});

// Single file upload middleware (for other use cases)
export const uploadSingle = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Legacy upload configuration (keeping for backward compatibility)
export const upload = uploadMultiple;

// Helper function to generate file URLs
export const generateFileUrl = (filename, subfolder = 'documents') => {
  return `/uploads/${subfolder}/${filename}`;
};

// Helper function to clean up files on error
export const cleanupFiles = (files) => {
  if (!files) return;

  const fileList = Array.isArray(files) ? files : Object.values(files).flat();

  fileList.forEach(file => {
    if (file && file.path) {
      fs.unlink(file.path, (err) => {
        if (err) console.error('Error cleaning up file:', err);
      });
    }
  });
};

// Helper function to validate file size and type
export const validateFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

  if (file.size > maxSize) {
    throw new Error('File size exceeds 10MB limit');
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX files are allowed');
  }

  return true;
};