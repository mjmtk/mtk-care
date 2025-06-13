"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ReferralsDataTable } from './data-table'
import { columns } from './columns'
import { Referral, ReferralListResponse, ReferralListParams } from '@/types/referral'
import { useAuthBypassSession, useAccessToken } from '@/hooks/useAuthBypass'
import { usePageContext } from '@/contexts/PageContext'
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

function ReferralsPageContent() {
  const router = useRouter()
  const { setPageInfo, clearPageInfo } = usePageContext()
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [isLoading, setIsLoading] = useState(true)
  const [isPaginating, setIsPaginating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { data: session, status } = useAuthBypassSession()
  const accessToken = useAccessToken()

  // Debug: Log auth state
  // console.log('Referrals page auth state:', {
  //   status,
  //   hasSession: !!session,
  //   hasAccessToken: !!accessToken,
  // });

  // Set page title in top bar
  useEffect(() => {
    setPageInfo({
      title: 'Referrals',
      subtitle: 'Manage referrals and track their progress'
    });

    return () => clearPageInfo();
  }, [setPageInfo, clearPageInfo]);

  // Separate effect for initial load and status filter changes
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

        // Reset to first page when filter changes
        const pageToLoad = 1;
        setCurrentPage(1);

        // Build filter parameters
        const params: ReferralListParams = {
          page: pageToLoad,
          limit: pageSize
        };

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
  }, [status, accessToken]) // Removed statusFilter and pageSize from dependencies

  const handlePageChange = (page: number) => {
    setCurrentPage(page)

    if (status !== 'loading' && accessToken) {
      const loadReferrals = async () => {
        try {
          setIsPaginating(true)
          setError(null)

          // Build filter parameters
          const params: ReferralListParams = { page, limit: pageSize };

          const response = await fetchReferrals(params)
          setReferrals(response.items || [])
          setTotalCount(response.total || 0)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred while fetching referrals')
        } finally {
          setIsPaginating(false)
        }
      }
      loadReferrals()
    }
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // Reset to first page when page size changes

    // Immediately trigger API call for page size change
    if (status !== 'loading' && accessToken) {
      const loadReferrals = async () => {
        try {
          setIsPaginating(true)
          setError(null)

          // Build filter parameters with new page size
          const params: ReferralListParams = { page: 1, limit: newPageSize };

          const response = await fetchReferrals(params)
          setReferrals(response.items || [])
          setTotalCount(response.total || 0)
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An error occurred while fetching referrals')
        } finally {
          setIsPaginating(false)
        }
      }
      loadReferrals()
    }
  }

  const handleRefresh = () => {
    if (status !== 'loading' && accessToken) {
      const loadReferrals = async () => {
        try {
          setIsLoading(true)
          setError(null)
          const response = await fetchReferrals({ page: currentPage, limit: pageSize })
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
      <div className="space-y-6">
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
      <div className="space-y-6">
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
    <div className="space-y-6">
      <div className="relative">
        {/* Pagination loading overlay */}
        {isPaginating && (
          <div className="absolute inset-0 bg-background/50 z-10 flex items-center justify-center">
            <div className="flex items-center space-x-2 bg-background border rounded-lg px-4 py-2 shadow-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          </div>
        )}
        <ReferralsDataTable
          data={referrals}
          columns={columns}
          totalCount={totalCount}
          currentPage={currentPage}
          pageSize={pageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>
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
