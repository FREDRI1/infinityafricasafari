import { z } from "zod";

export const bookingRequestSchema = z.object({
  submissionId: z.string().uuid(),
  safariSlug: z.string().min(1).max(100),
  travelDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Choose a valid travel date.")
    .refine((value) => {
      const date = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(date.valueOf()) && date > new Date();
    }, "Travel date must be in the future."),
  adults: z.coerce.number().int().min(1).max(50),
  children: z.coerce.number().int().min(0).max(50),
  rooms: z.coerce.number().int().min(1).max(20),
  requestedActivities: z.string().trim().max(500).optional().default(""),
  accommodationPreference: z.string().trim().max(120).optional().default(""),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(5).max(30),
  whatsapp: z.string().trim().max(30).optional().default(""),
  countryOfResidence: z.string().trim().max(100).optional().default(""),
  preferredCommunication: z.enum(["EMAIL", "WHATSAPP", "PHONE"]),
  specialRequirements: z.string().trim().max(3000).optional().default(""),
  website: z.string().max(0).optional().default(""),
}).strict();

export type BookingRequestInput = z.infer<typeof bookingRequestSchema>;
export const bookingFormSchema = bookingRequestSchema.omit({
  submissionId: true,
});
export type BookingFormInput = z.input<typeof bookingFormSchema>;
export type BookingFormOutput = z.output<typeof bookingFormSchema>;
