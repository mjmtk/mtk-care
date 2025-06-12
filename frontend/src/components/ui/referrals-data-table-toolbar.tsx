import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { DataTableViewOptions } from './data-table-view-options'
import { AlertTriangleIcon, CheckCircleIcon, ClockIcon, BuildingIcon } from 'lucide-react'

interface ReferralsDataTableToolbarProps<TData> {
  table: Table<TData>
}

const statusOptions = [
  { label: 'Draft', value: 'Draft', icon: ClockIcon },
  { label: 'New', value: 'New', icon: ClockIcon },
  { label: 'Active', value: 'Active', icon: ClockIcon },
  { label: 'In Progress', value: 'In Progress', icon: ClockIcon },
  { label: 'Pending', value: 'Pending', icon: ClockIcon },
  { label: 'Completed', value: 'Completed', icon: CheckCircleIcon },
  { label: 'Cancelled', value: 'Cancelled', icon: Cross2Icon },
  { label: 'Declined', value: 'Declined', icon: Cross2Icon },
]

const priorityOptions = [
  { label: 'High', value: 'High', icon: AlertTriangleIcon },
  { label: 'Medium', value: 'Medium', icon: AlertTriangleIcon },
  { label: 'Low', value: 'Low', icon: AlertTriangleIcon },
  { label: 'Routine', value: 'Routine', icon: AlertTriangleIcon },
]

const referralSourceOptions = [
  { label: 'External Agency', value: 'external_agency', icon: BuildingIcon },
  { label: 'Self Referral', value: 'self_referral', icon: BuildingIcon },
  { label: 'Family Referral', value: 'family_referral', icon: BuildingIcon },
  { label: 'School', value: 'school', icon: BuildingIcon },
  { label: 'Healthcare Provider', value: 'healthcare', icon: BuildingIcon },
  { label: 'Police', value: 'police', icon: BuildingIcon },
  { label: 'Court', value: 'court', icon: BuildingIcon },
  { label: 'Other', value: 'other', icon: BuildingIcon },
]

export function ReferralsDataTableToolbar<TData>({
  table,
}: ReferralsDataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className='flex items-center justify-between'>
      <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
        <Input
          placeholder='Filter by client name...'
          value={
            (table.getColumn('client')?.getFilterValue() as string) ?? ''
          }
          onChange={(event) =>
            table.getColumn('client')?.setFilterValue(event.target.value)
          }
          className='h-10 w-[180px] lg:w-[300px] text-base'
        />
        <div className='flex gap-x-2'>
          {table.getColumn('status') && (
            <DataTableFacetedFilter
              column={table.getColumn('status')}
              title='Status'
              options={statusOptions}
            />
          )}
          {table.getColumn('priority') && (
            <DataTableFacetedFilter
              column={table.getColumn('priority')}
              title='Priority'
              options={priorityOptions}
            />
          )}
          {table.getColumn('referral_source') && (
            <DataTableFacetedFilter
              column={table.getColumn('referral_source')}
              title='Source'
              options={referralSourceOptions}
            />
          )}
        </div>
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => table.resetColumnFilters()}
            className='h-10 px-3 lg:px-4 text-base'
          >
            Reset
            <Cross2Icon className='ml-2 h-5 w-5' />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
    </div>
  )
}