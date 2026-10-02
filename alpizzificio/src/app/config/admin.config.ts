import { User } from '../models';

export const ADMIN_EMAILS: string[] = [
  'admin@alpizzificio77.it',
];

export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (user.email && ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === user.email.toLowerCase())) {
    return true;
  }
  return false;
}
