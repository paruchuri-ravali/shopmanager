import { sign } from 'hono/jwt';

export type TokenPayload = {
  userId: string;
  tenantId: string;
};

export const signToken = (payload: TokenPayload) =>
  sign({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 15 }, process.env.JWT_SECRET!);

export const signRefreshToken = (payload: TokenPayload) =>
  sign({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, process.env.JWT_REFRESH_SECRET!);
