import { ZodError } from 'zod';

const formatError = (err: unknown) => {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as any).response?.data;
    if (data?.errors && Array.isArray(data.errors)) {
      return data.errors.map((issue: any) => `${issue.path?.join('.') || 'form'}: ${issue.message}`).join('\n');
    }
    if (typeof data?.message === 'string') {
      return data.message;
    }
  }
  if (err instanceof Error) return err.message;
  return 'Registration failed';
};

export default formatError;
