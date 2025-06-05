import { z } from 'zod'

const userStatusSchema = z.union([
  z.literal('active'),
  z.literal('inactive'),
  z.literal('suspended'),
])
export type UserStatus = z.infer<typeof userStatusSchema>

// Export the schema for potential future use
export { userStatusSchema }

const roleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  level: z.number().optional(),
  permissions: z.array(z.string()).optional(),
})
export type Role = z.infer<typeof roleSchema>

const userProfileSchema = z.object({
  id: z.string(),
  phone_number: z.string().nullable(),
  employee_id: z.string().nullable(),
  title: z.string().nullable(),
  avatar: z.string().nullable(),
  preferences: z.record(z.any()).default({}),
  azure_ad_groups: z.array(z.string()).default([]),
})
export type UserProfile = z.infer<typeof userProfileSchema>

const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  is_active: z.boolean(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  profile: userProfileSchema.nullable(),
  roles: z.array(roleSchema).default([]),
})
export type User = z.infer<typeof userSchema>

export const userListSchema = z.array(userSchema)
export type UserList = z.infer<typeof userListSchema>

// Helper function to get user's display name
export function getUserDisplayName(user: User): string {
  if (user.first_name && user.last_name) {
    return `${user.first_name} ${user.last_name}`
  }
  if (user.first_name) {
    return user.first_name
  }
  if (user.last_name) {
    return user.last_name
  }
  return user.username
}

// Helper function to get user status
export function getUserStatus(user: User): UserStatus {
  return user.is_active ? 'active' : 'inactive'
}

// Helper function to get primary role
export function getPrimaryRole(user: User): string {
  // Check if user has roles assigned
  if (user.roles && user.roles.length > 0) {
    return user.roles[0].name
  }
  
  // Fallback: Check username patterns for admin users
  const username = user.username.toLowerCase()
  if (username.includes('admin') || username === 'mj@manaakitech.com') {
    return 'Admin'
  }
  
  // Check if user has Azure AD groups (might indicate elevated access)
  if (user.profile?.azure_ad_groups && user.profile.azure_ad_groups.length > 0) {
    return 'User (Azure)'
  }
  
  // Default for regular users
  return 'User'
}