import { z } from "zod";

export const ticketStatusSchema = z.enum([
  "Submitted",
  "In QA",
  "Issues Found",
  "Rework",
  "Approved",
  "Rejected",
]);

export const ticketPrioritySchema = z.enum(["LOW", "MED", "HIGH"]);

export const ticketCreateSchema = z.object({
  client: z.string().trim().min(1).max(120),
  pole: z.string().trim().min(1).max(50),
  designerId: z.string().uuid(),
  qaOwnerId: z.string().uuid(),
  priority: ticketPrioritySchema,
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
});
