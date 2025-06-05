"use client"

import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { User, getUserDisplayName, getUserStatus, getPrimaryRole } from '@/types/users'
import { ShieldIcon, UserIcon, CrownIcon, UserCogIcon } from 'lucide-react'

// Icon mapping for roles
const roleIcons = {
  'Admin': ShieldIcon,
  'User': UserIcon,
  'User (Azure)': UserCogIcon,
  'Superuser': CrownIcon,
  'Manager': UserCogIcon,
}

export const columns: ColumnDef<User>[] = [
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
    accessorKey: 'username',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Username' />
    ),
    cell: ({ row }) => (
      <div className='max-w-36 font-medium truncate'>{row.getValue('username')}</div>
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
    id: 'fullName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Name' />
    ),
    cell: ({ row }) => {
      const user = row.original
      const fullName = getUserDisplayName(user)
      return <div className='max-w-36 truncate'>{fullName}</div>
    },
    meta: { className: 'w-36' },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Email' />
    ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>{row.getValue('email')}</div>
    ),
  },
  {
    accessorKey: 'phoneNumber',
    accessorFn: (row) => row.profile?.phone_number || '',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Phone Number' />
    ),
    cell: ({ row }) => {
      const phoneNumber = row.original.profile?.phone_number
      return <div>{phoneNumber || '-'}</div>
    },
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    accessorFn: (row) => getUserStatus(row),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Status' />
    ),
    cell: ({ row }) => {
      const status = getUserStatus(row.original)
      const badgeVariant = status === 'active' ? 'default' : 'secondary'
      return (
        <div className='flex space-x-2'>
          <Badge variant={badgeVariant} className='capitalize'>
            {status}
          </Badge>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableHiding: false,
    enableSorting: false,
  },
  {
    accessorKey: 'role',
    accessorFn: (row) => getPrimaryRole(row),
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Role' />
    ),
    cell: ({ row }) => {
      const role = getPrimaryRole(row.original)
      const IconComponent = roleIcons[role as keyof typeof roleIcons] || UserIcon

      return (
        <div className='flex items-center gap-x-2'>
          <IconComponent size={16} className='text-muted-foreground' />
          <span className='text-sm'>{role}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    enableHiding: false,
  },
]