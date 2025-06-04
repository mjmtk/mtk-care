// frontend/src/app/dashboard/loading.tsx

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-lg text-muted-foreground">Loading dashboard data...</p>
      {/* Example of a more sophisticated loader if you have one:
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div> 
      */}
    </div>
  );
}
