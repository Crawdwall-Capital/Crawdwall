import pool from '../../config/prisma.js';
import { generateFileUrl, cleanupFiles } from '../../config/upload.js';
import fs from 'fs';
import path from 'path';

/**
 * Upload files for a proposal
 */
export const uploadProposalFiles = async (req, res, next) => {
  try {
    const { proposalId } = req.params;

    // Validate proposal exists and belongs to user
    const proposalResult = await pool.query(
      'SELECT id, "organizerId" FROM "Proposal" WHERE id = $1',
      [proposalId]
    );

    if (proposalResult.rows.length === 0) {
      cleanupFiles(req.files);
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const proposal = proposalResult.rows[0];

    // Check if user owns this proposal
    if (proposal.organizerId !== req.user.userId) {
      cleanupFiles(req.files);
      return res.status(403).json({ message: 'Not authorized to upload files for this proposal' });
    }

    // Check if any files were uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No files were uploaded' });
    }

    // Prepare update data
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;
    const uploadedFiles = {};

    // Process uploaded files
    for (const [fieldName, files] of Object.entries(req.files)) {
      if (files && files.length > 0) {
        const file = files[0];
        const fileUrl = generateFileUrl(file.filename, fieldName);

        // Map field names to database column names
        const dbFieldName = fieldName === 'pitchVideo' ? 'pitchVideoUrl' : fieldName;
        updateFields.push(`"${dbFieldName}" = $${paramIndex}`);
        updateValues.push(fileUrl);
        paramIndex++;

        uploadedFiles[fieldName] = {
          originalName: file.originalname,
          fileName: file.filename,
          url: fileUrl,
          size: file.size,
          mimetype: file.mimetype
        };
      }
    }

    // Update proposal with file URLs
    updateValues.push(proposalId);
    const updateQuery = `
      UPDATE "Proposal" 
      SET ${updateFields.join(', ')}, "updatedAt" = NOW()
      WHERE id = $${paramIndex}
      RETURNING id, "eventTitle", "pitchVideoUrl", "budgetFile", "revenuePlanFile", "updatedAt"
    `;

    const updatedResult = await pool.query(updateQuery, updateValues);

    res.status(200).json({
      message: 'Files uploaded successfully',
      proposal: updatedResult.rows[0],
      uploadedFiles
    });
  } catch (err) {
    // Clean up uploaded files on error
    if (req.files) {
      cleanupFiles(req.files);
    }
    next(err);
  }
};

/**
 * Get uploaded files for a proposal
 */
export const getProposalFiles = async (req, res, next) => {
  try {
    const { proposalId } = req.params;

    // Validate proposal exists and belongs to user
    const result = await pool.query(
      `SELECT id, "eventTitle", "pitchVideoUrl", "budgetFile", "revenuePlanFile", "organizerId"
       FROM "Proposal"
       WHERE id = $1`,
      [proposalId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const proposal = result.rows[0];

    // Check if user owns this proposal
    if (proposal.organizerId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to view files for this proposal' });
    }

    // Build response with file information
    const filesInfo = {};

    if (proposal.pitchVideoUrl) {
      filesInfo.pitchVideo = {
        url: proposal.pitchVideoUrl,
        name: path.basename(proposal.pitchVideoUrl)
      };
    }

    if (proposal.budgetFile) {
      filesInfo.budgetFile = {
        url: proposal.budgetFile,
        name: path.basename(proposal.budgetFile)
      };
    }

    if (proposal.revenuePlanFile) {
      filesInfo.revenuePlanFile = {
        url: proposal.revenuePlanFile,
        name: path.basename(proposal.revenuePlanFile)
      };
    }

    res.status(200).json({
      proposalId: proposal.id,
      eventTitle: proposal.eventTitle,
      files: filesInfo
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a specific file from a proposal
 */
export const deleteProposalFile = async (req, res, next) => {
  try {
    const { proposalId, fileType } = req.params;

    // Validate file type
    const validFileTypes = ['pitchVideo', 'budgetFile', 'revenuePlanFile'];
    if (!validFileTypes.includes(fileType)) {
      return res.status(400).json({ message: 'Invalid file type. Must be: pitchVideo, budgetFile, or revenuePlanFile' });
    }

    // Validate proposal exists and belongs to user
    const result = await pool.query(
      `SELECT id, "organizerId", "pitchVideoUrl", "budgetFile", "revenuePlanFile"
       FROM "Proposal"
       WHERE id = $1`,
      [proposalId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const proposal = result.rows[0];

    // Check if user owns this proposal
    if (proposal.organizerId !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to delete files for this proposal' });
    }

    // Check if file exists
    const dbFieldName = fileType === 'pitchVideo' ? 'pitchVideoUrl' : fileType;
    const fileUrl = proposal[dbFieldName];

    if (!fileUrl) {
      return res.status(404).json({ message: `No ${fileType} found for this proposal` });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Update proposal to remove file reference
    await pool.query(
      `UPDATE "Proposal" SET "${dbFieldName}" = NULL, "updatedAt" = NOW() WHERE id = $1`,
      [proposalId]
    );

    res.status(200).json({
      message: `${fileType} deleted successfully`,
      proposalId
    });
  } catch (err) {
    next(err);
  }
};