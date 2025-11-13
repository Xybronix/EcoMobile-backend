import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
        roleId: string | null;
        permissions: string[];
      };
      language?: 'fr' | 'en';
    }
  }
}

export {};