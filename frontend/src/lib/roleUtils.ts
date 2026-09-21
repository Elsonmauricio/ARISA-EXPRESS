export const normalizeRole = (role: unknown): string =>
  String(role ?? '').trim().toUpperCase();

export const canAccessAdmin = (role: unknown): boolean => {
  const normalized = normalizeRole(role);
  return normalized === 'ADMIN' || normalized === 'OPERATOR';
};