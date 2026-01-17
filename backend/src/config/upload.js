import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Ensure uploads directory exists
import fs from 'fs';
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// File storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(uploadDir, file.fieldname);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with original extension
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Define allowed file types for each field
  const allowedTypes = {
    pitchVideo: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
    budgetFile: ['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
    revenuePlanFile: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  };

  const fieldName = file.fieldname;
  const mimeType = file.mimetype;

  if (allowedTypes[fieldName] && allowedTypes[fieldName].includes(mimeType)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type for ${fieldName}. Allowed types: ${allowedTypes[fieldName]?.join(', ') || 'none'}`), false);
  }
};

// Multer configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 3 // Maximum 3 files per request
  }
});

// Single file upload middleware
export const uploadSingle = (fieldName) => {
  return upload.single(fieldName);
};

// Multiple files upload middleware
export const uploadMultiple = (fields) => {
  return upload.fields(fields);
};

// Helper function to generate file URLs
export const generateFileUrl = (filename, fieldName) => {
  return `/uploads/${fieldName}/${filename}`;
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