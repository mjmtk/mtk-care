import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimelineSection } from './TimelineSection';
import { DocumentsSection } from './DocumentsSection';
import { CarePlansSection } from './CarePlansSection';

interface ClientTabsSectionProps {
  clientId: string;
  canEditClient?: boolean;
  activeEpisodeId?: string;
}

export function ClientTabsSection({
  clientId,
  canEditClient = true,
  activeEpisodeId
}: ClientTabsSectionProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Tabs defaultValue="timeline" className="w-full">
          <div className="border-b px-4">
            <TabsList className="grid w-full grid-cols-3 bg-transparent h-auto p-0">
              <TabsTrigger 
                value="timeline" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3"
              >
                Timeline
              </TabsTrigger>
              <TabsTrigger 
                value="carePlans"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3"
              >
                Care Plans
              </TabsTrigger>
              <TabsTrigger 
                value="documents"
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none py-3"
              >
                Documents
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-4">
            <TabsContent value="timeline" className="mt-0">
              <TimelineSection 
                clientId={clientId} 
                canEditClient={canEditClient} 
              />
            </TabsContent>

            <TabsContent value="carePlans" className="mt-0">
              <CarePlansSection 
                clientId={clientId} 
                episodeId={activeEpisodeId} 
              />
            </TabsContent>

            <TabsContent value="documents" className="mt-0">
              <DocumentsSection 
                clientId={clientId} 
                episodeId={activeEpisodeId} 
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}