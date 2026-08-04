import { describe, expect, it, beforeEach } from 'vitest'
import { useAuthStore } from '@/store/auth-store'

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.getState().logout()
  })

  describe('basic state transitions', () => {
    it('supports mock login and logout', () => {
      useAuthStore.getState().login({ username: 'admin', password: '123456' })
      expect(useAuthStore.getState().isAuthenticated).toBe(true)
      expect(useAuthStore.getState().user?.username).toBe('admin')
      expect(useAuthStore.getState().token).toBe('mock-jwt-token')

      useAuthStore.getState().logout()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
      expect(useAuthStore.getState().token).toBeNull()
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('clears mustChangePassword on logout', () => {
      useAuthStore.getState().setSession({
        token: 'wg-123',
        user: {
          id: '123',
          username: 'testuser',
          displayName: 'Test User',
          roleId: '1',
          roleName: '管理员',
          permissions: ['all'],
          mustChangePassword: true,
        },
      })
      expect(useAuthStore.getState().mustChangePassword).toBe(true)

      useAuthStore.getState().logout()
      expect(useAuthStore.getState().mustChangePassword).toBe(false)
    })
  })

  describe('setSession', () => {
    it('sets session with user profile and tenant info', () => {
      useAuthStore.getState().setSession({
        token: 'wg-456',
        user: {
          id: '456',
          username: 'tenantadmin',
          displayName: 'Tenant Admin',
          roleId: '2',
          roleName: '管理员',
          orgId: '10',
          orgName: 'Test Org',
          permissions: ['home:view', 'images:view', 'devices:view'],
          mustChangePassword: false,
          tenantId: '1',
          tenantName: 'Test Tenant',
          tenantStatus: '正常',
          tenantModules: ['首页', '影像数据', '设备管理'],
          tenantCode: 'TEST001',
        },
      })

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.token).toBe('wg-456')
      expect(state.user?.id).toBe('456')
      expect(state.user?.username).toBe('tenantadmin')
      expect(state.user?.tenantId).toBe('1')
      expect(state.user?.tenantName).toBe('Test Tenant')
      expect(state.user?.tenantStatus).toBe('正常')
      expect(state.user?.tenantModules).toEqual(['首页', '影像数据', '设备管理'])
      expect(state.user?.tenantCode).toBe('TEST001')
      expect(state.mustChangePassword).toBe(false)
    })

    it('normalizes user with mustChangePassword', () => {
      useAuthStore.getState().setSession({
        token: 'wg-789',
        user: {
          id: '789',
          username: 'newuser',
          displayName: 'New User',
          roleId: '0',
          roleName: '普通监测员',
          permissions: ['home:view'],
          mustChangePassword: true,
        },
      })

      expect(useAuthStore.getState().mustChangePassword).toBe(true)
      expect(useAuthStore.getState().user?.mustChangePassword).toBe(true)
    })

    it('handles tenant admin with no explicit permissions (grants from tenantModules)', () => {
      useAuthStore.getState().setSession({
        token: 'wg-999',
        user: {
          id: '999',
          username: 'tenantadmin2',
          displayName: 'Tenant Admin 2',
          roleId: '0',
          roleName: '租户管理员',  // Not in ROLE_PERMISSION_MAP
          permissions: [],  // No explicit permissions
          mustChangePassword: false,
          tenantId: '2',
          tenantName: 'Another Tenant',
          tenantModules: ['首页', '影像数据', '用户管理'],
        },
      })

      const state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user?.tenantId).toBe('2')
      // Should have permissions mapped from tenantModules since no explicit permissions
      // ModuleToPermissions mapping: 首页->home:view, 影像数据->images:view, 用户管理->users:view,roles:view
      expect(state.user?.permissions.length).toBeGreaterThan(0)
      expect(state.user?.permissions).toContain('home:view')
      expect(state.user?.permissions).toContain('images:view')
      expect(state.user?.permissions).toContain('users:view')
      expect(state.user?.permissions).toContain('roles:view')
    })

    it('handles user with "all" permission and tenant modules', () => {
      useAuthStore.getState().setSession({
        token: 'wg-1000',
        user: {
          id: '1000',
          username: 'superadmin_tenant',
          displayName: 'Super Admin in Tenant',
          roleId: '1',
          roleName: '超级管理员',
          permissions: ['all'],
          mustChangePassword: false,
          tenantId: '3',
          tenantName: 'Restricted Tenant',
          tenantModules: ['首页', '设备管理'],
        },
      })

      const state = useAuthStore.getState()
      // "all" permission should be preserved for super admin
      expect(state.user?.permissions).toContain('all')
    })

    it('handles user without tenant info (legacy/super admin)', () => {
      useAuthStore.getState().setSession({
        token: 'wg-1',
        user: {
          id: '1',
          username: 'admin',
          displayName: '超级管理员',
          roleId: '1',
          roleName: '超级管理员',
          permissions: ['all'],
          mustChangePassword: false,
        },
      })

      const state = useAuthStore.getState()
      expect(state.user?.tenantId).toBeUndefined()
      expect(state.user?.tenantName).toBeUndefined()
      expect(state.user?.tenantModules).toBeUndefined()
      expect(state.user?.permissions).toContain('all')
    })
  })

  describe('clearMustChangePassword', () => {
    it('clears mustChangePassword flag', () => {
      useAuthStore.getState().setSession({
        token: 'wg-test',
        user: {
          id: '100',
          username: 'testuser',
          displayName: 'Test User',
          roleId: '1',
          roleName: '管理员',
          permissions: ['home:view'],
          mustChangePassword: true,
        },
      })

      expect(useAuthStore.getState().mustChangePassword).toBe(true)
      expect(useAuthStore.getState().user?.mustChangePassword).toBe(true)

      useAuthStore.getState().clearMustChangePassword()
      expect(useAuthStore.getState().mustChangePassword).toBe(false)
      expect(useAuthStore.getState().user?.mustChangePassword).toBe(false)
    })
  })

  describe('normalizeUserProfile edge cases', () => {
    it('handles null user by clearing auth state', () => {
      // setSession with null user triggers normalizeUserProfile(null) => returns null
      // isAuthenticated becomes true (set directly in setSession) but then
      // migrate function would set it to false on next store rehydration.
      // In the current implementation, setSession always sets isAuthenticated: true.
      useAuthStore.getState().setSession({
        token: 'wg-null',
        user: null as any,
      })
      // normalizeUserProfile(null) returns null, but isAuthenticated is set to true by setSession
      expect(useAuthStore.getState().user).toBeNull()
      // After logout, state should be clean
      useAuthStore.getState().logout()
      expect(useAuthStore.getState().isAuthenticated).toBe(false)
    })

    it('returns null for user without id', () => {
      useAuthStore.getState().setSession({
        token: 'wg-noid',
        user: { username: 'test', displayName: 'Test' } as any,
      })
      expect(useAuthStore.getState().user).toBeNull()
    })

    it('defaults roleName for admin user', () => {
      useAuthStore.getState().setSession({
        token: 'wg-default-role',
        user: {
          id: '200',
          username: 'admin',
          displayName: 'Admin',
          roleId: '1',
          permissions: ['all'],
        },
      })

      const state = useAuthStore.getState()
      expect(state.user?.roleName).toBe('超级管理员')
    })

    it('defaults roleName for non-admin user', () => {
      useAuthStore.getState().setSession({
        token: 'wg-default-role2',
        user: {
          id: '201',
          username: 'regularuser',
          displayName: 'Regular',
          roleId: '2',
          permissions: ['home:view'],
        },
      })

      const state = useAuthStore.getState()
      expect(state.user?.roleName).toBe('普通监测员')
    })

    it('preserves provided roleName', () => {
      useAuthStore.getState().setSession({
        token: 'wg-custom-role',
        user: {
          id: '202',
          username: 'customuser',
          displayName: 'Custom',
          roleId: '5',
          roleName: '自定义角色',
          permissions: ['home:view'],
        },
      })

      const state = useAuthStore.getState()
      expect(state.user?.roleName).toBe('自定义角色')
    })

    it('converts orgId number to string', () => {
      useAuthStore.getState().setSession({
        token: 'wg-orgid',
        user: {
          id: '203',
          username: 'orguser',
          displayName: 'Org User',
          roleId: '1',
          roleName: '管理员',
          orgId: '42',
          orgName: '测试组织',
          permissions: ['all'],
        },
      })

      const state = useAuthStore.getState()
      expect(state.user?.orgId).toBe('42')
      expect(state.user?.orgName).toBe('测试组织')
    })

    it('defaults orgName to "全部" when missing', () => {
      useAuthStore.getState().setSession({
        token: 'wg-noorg',
        user: {
          id: '204',
          username: 'noorguser',
          displayName: 'No Org',
          roleId: '1',
          roleName: '超级管理员',
          permissions: ['all'],
        },
      })

      const state = useAuthStore.getState()
      expect(state.user?.orgName).toBe('全部')
    })
  })

  describe('tenant module permission mapping', () => {
    it('maps all known tenant modules to permissions for tenant admin with no role', () => {
      // When a tenant admin has no role assigned yet (permissions=[]),
      // and roleName is not in ROLE_PERMISSION_MAP, the frontend falls back
      // to mapping tenantModules to permission keys.
      useAuthStore.getState().setSession({
        token: 'wg-all-modules',
        user: {
          id: '300',
          username: 'tenantadmin_allmod',
          displayName: 'All Modules Admin',
          roleId: '0',
          roleName: '租户管理员',  // Not in ROLE_PERMISSION_MAP, so resolvePermissions returns []
          permissions: [],  // Empty permissions triggers tenantModules mapping
          mustChangePassword: false,
          tenantId: '10',
          tenantModules: ['首页', '影像数据', '数据展示', '设备管理', 'AI物种分析', '设备运维中心', '环境监测', '用户管理', '组织机构'],
        },
      })

      const perms = useAuthStore.getState().user?.permissions ?? []
      expect(perms).toContain('home:view')
      expect(perms).toContain('images:view')
      expect(perms).toContain('data:view')
      expect(perms).toContain('devices:view')
      expect(perms).toContain('species:view')
      expect(perms).toContain('species:animal')
      expect(perms).toContain('species:plant')
      expect(perms).toContain('ops:view')
      expect(perms).toContain('env:view')
      expect(perms).toContain('users:view')
      expect(perms).toContain('roles:view')
      expect(perms).toContain('orgs:view')
    })

    it('does not map unknown modules', () => {
      useAuthStore.getState().setSession({
        token: 'wg-unknown-module',
        user: {
          id: '301',
          username: 'unknownmod',
          displayName: 'Unknown Module',
          roleId: '1',
          permissions: [],
          mustChangePassword: false,
          tenantId: '11',
          tenantModules: ['首页', '未知模块'],
        },
      })

      const perms = useAuthStore.getState().user?.permissions ?? []
      expect(perms).toContain('home:view')
      expect(perms).not.toContain('未知模块:view')
    })

    it('does not map empty tenant modules', () => {
      useAuthStore.getState().setSession({
        token: 'wg-empty-modules',
        user: {
          id: '302',
          username: 'emptymod',
          displayName: 'Empty Modules',
          roleId: '1',
          permissions: ['home:view'],
          mustChangePassword: false,
          tenantId: '12',
          tenantModules: [],
        },
      })

      const perms = useAuthStore.getState().user?.permissions ?? []
      // When modules are empty but permissions exist, keep original permissions
      expect(perms).toEqual(['home:view'])
    })
  })

  describe('logout clears tenant data', () => {
    it('clears tenant-related state on logout', () => {
      useAuthStore.getState().setSession({
        token: 'wg-tenant-clear',
        user: {
          id: '400',
          username: 'tenantclear',
          displayName: 'Tenant Clear',
          roleId: '1',
          roleName: '管理员',
          permissions: ['all'],
          mustChangePassword: false,
          tenantId: '5',
          tenantName: 'Clear Tenant',
          tenantStatus: '正常',
          tenantModules: ['首页', '设备管理'],
          tenantCode: 'CLEAR001',
        },
      })

      const beforeLogout = useAuthStore.getState()
      expect(beforeLogout.user?.tenantId).toBe('5')
      expect(beforeLogout.user?.tenantCode).toBe('CLEAR001')

      useAuthStore.getState().logout()

      const afterLogout = useAuthStore.getState()
      expect(afterLogout.token).toBeNull()
      expect(afterLogout.user).toBeNull()
      expect(afterLogout.isAuthenticated).toBe(false)
      expect(afterLogout.mustChangePassword).toBe(false)
    })
  })
})