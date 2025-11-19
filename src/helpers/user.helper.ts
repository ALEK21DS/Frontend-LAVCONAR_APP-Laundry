import { User } from '@/auth/interfaces/user.interface';

const isRole = (user: User | null | undefined, target: string) => {
  if (!user?.roles?.length) return false;
  const normalized = target.toUpperCase();
  return user.roles.some(role => role?.toUpperCase() === normalized);
};

export const isSuperAdminUser = (user: User | null | undefined): boolean =>
  isRole(user, 'SUPERADMIN');

export const getPreferredBranchOfficeId = (
  user: User | null | undefined,
): string | undefined => {
  if (!user) return undefined;
  if (isSuperAdminUser(user)) {
    return undefined;
  }
  if (user.branch_office_id) return user.branch_office_id;
  if (user.sucursalId) return user.sucursalId;
  if (user.allowed_branches?.length) {
    return user.allowed_branches[0]?.id;
  }
  return undefined;
};


