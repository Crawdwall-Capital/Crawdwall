import Joi from 'joi';

export const createProposalSchema = Joi.object({
  eventTitle: Joi.string().min(5).required(),
  description: Joi.string().min(10).required(),
  expectedRevenue: Joi.number().positive().required(),
  timeline: Joi.string().required()
  // Note: Files are handled separately through multer middleware
  // pitchVideo, budgetFile, and revenuePlanFile are uploaded via multipart/form-data
});
