import Joi from 'joi';

// Event type enum values
const EVENT_TYPES = [
  'MUSIC_FESTIVAL',
  'TECH_CONFERENCE',
  'ART_EXHIBITION',
  'FOOD_FESTIVAL',
  'SPORTS_EVENT',
  'BUSINESS_SUMMIT',
  'OTHER'
];

export const createProposalSchema = Joi.object({
  // Basic Information
  eventTitle: Joi.string().min(5).max(200).required()
    .messages({
      'string.min': 'Event title must be at least 5 characters long',
      'string.max': 'Event title cannot exceed 200 characters',
      'any.required': 'Event title is required'
    }),

  description: Joi.string().min(10).max(2000).required()
    .messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 2000 characters',
      'any.required': 'Description is required'
    }),

  eventType: Joi.string().valid(...EVENT_TYPES).required()
    .messages({
      'any.only': 'Event type must be one of: Music Festival, Tech Conference, Art Exhibition, Food Festival, Sports Event, Business Summit, or Other',
      'any.required': 'Event type is required'
    }),

  // Financial Information
  budgetRequested: Joi.number().positive().max(10000000).required()
    .messages({
      'number.positive': 'Budget requested must be a positive amount',
      'number.max': 'Budget requested cannot exceed $10,000,000',
      'any.required': 'Budget requested is required'
    }),

  expectedRevenue: Joi.number().positive().max(50000000).required()
    .messages({
      'number.positive': 'Expected revenue must be a positive amount',
      'number.max': 'Expected revenue cannot exceed $50,000,000',
      'any.required': 'Expected revenue is required'
    }),

  // Event Details
  eventDuration: Joi.string().min(1).max(100).required()
    .messages({
      'string.min': 'Event duration is required',
      'string.max': 'Event duration cannot exceed 100 characters',
      'any.required': 'Event duration is required'
    }),

  timeline: Joi.string().min(5).max(500).required()
    .messages({
      'string.min': 'Event timeline must be at least 5 characters long',
      'string.max': 'Event timeline cannot exceed 500 characters',
      'any.required': 'Event timeline is required'
    }),

  // Business Plan
  revenuePlan: Joi.string().min(20).max(3000).required()
    .messages({
      'string.min': 'Revenue plan must be at least 20 characters long',
      'string.max': 'Revenue plan cannot exceed 3000 characters',
      'any.required': 'Revenue plan is required'
    }),

  targetAudience: Joi.string().min(10).max(1000).required()
    .messages({
      'string.min': 'Target audience description must be at least 10 characters long',
      'string.max': 'Target audience description cannot exceed 1000 characters',
      'any.required': 'Target audience is required'
    }),

  // Optional fields
  pitchVideoUrl: Joi.string().uri().optional()
    .messages({
      'string.uri': 'Pitch video URL must be a valid URL'
    }),

  isDraft: Joi.boolean().optional().default(false)

  // Note: supportingDocuments are handled separately through file upload middleware
});

export const updateProposalSchema = Joi.object({
  eventTitle: Joi.string().min(5).max(200).optional(),
  description: Joi.string().min(10).max(2000).optional(),
  eventType: Joi.string().valid(...EVENT_TYPES).optional(),
  budgetRequested: Joi.number().positive().max(10000000).optional(),
  expectedRevenue: Joi.number().positive().max(50000000).optional(),
  eventDuration: Joi.string().min(1).max(100).optional(),
  timeline: Joi.string().min(5).max(500).optional(),
  revenuePlan: Joi.string().min(20).max(3000).optional(),
  targetAudience: Joi.string().min(10).max(1000).optional(),
  pitchVideoUrl: Joi.string().uri().optional()
}).min(1); // At least one field must be provided for update

// Export event types for use in other modules
export { EVENT_TYPES };
