import Joi from 'joi';

export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().pattern(/^[0-9+\-\s()]{10,15}$/).required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('ORGANIZER', 'INVESTOR', 'ADMIN').required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});