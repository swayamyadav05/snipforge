import { insforge } from './client'

export type User = {
  id: string
  email: string
  profile: {
    name: string | null
    avatar_url: string | null
  }
}

export async function signInWithGitHub(redirectTo: string): Promise<void> {
  await insforge.auth.signInWithOAuth('github', { redirectTo })
}

export async function signOut(): Promise<void> {
  await insforge.auth.signOut()
}

export async function getSession(): Promise<User | null> {
  const { data, error } = await insforge.auth.getCurrentUser()
  if (error || !data.user) return null
  const u = data.user
  return {
    id: u.id,
    email: u.email,
    profile: {
      name: u.profile?.name ?? null,
      avatar_url: u.profile?.avatar_url ?? null,
    },
  }
}
