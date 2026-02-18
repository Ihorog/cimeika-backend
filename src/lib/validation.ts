/**
 * Input validation schemas using Zod
 */
import { z } from 'zod';

/**
 * Common schemas
 */
export const idSchema = z.string().min(1).max(255);
export const timestampSchema = z.number().int().positive();
export const prioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);
export const agentTypeSchema = z.enum(['ci', 'podiya', 'nastriy', 'malya', 'kazkar', 'kalendar', 'gallery']);

/**
 * Podiya (Event) schemas
 */
export const podiyaEventSchema = z.object({
  type: z.string().min(1).max(100),
  data: z.record(z.unknown()).optional(),
  priority: prioritySchema.optional(),
});

/**
 * Nastriy (Mood) schemas
 */
export const nastriyMoodSchema = z.object({
  mood: z.string().min(1).max(50),
  score: z.number().min(0).max(100),
  note: z.string().max(500).optional(),
});

/**
 * Malya (Idea) schemas
 */
export const malyaIdeaSchema = z.object({
  content: z.string().min(1).max(2000),
  tags: z.array(z.string().max(50)).max(10).optional(),
  category: z.string().max(50).optional(),
});

/**
 * Kazkar (Story) schemas
 */
export const kazkarStorySchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  genre: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

/**
 * Kalendar (Schedule) schemas
 */
export const kalendarEventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  startTime: timestampSchema,
  endTime: timestampSchema.optional(),
  recurrence: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  reminder: z.number().int().min(0).optional(),
});

/**
 * Gallery (File) schemas
 */
export const galleryUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(100),
  size: z.number().int().positive().max(10485760), // 10MB max
  tags: z.array(z.string().max(50)).max(10).optional(),
});

/**
 * CI (Orchestration) schemas
 */
export const ciOrchestrationSchema = z.object({
  action: z.enum(['sync', 'backup', 'optimize', 'analyze']),
  targets: z.array(agentTypeSchema).optional(),
  priority: prioritySchema.optional(),
});

/**
 * Generic message schema
 */
export const agentMessageSchema = z.object({
  id: idSchema.optional(),
  type: z.enum(['request', 'response', 'notification', 'error']),
  from: agentTypeSchema,
  to: agentTypeSchema,
  payload: z.record(z.unknown()),
  priority: prioritySchema.optional(),
  timestamp: timestampSchema.optional(),
});

/**
 * Export all schemas as a collection
 */
export const schemas = {
  id: idSchema,
  timestamp: timestampSchema,
  priority: prioritySchema,
  agentType: agentTypeSchema,
  podiyaEvent: podiyaEventSchema,
  nastriyMood: nastriyMoodSchema,
  malyaIdea: malyaIdeaSchema,
  kazkarStory: kazkarStorySchema,
  kalendarEvent: kalendarEventSchema,
  galleryUpload: galleryUploadSchema,
  ciOrchestration: ciOrchestrationSchema,
  agentMessage: agentMessageSchema,
};
