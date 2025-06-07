import React from 'react';
import { Heart } from 'lucide-react';

interface CarePlansSectionProps {
  clientId: string;
  episodeId?: string;
}

export function CarePlansSection({ clientId, episodeId }: CarePlansSectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Heart className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-medium">Care Plans</h3>
      </div>
      
      <div className="text-center py-8 text-gray-500">
        <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Care Plans section coming soon</p>
        <p className="text-sm">Client ID: {clientId}</p>
        {episodeId && <p className="text-sm">Episode ID: {episodeId}</p>}
      </div>
    </div>
  );
}