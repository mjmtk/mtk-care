import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, AlertTriangle, Shield, TrendingUp, GitBranch, Heart, Globe, Star } from 'lucide-react';
import { Client } from '@/types/client';
import { cn } from '@/lib/utils';

interface ClientHeaderProps {
  client: Client;
  onGenealogyClick?: () => void;
  onOutcomeMeasuresClick?: () => void;
  canEditClient?: boolean;
  hasRiskIndicators?: boolean;
}

export function ClientHeader({ 
  client, 
  onGenealogyClick, 
  onOutcomeMeasuresClick,
  canEditClient = false,
  hasRiskIndicators = false
}: ClientHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <Card>
      <CardContent className="p-2">
        <div 
          className="cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {/* Essential Info - Always Visible */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {client.firstName || 'Unknown'} {client.lastName || 'Client'}
                    {client.preferredName && (
                      <span className="text-gray-500 ml-2 dark:text-gray-300">({client.preferredName})</span>
                    )}
                  </h1>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span>NHI: {client.nhiFacilityCode}</span>
                  <span>•</span>
                  <span>DOB: {formatDate(client.dateOfBirth)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {client.riskLevel === 'high' && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    High Risk
                  </Badge>
                )}
                
                {client.consentRequired && (
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-100">
                    <Shield className="h-3 w-3 mr-1" />
                    Consent Required
                  </Badge>
                )}
                
                {client.incompleteDocumentation && (
                  <div className="text-sm text-blue-600 font-medium">
                    Incomplete documentation warning
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                {/* Genealogy Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGenealogyClick?.();
                  }}
                  className="flex items-center gap-2"
                >
                  <GitBranch className="h-4 w-4" />
                  <span>Genealogy</span>
                </Button>

                {/* Outcome Measures Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOutcomeMeasuresClick?.();
                  }}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  <span>Outcome Measures</span>
                  {hasRiskIndicators && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </Button>
              </div>

              <ChevronDown
                className={cn(
                  "h-5 w-5 transform transition-transform duration-200 text-gray-400 dark:text-gray-300",
                  isExpanded && "rotate-180"
                )}
              />
            </div>
          </div>

          {/* Expandable Section */}
          <div className={cn(
            "transition-all duration-300 ease-in-out overflow-hidden",
            isExpanded ? "max-h-[500px] opacity-100 mt-4 pt-4 border-t" : "max-h-0 opacity-0"
          )}>
            <div className="space-y-4">
              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-gray-600 dark:text-gray-300">
                {client.phone && (
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Phone:</span>{' '}
                    {client.phone}
                  </div>
                )}
                
                {client.email && (
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">Email:</span>{' '}
                    {client.email}
                  </div>
                )}
                
                {client.address && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-900 dark:text-white">Address:</span>{' '}
                    {client.address}
                  </div>
                )}
              </div>

              {/* Cultural Identity Section */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Cultural Identity
                </h4>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-gray-600 dark:text-gray-300">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      Primary Language:
                    </span>{' '}
                    {client.primaryLanguage || 'Not specified'}
                    {client.interpreterNeeded && (
                      <span className="text-amber-600 dark:text-amber-400 ml-2">(Interpreter Needed)</span>
                    )}
                  </div>
                  
                  {(client.culturalIdentity?.iwiHapu || client.iwi_hapu) && (
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Iwi/Hapū:</span>{' '}
                      {client.culturalIdentity?.iwiHapu || client.iwi_hapu}
                    </div>
                  )}
                  
                  {(client.culturalIdentity?.spiritualNeeds || client.spiritual_needs) && (
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        Spiritual Needs:
                      </span>{' '}
                      {client.culturalIdentity?.spiritualNeeds || client.spiritual_needs}
                    </div>
                  )}
                  
                  {client.culturalIdentity?.primaryIdentity && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-900 dark:text-white">Cultural Identity:</span>{' '}
                      {client.culturalIdentity.primaryIdentity}
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contacts Preview */}
              {client.emergencyContacts && client.emergencyContacts.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    Emergency Contacts
                  </h4>
                  <div className="space-y-2">
                    {client.emergencyContacts.slice(0, 2).map((contact, index) => (
                      <div key={index} className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {contact.first_name} {contact.last_name}
                        </span>
                        {contact.relationship && (
                          <span className="text-gray-500 ml-2">({contact.relationship})</span>
                        )}
                        {contact.is_primary && (
                          <Badge variant="secondary" className="ml-2 text-xs">Primary</Badge>
                        )}
                        {contact.phone && (
                          <span className="block text-gray-500">{contact.phone}</span>
                        )}
                      </div>
                    ))}
                    {client.emergencyContacts.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{client.emergencyContacts.length - 2} more contact{client.emergencyContacts.length > 3 ? 's' : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}