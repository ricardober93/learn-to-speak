import { z } from 'zod';

export const ConsonantSchema = z.object({
  id: z.string().cuid().optional(),
  letter: z.string().min(1).max(1),
  name: z.string().min(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const WordSchema = z.object({
  id: z.string().cuid().optional(),
  text: z.string().min(1),
  syllables: z.number().int().min(1).max(10),
  difficulty: z.number().int().min(1).max(5).default(1),
  consonantId: z.string().cuid(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const UserProgressSchema = z.object({
  id: z.string().cuid().optional(),
  sessionId: z.string(),
  consonantId: z.string().cuid(),
  wordsCompleted: z.number().int().min(0).default(0),
  totalWords: z.number().int().min(0).default(0),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const WordGeneratorOptionsSchema = z.object({
  consonantId: z.string().cuid(),
  syllableCount: z.number().int().min(1).max(5).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
  maxWords: z.number().int().min(1).max(15).default(15),
});

export type ConsonantInput = z.infer<typeof ConsonantSchema>;
export type WordInput = z.infer<typeof WordSchema>;
export type UserProgressInput = z.infer<typeof UserProgressSchema>;
export type WordGeneratorOptionsInput = z.infer<typeof WordGeneratorOptionsSchema>;