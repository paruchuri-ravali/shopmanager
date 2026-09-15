export const rateLimiter = async (_c: unknown, next: () => Promise<void>) => {
  await next();
};

