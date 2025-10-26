/**
 * Auth.js API Route Handler
 * 
 * This file exports the HTTP handlers for all authentication routes.
 * It handles sign-in, sign-out, callbacks, and session management automatically.
 * Routes like /api/auth/signin, /api/auth/signout, etc. are handled here.
 */

import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
