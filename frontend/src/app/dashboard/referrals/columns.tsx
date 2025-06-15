"use client"

import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import { Referral } from '@/types/referral'
import { CalendarIcon, UserIcon, BuildingIcon, AlertTriangleIcon, CheckCircleIcon, ClockIcon, MoreHorizontal, Eye, Edit, Trash2, AlertCircle, ShieldCheck, BookOpen } from 'lucide-react'
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

// Helper function to get priority badge variant and custom colors
const getPriorityStyle = (priority: string) => {
  const lowerPriority = priority.toLowerCase()
  if (lowerPriority.includes('high') || lowerPriority.includes('urgent')) {
    return {
      variant: 'outline' as const,
      className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700 hover:bg-red-150 dark:hover:bg-red-900/50'
    }
  }
  if (lowerPriority.includes('medium')) {
    return {
      variant: 'outline' as const, 
      className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700 hover:bg-yellow-150 dark:hover:bg-yellow-900/50'
    }
  }
  return {
    variant: 'outline' as const,
    className: ''
  }
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
        'sticky md:table-cell left-0 z-10 rounded-tl w-12',
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
      ),
    },
    cell: ({ row }) => {
      const referral = row.original;
      const priority = referral.priority?.label?.toLowerCase() || '';
      
      // Get lighter pastel priority color for checkbox highlight (always visible)
      let checkboxClass = 'translate-y-[2px]';
      if (priority.includes('high') || priority.includes('urgent')) {
        checkboxClass += ' bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 data-[state=checked]:bg-red-200 dark:data-[state=checked]:bg-red-800/50 data-[state=checked]:border-red-400 dark:data-[state=checked]:border-red-600';
      } else if (priority.includes('medium')) {
        checkboxClass += ' bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 data-[state=checked]:bg-yellow-200 dark:data-[state=checked]:bg-yellow-800/50 data-[state=checked]:border-yellow-400 dark:data-[state=checked]:border-yellow-600';
      } else {
        checkboxClass += ' bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 data-[state=checked]:bg-blue-200 dark:data-[state=checked]:bg-blue-800/50 data-[state=checked]:border-blue-400 dark:data-[state=checked]:border-blue-600';
      }
      
      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
          className={checkboxClass}
        />
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <div className='text-center'>
        <DataTableColumnHeader column={column} title='ID' />
      </div>
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
        'sticky left-12 md:table-cell w-20 z-10'
      ),
    },
    enableHiding: false,
    initiallyHidden: true,
  },
  {
    accessorKey: 'client',
    accessorFn: (row) => {
      if (row.client) {
        const displayName = row.client.preferred_name || `${row.client.first_name} ${row.client.last_name}`.trim();
        return displayName;
      }
      return row.client_type === 'new' ? 'New Client' : 
             row.client_type === 'self' ? 'Self-Referral' : 'Unknown';
    },
    header: ({ column }) => (
      <div className='flex justify-center'>
        <DataTableColumnHeader column={column} title='Client' className='ml-3' />
      </div>
    ),
    cell: ({ row }) => {
      const referral = row.original;
      if (referral.client) {
        const displayName = referral.client.preferred_name || 
                           `${referral.client.first_name} ${referral.client.last_name}`.trim();
        return (
          <div className='flex items-center justify-center'>
            <span className='max-w-36 truncate font-medium text-sm'>{displayName}</span>
          </div>
        );
      }
      
      // For referrals without linked clients
      const fallbackText = referral.client_type === 'new' ? 'New Client' : 
                           referral.client_type === 'self' ? 'Self-Referral' : 'Unknown';
      return (
        <div className='flex items-center justify-center'>
          <span className='max-w-36 truncate text-muted-foreground italic text-sm'>{fallbackText}</span>
        </div>
      );
    },
    meta: { className: 'w-40 min-w-40' },
    enableSorting: true,
  },
  {
    id: 'consent_status',
    header: ({ column }) => (
      <div className='text-center'>
        <DataTableColumnHeader column={column} title='Consent' />
      </div>
    ),
    cell: ({ row }) => {
      const referral = row.original;
      const hasConsent = referral.client_consent_date || 
                        (referral.consent_records && referral.consent_records.length > 0);
      
      if (hasConsent) {
        return (
          <div className='flex items-center justify-center'>
            <ShieldCheck size={14} className='text-green-600' />
          </div>
        );
      } else {
        return (
          <div className='flex items-center justify-center'>
            <AlertCircle size={14} className='text-amber-500' />
          </div>
        );
      }
    },
    meta: { className: 'w-20 min-w-20 text-center' },
    enableSorting: false,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'reason',
    header: ({ column }) => (
      <div className='text-center'>
        <DataTableColumnHeader column={column} title='Reason' />
      </div>
    ),
    cell: ({ row }) => (
      <div className='max-w-48 truncate font-medium'>{row.getValue('reason')}</div>
    ),
    meta: { className: 'w-48 min-w-48' },
    enableHiding: true,
    initiallyHidden: true, // Hide by default
  },
  {
    accessorKey: 'status',
    accessorFn: (row) => row.status.label,
    header: ({ column }) => (
      <div className='flex justify-center'>
        <DataTableColumnHeader column={column} title='Status' className='ml-3' />
      </div>
    ),
    cell: ({ row }) => {
      const status = row.original.status
      const variant = getStatusVariant(status.label)
      return (
        <div className='flex justify-center'>
          <Badge variant={variant} className='capitalize text-xs px-3 py-1 whitespace-nowrap'>
            {status.label}
          </Badge>
        </div>
      )
    },
    meta: { className: 'w-32 min-w-32 text-center' },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: true,
  },
  {
    accessorKey: 'priority',
    accessorFn: (row) => row.priority.label,
    header: ({ column }) => (
      <div className='flex justify-center'>
        <DataTableColumnHeader column={column} title='Priority' />
      </div>
    ),
    cell: ({ row }) => {
      const priority = row.original.priority
      const lowerPriority = priority.label.toLowerCase()
      
      // Get text color based on priority
      let textColorClass = 'text-foreground'
      if (lowerPriority.includes('high') || lowerPriority.includes('urgent')) {
        textColorClass = 'text-red-600 dark:text-red-400 font-semibold'
      } else if (lowerPriority.includes('medium')) {
        textColorClass = 'text-yellow-600 dark:text-yellow-400 font-semibold'
      } else {
        textColorClass = 'text-blue-600 dark:text-blue-400 font-medium'
      }
      
      return (
        <div className='flex justify-center'>
          <span className={`capitalize text-sm ${textColorClass}`}>
            {priority.label}
          </span>
        </div>
      )
    },
    meta: { className: 'w-28 min-w-28 text-center' },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: true,
  },
  {
    accessorKey: 'type',
    accessorFn: (row) => row.type === 'incoming' ? 'Incoming' : 'Outgoing',
    header: ({ column }) => (
      <div className='text-center'>
        <DataTableColumnHeader column={column} title='Type' />
      </div>
    ),
    cell: ({ row }) => {
      const type = row.original.type
      return (
        <div className='flex items-center gap-x-2'>
          <BuildingIcon size={14} className='text-muted-foreground' />
          <span className='text-sm'>{type === 'incoming' ? 'Incoming' : 'Outgoing'}</span>
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    initiallyHidden: true,
  },
  {
    accessorKey: 'client_type',
    header: ({ column }) => (
      <div className='text-center'>
        <DataTableColumnHeader column={column} title='Client Type' />
      </div>
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
    initiallyHidden: true,
  },
  {
    accessorKey: 'referral_source',
    header: ({ column }) => (
      <div className='text-center'>
        <DataTableColumnHeader column={column} title='Referring Agency' />
      </div>
    ),
    cell: ({ row }) => {
      const referralSource = row.getValue<string>('referral_source')
      const formatSource = (source: string) => {
        const sourceMap: Record<string, string> = {
          'external_agency': 'External Agency',
          'self_referral': 'Self Referral',
          'family_referral': 'Family Referral',
          'school': 'School',
          'healthcare': 'Healthcare Provider',
          'police': 'Police',
          'court': 'Court',
          'other': 'Other'
        };
        return sourceMap[source] || source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      };
      // Use BookOpen icon for school
      const IconComponent = referralSource === 'school' ? BookOpen : BuildingIcon;
      
      return (
        <div className='flex items-center justify-center gap-x-2'>
          <IconComponent size={14} className='text-muted-foreground flex-shrink-0' />
          <span className='text-sm truncate max-w-36'>{formatSource(referralSource)}</span>
        </div>
      )
    },
    meta: { className: 'w-36 min-w-36 text-center' },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
  },
  {
    id: 'referring_organization',
    header: ({ column }) => (
      <div className='text-center'>
        <DataTableColumnHeader column={column} title='Organization' />
      </div>
    ),
    cell: ({ row }) => {
      const referral = row.original;
      
      // Check program_data for external organization name
      const externalOrgName = referral.program_data?.external_organisation_name;
      
      // If we have an external organization name, show it
      if (externalOrgName && externalOrgName.trim()) {
        // Use BookOpen icon if this is a school
        const IconComponent = referral.referral_source === 'school' ? BookOpen : BuildingIcon;
        return (
          <div className='flex items-center justify-center gap-x-2'>
            <IconComponent size={14} className='text-muted-foreground flex-shrink-0' />
            <span className='text-sm truncate max-w-40'>{externalOrgName}</span>
          </div>
        );
      }
      
      // Otherwise show generic text based on referral source
      const sourceMap: Record<string, string> = {
        'external_agency': 'External Agency',
        'self_referral': 'Self Referral', 
        'family_referral': 'Family',
        'school': 'School',
        'healthcare': 'Healthcare',
        'police': 'Police',
        'court': 'Court',
        'other': 'Other'
      };
      
      const genericName = sourceMap[referral.referral_source] || 'Unknown';
      
      // Use BookOpen icon if this is a school
      const IconComponent = referral.referral_source === 'school' ? BookOpen : BuildingIcon;
      
      return (
        <div className='flex items-center justify-center gap-x-2'>
          <IconComponent size={14} className='text-muted-foreground opacity-50 flex-shrink-0' />
          <span className='text-sm text-muted-foreground italic truncate max-w-40'>{genericName}</span>
        </div>
      );
    },
    enableSorting: false,
    accessorFn: (row) => {
      // For sorting/filtering, use external org name if available, otherwise generic name
      const externalOrgName = row.program_data?.external_organisation_name;
      if (externalOrgName && externalOrgName.trim()) {
        return externalOrgName;
      }
      
      const sourceMap: Record<string, string> = {
        'external_agency': 'External Agency',
        'self_referral': 'Self Referral',
        'family_referral': 'Family', 
        'school': 'School',
        'healthcare': 'Healthcare',
        'police': 'Police',
        'court': 'Court',
        'other': 'Other'
      };
      
      return sourceMap[row.referral_source] || 'Unknown';
    },
    meta: { className: 'w-44 min-w-44 text-center' },
  },
  {
    accessorKey: 'referral_date',
    header: ({ column }) => (
      <div className='flex justify-center'>
        <DataTableColumnHeader column={column} title='Referral Date' />
      </div>
    ),
    cell: ({ row }) => {
      const date = row.getValue<string>('referral_date')
      return (
        <div className='flex items-center justify-center gap-x-2'>
          <CalendarIcon size={14} className='text-muted-foreground flex-shrink-0' />
          <span className='text-sm whitespace-nowrap'>{formatDate(date)}</span>
        </div>
      )
    },
    meta: { className: 'w-36 min-w-36 text-center' },
  },
  {
    accessorKey: 'service_type',
    accessorFn: (row) => row.service_type?.label || '',
    header: ({ column }) => (
      <div className='text-center'>
        <DataTableColumnHeader column={column} title='Service Type' />
      </div>
    ),
    cell: ({ row }) => {
      const serviceType = row.original.service_type
      return (
        <div className='max-w-32 truncate text-sm'>
          {serviceType?.label || <span className="text-muted-foreground italic">Not set</span>}
        </div>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableSorting: false,
    initiallyHidden: true,
  },
  {
    accessorKey: 'created_by',
    accessorFn: (row) => `${row.created_by.first_name} ${row.created_by.last_name}`.trim() || row.created_by.email,
    header: ({ column }) => (
      <div className='text-center'>
        <DataTableColumnHeader column={column} title='Created By' />
      </div>
    ),
    cell: ({ row }) => {
      const createdBy = row.original.created_by
      const displayName = `${createdBy.first_name} ${createdBy.last_name}`.trim() || createdBy.email
      return (
        <div className='max-w-32 truncate text-sm'>{displayName}</div>
      )
    },
    enableSorting: false,
    initiallyHidden: true,
  },
  {
    accessorKey: 'created_at',
    header: ({ column }) => (
      <div className='text-center'>
        <DataTableColumnHeader column={column} title='Created' />
      </div>
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
    initiallyHidden: true,
  },
  {
    id: 'actions',
    header: () => (
      <div className='text-center'>
        Actions
      </div>
    ),
    meta: { className: 'w-16 min-w-16 text-center' },
    cell: ({ row }) => {
      const referral = row.original
      
      return (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-7 w-7 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => window.location.href = `/dashboard/referrals/${referral.id}`}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => window.location.href = `/dashboard/referrals/${referral.id}/edit`}
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