"use client"

import { useState } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  RowData,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Referral } from '@/types/referral'
import { DataTablePagination } from '@/components/ui/data-table-pagination'
import { ReferralsDataTableToolbar } from '@/components/ui/referrals-data-table-toolbar'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    className?: string
  }
}

interface ReferralsDataTableProps {
  columns: ColumnDef<Referral>[]
  data: Referral[]
  totalCount?: number
  currentPage?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
}

export function ReferralsDataTable({ 
  columns, 
  data, 
  totalCount, 
  currentPage = 1, 
  pageSize = 10,
  onPageChange,
  onPageSizeChange 
}: ReferralsDataTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  // Initialize column visibility with hidden columns set to false
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    id: false,
    reason: false,
    type: false,
    client_type: false,
    service_type: false,
    created_by: false,
    created_at: false,
  })
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination: {
        pageIndex: currentPage - 1, // Convert to 0-based index
        pageSize: pageSize,
      },
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({
          pageIndex: currentPage - 1,
          pageSize: pageSize,
        });
        
        // Handle page size changes
        if (newState.pageSize !== pageSize) {
          onPageSizeChange?.(newState.pageSize);
        }
        
        // Handle page changes (convert back to 1-based index for our API)
        if (newState.pageIndex !== currentPage - 1) {
          onPageChange?.(newState.pageIndex + 1);
        }
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    // Use server-side pagination data if provided
    manualPagination: !!totalCount,
    pageCount: totalCount ? Math.ceil(totalCount / pageSize) : undefined,
  })

  return (
    <div className='space-y-4'>
      <ReferralsDataTableToolbar table={table} />
      <div className='rounded-md border overflow-hidden'>
        <div className='overflow-x-auto'>
          <Table className="w-full min-w-[1200px]">
            <TableHeader className="bg-gray-50 border-b-2 border-gray-200">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={`${header.column.columnDef.meta?.className ?? ''} font-semibold text-gray-700 px-4 py-3`}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows && table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className={`group/row ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={`${cell.column.columnDef.meta?.className ?? ''} px-4 py-4`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No referrals found.
                </TableCell>
              </TableRow>
            )}
            </TableBody>
          </Table>
        </div>
      </div>
      <DataTablePagination 
        table={table} 
      />
    </div>
  )
}