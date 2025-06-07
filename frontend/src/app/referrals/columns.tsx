"use client"

import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { Referral } from '@/types/referral'
import { CalendarIcon, UserIcon, BuildingIcon, AlertTriangleIcon, CheckCircleIcon, ClockIcon, MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRouter } from 'next/navigation'

// Helper function to format dates
const formatDate = (dateString: string) => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy')
  } catch {
    return 'Invalid date'
  }
}

// Helper function to get status badge variant
const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  const lowerStatus = status.toLowerCase()
  if (lowerStatus.includes('completed')) return 'default'
  if (lowerStatus.includes('in progress') || lowerStatus.includes('active')) return 'secondary'
  if (lowerStatus.includes('cancelled') || lowerStatus.includes('rejected')) return 'destructive'
  return 'outline'
}

// Helper function to get priority badge variant
const getPriorityVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
  const lowerPriority = priority.toLowerCase()
  if (lowerPriority.includes('high') || lowerPriority.includes('urgent')) return 'destructive'
  if (lowerPriority.includes('medium')) return 'secondary'
  return 'outline'
}

// Helper function to get client type icon
const getClientTypeIcon = (clientType: string) => {
  switch (clientType) {
    case 'existing':
      return UserIcon
    case 'new':
      return UserIcon
    case 'self':
      return UserIcon
    default:
      return UserIcon
  }
}

export const columns: ColumnDef<Referral>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-[2px]'
      />
    ),
    meta: {
      className: cn(
        'sticky md:table-cell left-0 z-10 rounded-tl',
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
      ),
    },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-[2px]'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='ID' />
    ),
    cell: ({ row }) => (
      <div className='max-w-24 font-mono text-sm truncate'>
        {row.getValue<string>('id').slice(-8)}
      </div>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)] lg:drop-shadow-none',
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
        'sticky left-6 md:table-cell'
      ),
    },
    enableHiding: false,
  },
  {
    accessorKey: 'reason',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Reason' />
    ),
    cell: ({ row }) => (
      <div className='max-w-48 truncate font-medium'>{row.getValue('reason')}</div>
    ),
    meta: { className: 'w-48' },
  },
  {
    accessorKey: 'status',
    accessorFn: (row) => row.status.label,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = row.original.status
      const variant = getStatusVariant(status.label)
      return (
        <div className='flex space-x-2'>
          <Badge variant={variant} className='capitalize'>
            {status.label}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
  },
  {
    accessorKey: 'priority',
    accessorFn: (row) => row.priority.label,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Priority' />
    ),
    cell: ({ row }) => {
      const priority = row.original.priority
      const variant = getPriorityVariant(priority.label)
      return (
        <div className='flex items-center gap-x-2'>
          <AlertTriangleIcon size={14} className='text-muted-foreground' />
          <Badge variant={variant} className='capitalize'>
            {priority.label}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
  },
  {
    accessorKey: 'type',
    accessorFn: (row) => row.type.label,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ row }) => {
      const type = row.original.type
      return (
        <div className='flex items-center gap-x-2'>
          <BuildingIcon size={14} className='text-muted-foreground' />
          <span className='text-sm'>{type.label}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
  },
  {
    accessorKey: 'client_type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Client Type' />
    ),
    cell: ({ row }) => {
      const clientType = row.getValue<string>('client_type')
      const IconComponent = getClientTypeIcon(clientType)
      return (
        <div className='flex items-center gap-x-2'>
          <IconComponent size={14} className='text-muted-foreground' />
          <span className='text-sm capitalize'>{clientType}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
  },
  {
    accessorKey: 'referral_date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Referral Date' />
    ),
    cell: ({ row }) => {
      const date = row.getValue<string>('referral_date')
      return (
        <div className='flex items-center gap-x-2'>
          <CalendarIcon size={14} className='text-muted-foreground' />
          <span className='text-sm'>{formatDate(date)}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'service_type',
    accessorFn: (row) => row.service_type.label,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Service Type' />
    ),
    cell: ({ row }) => {
      const serviceType = row.original.service_type
      return (
        <div className='max-w-32 truncate text-sm'>{serviceType.label}</div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
  },
  {
    accessorKey: 'created_by',
    accessorFn: (row) => `${row.created_by.first_name} ${row.created_by.last_name}`.trim() || row.created_by.email,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created By' />
    ),
    cell: ({ row }) => {
      const createdBy = row.original.created_by
      const displayName = `${createdBy.first_name} ${createdBy.last_name}`.trim() || createdBy.email
      return (
        <div className='max-w-32 truncate text-sm'>{displayName}</div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Created' />
    ),
    cell: ({ row }) => {
      const date = row.getValue<string>('created_at')
      return (
        <div className='flex items-center gap-x-2'>
          <ClockIcon size={14} className='text-muted-foreground' />
          <span className='text-sm'>{formatDate(date)}</span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const referral = row.original
      
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => window.location.href = `/referrals/${referral.id}`}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.location.href = `/referrals/${referral.id}/edit`}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => {
                  if (confirm('Are you sure you want to delete this referral?')) {
                    // TODO: Implement delete functionality
                    console.log('Delete referral:', referral.id);
                  }
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]