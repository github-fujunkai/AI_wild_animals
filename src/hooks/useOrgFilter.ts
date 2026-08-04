import { useMemo } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { resolvePermissions } from '@/utils/permission'
import type { OrgTreeNode } from '@/types/models'

type OrgOption = {
  label: string
  value: string
}

/**
 * 根据当前用户的组织权限，过滤组织树。
 * - 超级管理员（permissions 包含 'all'）或无 orgId：可看到全部组织
 * - 非超管用户：只能看到自己所属组织及其子组织
 *
 * 返回：
 * - filteredTree: 过滤后的组织树
 * - orgOptions: 带有"全部组织"选项的扁平下拉选项
 * - orgOnlyOptions: 不含"全部组织"的扁平下拉选项
 * - visibleOrgIds: 当前用户可见的所有组织 ID 集合
 * - isSuperAdmin: 是否为超级管理员
 * - userOrgId: 当前用户的组织 ID
 */
export function useOrgFilter(orgTree: OrgTreeNode[]) {
  const user = useAuthStore((state) => state.user)
  const permissions = user ? resolvePermissions(user) : []
  const isSuperAdmin = permissions.includes('all')
  const userOrgId = user?.orgId ?? null

  const { filteredTree, visibleOrgIds } = useMemo(() => {
    if (isSuperAdmin || !userOrgId) {
      // 超管或无 orgId：可看到全部
      const allIds = collectAllIds(orgTree)
      return { filteredTree: orgTree, visibleOrgIds: allIds }
    }

    // 非超管：找到用户所在组织节点，截断树
    const filtered = filterTreeByOrgId(orgTree, userOrgId)
    const allIds = collectAllIds(filtered)
    return { filteredTree: filtered, visibleOrgIds: allIds }
  }, [orgTree, isSuperAdmin, userOrgId])

  const orgOptions = useMemo(() => {
    const result: OrgOption[] = [{ label: '全部组织', value: '' }]
    walkOptions(filteredTree, [], result)
    return result
  }, [filteredTree])

  const orgOnlyOptions = useMemo(() => {
    const result: OrgOption[] = []
    walkOptions(filteredTree, [], result)
    return result
  }, [filteredTree])

  return {
    filteredTree,
    orgOptions,
    orgOnlyOptions,
    visibleOrgIds,
    isSuperAdmin,
    userOrgId,
  }
}

/**
 * 从组织树中递归收集所有节点 ID
 */
function collectAllIds(nodes: OrgTreeNode[]): Set<string> {
  const ids = new Set<string>()
  const walk = (list: OrgTreeNode[]) => {
    for (const node of list) {
      if (node.key) ids.add(node.key)
      if (node.children?.length) walk(node.children)
    }
  }
  walk(nodes)
  return ids
}

/**
 * 过滤组织树，只保留目标组织及其子组织。
 * 如果目标组织是某节点的后代，则保留该祖先链路。
 */
function filterTreeByOrgId(nodes: OrgTreeNode[], targetOrgId: string): OrgTreeNode[] {
  const result: OrgTreeNode[] = []

  for (const node of nodes) {
    if (node.key === targetOrgId) {
      // 找到目标节点，保留它及其所有子节点
      result.push(node)
    } else if (node.children?.length) {
      const filteredChildren = filterTreeByOrgId(node.children, targetOrgId)
      if (filteredChildren.length > 0) {
        // 子树中有匹配项，保留此节点（带过滤后的子节点）
        result.push({ ...node, children: filteredChildren })
      }
    }
  }

  return result
}

/**
 * 将组织树扁平化为下拉选项
 */
function walkOptions(nodes: OrgTreeNode[], parents: string[], result: OrgOption[]) {
  for (const node of nodes) {
    const nextParents = [...parents, node.title]
    if (node.key) {
      result.push({ label: nextParents.join(' / '), value: node.key })
    }
    if (node.children?.length) {
      walkOptions(node.children, nextParents, result)
    }
  }
}