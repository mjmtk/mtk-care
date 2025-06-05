import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get the backend API URL from environment or use default
    const backendUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000/api'
    
    // Forward the request to the Django backend
    const response = await fetch(`${backendUrl}/v1/users/`, {
      headers: {
        'Content-Type': 'application/json',
        // Forward any authorization headers from the client request
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        }),
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch users from backend' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error proxying users request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}