export const success = <T>(data: T, message = 'Success') => ({
  success: true,
  message,
  data
});

export const paginated = <T>(data: T[], total: number, page: number, limit: number) => ({
  success: true,
  data,
  pagination: { total, page, limit, totalPages: Math.ceil(total / limit) }
});

export const error = (message: string, code?: string) => ({
  success: false,
  message,
  code
});
