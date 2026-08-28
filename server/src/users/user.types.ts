import { Prisma } from '@prisma/client';

export const publicUserSelect = {
  id: true,
  username: true,
  email: true,
  nickname: true,
  avatarUrl: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

export type AuthenticatedUser = Pick<
  PublicUser,
  'id' | 'username' | 'email' | 'role' | 'status'
>;
