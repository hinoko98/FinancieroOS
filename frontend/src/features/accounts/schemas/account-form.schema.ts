import { z } from 'zod';

export const accountFormSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio'),
  type: z.enum(['CASH', 'BANK', 'MOBILE_WALLET', 'SAVINGS', 'CREDIT', 'OTHER']),
  initialBalance: z.coerce.number().min(0, 'El saldo inicial no puede ser negativo'),
  currency: z.string().min(3).max(3),
  description: z.string().optional(),
});

export type AccountFormInput = z.input<typeof accountFormSchema>;
export type AccountFormValues = z.infer<typeof accountFormSchema>;
