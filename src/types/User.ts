export type UserRole = 'vendeur' | 'gerant';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
