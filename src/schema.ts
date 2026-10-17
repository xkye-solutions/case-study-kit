// the shape a flow chapter's frontmatter takes in every Case Study.
import { z } from 'astro/zod';

/** Where the Prototype should go when this chapter is in view. Passed through to the Prototype as-is. */
export const goto = z.record(z.string(), z.unknown());

export const flowSchema = z.object({
  order: z.number(),
  num: z.string().optional(),
  title: z.string(),
  icon: z.string(),
  goto,
  before: z.string().optional(),
  after: z.string().optional(),
  decisions: z.array(z.object({ lead: z.string(), text: z.string() })).default([]),
  try: z.string().optional(),
});
