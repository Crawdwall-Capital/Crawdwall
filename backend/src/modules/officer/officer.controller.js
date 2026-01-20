import * as officerService from './officer.service.js';
import jwt from 'jsonwebtoken';
import { successResponse, errorResponse } from '../utils/response.js';

/**
 * OFFICER LOGIN
 */
export const loginOfficer = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return errorResponse(res, 'Email and password are required', 400);
        }

        const officer = await officerService.loginOfficer({ email, password });

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: officer.id,
                role: 'OFFICER',
                email: officer.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return successResponse(res, {
            message: 'Login successful',
            token,
            officer: {
                id: officer.id,
                email: officer.email,
                name: officer.name,
                role: 'OFFICER'
            }
        }, 200);

    } catch (error) {
        console.error('Officer login error:', error);
        return errorResponse(res, error.message, 401);
    }
};

/**
 * GET OFFICER PROFILE
 */
export const getOfficerProfile = async (req, res) => {
    try {
        const officerId = req.user.userId;
        const officer = await officerService.getOfficerById(officerId);

        return successResponse(res, {
            officer: {
                id: officer.id,
                email: officer.email,
                name: officer.name,
                status: officer.status,
                createdAt: officer.createdAt
            }
        });

    } catch (error) {
        console.error('Get officer profile error:', error);
        return errorResponse(res, error.message, 404);
    }
};

/**
 * GET SUBMITTED PROPOSALS FOR REVIEW
 */
export const getSubmittedProposals = async (req, res) => {
    try {
        const proposals = await officerService.getSubmittedProposals();

        return successResponse(res, {
            proposals: proposals.map(proposal => ({
                id: proposal.id,
                eventTitle: proposal.eventTitle,
                description: proposal.description,
                expectedRevenue: proposal.expectedRevenue,
                timeline: proposal.timeline,
                status: proposal.status,
                submittedAt: proposal.createdAt,
                organizerName: proposal.organizerName
            }))
        });

    } catch (error) {
        console.error('Get submitted proposals error:', error);
        return errorResponse(res, error.message, 500);
    }
};

/**
 * GET PROPOSAL DETAILS FOR REVIEW
 */
export const getProposalDetails = async (req, res) => {
    try {
        const { proposalId } = req.params;
        const proposal = await officerService.getProposalDetails(proposalId);

        return successResponse(res, {
            proposal: {
                id: proposal.id,
                eventTitle: proposal.eventTitle,
                description: proposal.description,
                expectedRevenue: proposal.expectedRevenue,
                timeline: proposal.timeline,
                status: proposal.status,
                submittedAt: proposal.createdAt,
                organizerName: proposal.organizerName,
                organizerEmail: proposal.organizerEmail
            }
        });

    } catch (error) {
        console.error('Get proposal details error:', error);
        return errorResponse(res, error.message, 404);
    }
};

/**
 * GET MY REVIEWS (LEGACY)
 */
export const getMyReviews = async (req, res) => {
    try {
        const officerId = req.user.userId;
        const reviews = await officerService.getOfficerReviews(officerId);

        return successResponse(res, {
            reviews: reviews.map(review => ({
                id: review.id,
                proposalId: review.proposalId,
                decision: review.decision,
                riskAssessment: review.riskAssessment,
                revenueComment: review.revenueComment,
                notes: review.notes,
                submittedAt: review.createdAt
            }))
        });

    } catch (error) {
        console.error('Get officer reviews error:', error);
        return errorResponse(res, error.message, 500);
    }
};
/**
 * GET PROPOSAL DOCUMENTS FOR DOWNLOAD
 */
export const getProposalDocuments = async (req, res) => {
    try {
        const { proposalId } = req.params;
        const proposal = await officerService.getProposalWithDocuments(proposalId);

        // Parse supporting documents from JSON
        let supportingDocuments = [];
        if (proposal.supportingDocuments) {
            try {
                supportingDocuments = JSON.parse(proposal.supportingDocuments);
            } catch (e) {
                console.warn('Failed to parse supporting documents:', e);
            }
        }

        return successResponse(res, {
            proposal: {
                id: proposal.id,
                eventTitle: proposal.eventTitle,
                organizerName: proposal.organizerName,
                organizerEmail: proposal.organizerEmail
            },
            documents: {
                pitchVideo: proposal.pitchVideoUrl ? {
                    name: 'Pitch Video',
                    url: proposal.pitchVideoUrl,
                    type: 'VIDEO'
                } : null,
                supportingDocuments: supportingDocuments.map((doc, index) => ({
                    index: index,
                    name: doc.originalName || doc.name,
                    filename: doc.filename,
                    size: doc.size,
                    type: doc.mimetype || 'application/octet-stream',
                    uploadedAt: doc.uploadedAt,
                    downloadable: true
                }))
            },
            totalDocuments: supportingDocuments.length + (proposal.pitchVideoUrl ? 1 : 0)
        });

    } catch (error) {
        console.error('Get proposal documents error:', error);
        return errorResponse(res, error.message, 404);
    }
};

/**
 * DOWNLOAD SPECIFIC DOCUMENT (REDIRECT TO URL)
 */
export const downloadDocument = async (req, res) => {
    try {
        const { proposalId, documentIndex } = req.params;
        const proposal = await officerService.getProposalWithDocuments(proposalId);

        // Parse supporting documents from JSON
        let supportingDocuments = [];
        if (proposal.supportingDocuments) {
            try {
                supportingDocuments = JSON.parse(proposal.supportingDocuments);
            } catch (e) {
                return errorResponse(res, 'Invalid document data', 400);
            }
        }

        const docIndex = parseInt(documentIndex);
        if (docIndex < 0 || docIndex >= supportingDocuments.length) {
            return errorResponse(res, 'Document not found', 404);
        }

        const document = supportingDocuments[docIndex];

        // Log document access for audit
        await officerService.logDocumentAccess(req.user.userId, proposalId, document.originalName || document.name);

        // Serve the file
        const path = await import('path');
        const fs = await import('fs');

        const filePath = document.path;

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            return errorResponse(res, 'File not found on server', 404);
        }

        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename="${document.originalName || document.filename}"`);
        res.setHeader('Content-Type', document.mimetype || 'application/octet-stream');

        // Stream the file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

    } catch (error) {
        console.error('Download document error:', error);
        return errorResponse(res, error.message, 404);
    }
};