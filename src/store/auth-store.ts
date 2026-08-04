import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { resolvePermissions } from '@/utils/permission'

type UserProfile = {
  id: string
  username: string
  displayName: string
  roleId: string
  roleName: string
  orgId?: string | null
  orgName: string
  permissions: string[]
  mustChangePassword?: boolean
  tenantId?: string
  tenantName?: string
  tenantStatus?: string
  tenantModules?: string[]
  tenantCode?: string
}

type AuthState = {
  token: string | null
  user: UserProfile | null
  isAuthenticated: boolean
  mustChangePassword: boolean
  setSession: (payload: { token: string; user: UserProfile }) => void
  login: (payload: { username: string; password: string }) => void
  logout: () => void
  clearMustChangePassword: () => void
}

function normalizeUserProfile(user: Partial<UserProfile> | null | undefined): UserProfile | null {
  if (!user || !user.id || !user.username || !user.displayName) {
    return null
  }

  const roleName = user.roleName ?? (user.username === 'admin' ? '超级管理员' : '普通监测员')

  let permissions = resolvePermissions({
    username: user.username,
    roleName,
    permissions: user.permissions,
  })

  // If user has tenantModules but no permissions (e.g. tenant admin without role),
  // grant all permissions within tenant module scope (backend already handles this,
  // but this is a frontend safety net)
  if (permissions.length === 0 && user.tenantModules && user.tenantModules.length > 0) {
    // Map tenantModules to permission keys
    const modulePerms: Record<string, string[]> = {
      '首页': ['home:view'],
      '影像数据': ['images:view'],
      '数据展示': ['data:view'],
      '设备管理': ['devices:view'],
      'AI物种分析': ['species:view', 'species:animal', 'species:plant'],
      '设备运维中心': ['ops:view'],
      '环境监测': ['env:view'],
      '用户管理': ['users:view', 'roles:view'],
      '组织机构': ['orgs:view'],
    }
    const mappedPerms = user.tenantModules.flatMap(m => modulePerms[m] ?? [])
    if (mappedPerms.length > 0) {
      permissions = mappedPerms
    }
  }

  return {
    id: String(user.id),
    username: user.username,
    displayName: user.displayName,
    roleId: String(user.roleId ?? (roleName === '超级管理员' ? '1' : '0')),
    roleName,
    orgId: user.orgId != null ? String(user.orgId) : null,
    orgName: user.orgName ?? '全部',
    permissions,
    mustChangePassword: user.mustChangePassword ?? false,
    tenantId: user.tenantId,
    tenantName: user.tenantName,
    tenantStatus: user.tenantStatus,
    tenantModules: user.tenantModules,
    tenantCode: user.tenantCode,
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      mustChangePassword: false,
      setSession: ({ token, user }) =>
        set({
          token,
          user: normalizeUserProfile(user),
          isAuthenticated: true,
          mustChangePassword: !!user?.mustChangePassword,
        }),
      login: ({ username }) =>
        set({
          token: 'mock-jwt-token',
          isAuthenticated: true,
          mustChangePassword: false,
          user: {
            id: '1',
            username,
            displayName: username === 'admin' ? '超级管理员' : username,
            roleId: '1',
            roleName: '超级管理员',
            orgId: '1',
            orgName: '野外守望者总部',
            permissions: ['all'],
            mustChangePassword: false,
          },
        }),
      logout: () => {
        localStorage.removeItem('wild-guardian-tenant-code')
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          mustChangePassword: false,
        })
      },
      clearMustChangePassword: () =>
        set((state) => ({
          mustChangePassword: false,
          user: state.user ? { ...state.user, mustChangePassword: false } : null,
        })),
    }),
    {
      name: 'wild-guardian-auth',
      version: 5,
      migrate: (persistedState) => {
        const state = persistedState as Partial<AuthState> | undefined
        const user = normalizeUserProfile(state?.user as Partial<UserProfile> | null | undefined)
        return {
          token: state?.token ?? null,
          user,
          isAuthenticated: Boolean(state?.token && user),
          mustChangePassword: state?.mustChangePassword ?? false,
        } as AuthState
      },
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage
        }

        const store = new Map<string, string>()
        return {
          getItem: (key: string) => store.get(key) ?? null,
          setItem: (key: string, value: string) => {
            store.set(key, value)
          },
          removeItem: (key: string) => {
            store.delete(key)
          },
        }
      }),
    },
  ),
)
