// types/express.d.ts
import { User } from '@prisma/client';
import { Request as ExpressRequest, Response as ExpressResponse, NextFunction, Application, Router } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        roleId: string | null;
        permissions: string[];
      };
      language?: 'fr' | 'en';
    }

    // Ré-exporter les types Express de base
    export type Request = ExpressRequest;
    export type Response = ExpressResponse;
    export type NextFunction = NextFunction;
    export type Application = Application;
    export type Router = Router;
  }
}

export {};