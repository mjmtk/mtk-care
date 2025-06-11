"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ReferralsDataTable } from './data-table'
import { columns } from './columns'
import { Referral, ReferralListResponse, ReferralListParams } from '@/types/referral'
import { useAuthBypassSession, useAccessToken } from '@/hooks/useAuthBypass'
import { ReferralService } from '@/services/referral-service'
import { ErrorBoundary } from '@/components/error-boundary'

// Function to fetch referrals from the API
async function fetchReferrals(params?: ReferralListParams): Promise<ReferralListResponse> {
  try {
    const data = await ReferralService.getReferrals(params)
    return data
  } catch (error) {
    console.error('Error fetching referrals:', error)
    throw error
  }
}

type StatusFilter = 'all' | 'draft' | 'active' | 'completed';

function ReferralsPageContent() {
  const router = useRouter()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const { data: session, status } = useAuthBypassSession()
  const accessToken = useAccessToken()

  // Debug: Log auth state
  console.log('Referrals page auth state:', {
    status,
    hasSession: !!session,
    hasAccessToken: !!accessToken,
  });

  useEffect(() => {
    // Only load referrals if auth is ready
    if (status === 'loading') return // Wait for auth to complete
    if (!accessToken) {
      console.log('Waiting for access token...');
      return // Wait for access token
    }

    const loadReferrals = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Build filter parameters
        const params: ReferralListParams = { 
          page: currentPage, 
          limit: 20 
        };
        
        // Add status filter if not 'all'
        if (statusFilter === 'draft') {
          (params as any).status = 'draft';
        } else if (statusFilter === 'active') {
          (params as any).status = 'active';
        } else if (statusFilter === 'completed') {
          (params as any).status = 'completed';
        }
        
        const response = await fetchReferrals(params)
        setReferrals(response.items || [])
        setTotalCount(response.total || 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching referrals')
      } finally {
        setIsLoading(false)
      }
    }

    loadReferrals()
  }, [status, accessToken, currentPage, statusFilter])

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleRefresh = () => {
    if (status !== 'loading' && accessToken) {
      const loadReferrals = async () => {
        try {
          setIsLoading(true)
          setError(null)
          const response = await fetchReferrals({ page: currentPage, limit: 20 })
          setReferrals(response.items || [])
          setTotalCount(response.total || 0)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred while fetching referrals')
        } finally {
          setIsLoading(false)
        }
      }
      loadReferrals()
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Referrals</CardTitle>
            <CardDescription>Manage referrals and track their progress.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading referrals...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Referrals</CardTitle>
            <CardDescription>Manage referrals and track their progress.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
              <span className="font-medium">Error:</span> {error}
            </div>
            <Button onClick={handleRefresh} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between space-y-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Referrals</h2>
          <p className="text-muted-foreground">
            Manage referrals and track their progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button size="sm" onClick={() => router.push('/dashboard/referrals/new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Referral
          </Button>
        </div>
      </div>
      
      <Tabs value={statusFilter} onValueChange={(value) => {
        setStatusFilter(value as StatusFilter);
        setCurrentPage(1); // Reset to first page when filter changes
      }}>
        <TabsList className="grid w-full max-w-md grid-cols-4">
          <TabsTrigger value="all" className="text-xs">
            All
            {statusFilter === 'all' && <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">{totalCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="draft" className="text-xs">
            Drafts
            {statusFilter === 'draft' && <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">{totalCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="active" className="text-xs">
            Active
            {statusFilter === 'active' && <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">{totalCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">
            Completed
            {statusFilter === 'completed' && <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">{totalCount}</Badge>}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={statusFilter} className="mt-6">
          <div className="space-y-4">
            <ReferralsDataTable 
              data={referrals} 
              columns={columns}
              totalCount={totalCount}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default function ReferralsPage() {
  return (
    <ErrorBoundary level="page" showDetails={process.env.NODE_ENV === 'development'}>
      <ReferralsPageContent />
    </ErrorBoundary>
  );
}