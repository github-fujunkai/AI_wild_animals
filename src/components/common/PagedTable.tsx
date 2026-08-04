import { Table } from 'antd'
import type { TableProps } from 'antd'

type PagedTableProps<T extends object> = Omit<TableProps<T>, 'pagination'> & {
  current: number
  pageSize: number
  total: number
  onPageChange: (page: number, pageSize: number) => void
  showSizeChanger?: boolean
}

export function PagedTable<T extends object>({
  current,
  pageSize,
  total,
  onPageChange,
  showSizeChanger = true,
  ...tableProps
}: PagedTableProps<T>) {
  return (
    <Table
      {...tableProps}
      pagination={{
        current,
        pageSize,
        total,
        showSizeChanger,
        showTotal: (value) => `共 ${value} 条`,
        onChange: (page, nextPageSize) => {
          onPageChange(page, nextPageSize ?? pageSize)
        },
      }}
    />
  )
}
