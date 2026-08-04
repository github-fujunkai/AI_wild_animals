type PermissionUserLike = {
  username?: string
  roleName?: string
  permissions?: string[]
} | null | undefined

const ROLE_PERMISSION_MAP: Record<string, string[]> = {
  超级管理员: ['all'],
  普通监测员: ['home:view', 'home:gis', 'images:view', 'images:live', 'images:query', 'data:view', 'devices:view', 'species:view', 'species:animal', 'species:plant', 'ops:view', 'env:view', 'agent:view'],
  组织负责人: ['home:view', 'home:gis', 'images:view', 'images:live', 'images:query', 'data:view', 'devices:view', 'species:view', 'species:animal', 'species:plant', 'orgs:view', 'ops:view', 'env:view', 'agent:view'],
}

/**
 * Check if the user has the required permission.
 * Supports:
 * - "all" wildcard
 * - exact match
 * - parent-to-child inheritance: e.g. "images:view" grants "images:live", "images:query", etc.
 */
export function hasPermission(permissions: string[] | undefined, permission: string) {
  if (!permission) {
    return true
  }
  if (!permissions || permissions.length === 0) {
    return false
  }
  for (const perm of permissions) {
    if (perm === 'all' || perm === permission) {
      return true
    }
    // Parent-to-child: "images:view" grants "images:live", "images:query", etc.
    const colonIndex = permission.indexOf(':')
    if (colonIndex > 0) {
      const resource = permission.slice(0, colonIndex)
      const permColonIndex = perm.indexOf(':')
      if (permColonIndex > 0) {
        const permResource = perm.slice(0, permColonIndex)
        const permAction = perm.slice(permColonIndex + 1)
        if (permResource === resource && permAction === 'view') {
          return true
        }
      }
    }
  }
  return false
}

export function filterCheckedPermissions(permissions: string[]) {
  if (permissions.includes('all')) {
    return ['all']
  }
  return permissions.filter(Boolean)
}

export function resolvePermissions(user: PermissionUserLike) {
  const permissions = Array.isArray(user?.permissions) ? user.permissions.filter(Boolean) : []
  if (permissions.length > 0) {
    return permissions
  }
  if (user?.roleName && ROLE_PERMISSION_MAP[user.roleName]) {
    return ROLE_PERMISSION_MAP[user.roleName]
  }
  if (user?.username === 'admin') {
    return ['all']
  }
  return []
}