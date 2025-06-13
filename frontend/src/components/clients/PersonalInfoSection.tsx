'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Heart,
  Star,
  Shield,
  Users,
  AlertCircle,
  Edit,
  Plus
} from 'lucide-react';
import { unifiedClientService } from '@/services/unified-client-service';
import { Client } from '@/types/client';

interface PersonalInfoSectionProps {
  clientId: string;
  canEditClient?: boolean;
}

export function PersonalInfoSection({ clientId, canEditClient = false }: PersonalInfoSectionProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClient();
  }, [clientId]);

  const loadClient = async () => {
    try {
      setLoading(true);
      setError(null);
      const clientData = await unifiedClientService.getClient(clientId);
      setClient(clientData);
    } catch (err) {
      console.error('Error loading client:', err);
      setError('Failed to load client information');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error}. Please try refreshing the page.
        </AlertDescription>
      </Alert>
    );
  }

  if (!client) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Client information not found.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Basic Information
          </CardTitle>
          {canEditClient && (
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Full Name</label>
              <p className="text-lg font-semibold">
                {client.firstName} {client.lastName}
                {client.preferredName && (
                  <span className="text-gray-500 ml-2">({client.preferredName})</span>
                )}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Date of Birth</label>
              <p className="text-lg">
                {formatDate(client.dateOfBirth)}
                <span className="text-gray-500 ml-2">
                  ({calculateAge(client.dateOfBirth)} years old)
                </span>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Risk Level</label>
              <div className="mt-1">
                <Badge
                  variant={
                    client.riskLevel === 'high' ? 'destructive' :
                      client.riskLevel === 'medium' ? 'default' : 'secondary'
                  }
                >
                  {client.riskLevel} Risk
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="text-lg">{client.status || 'Active'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Contact Information
          </CardTitle>
          {canEditClient && (
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {client.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p>{client.phone}</p>
                </div>
              </div>
            )}

            {client.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p>{client.email}</p>
                </div>
              </div>
            )}

            {client.address && (
              <div className="flex items-start gap-3 md:col-span-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p>{client.address}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cultural Identity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Cultural Identity
          </CardTitle>
          {canEditClient && (
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-blue-500" />
              <div>
                <label className="text-sm font-medium text-gray-500">Primary Language</label>
                <p>{client.primaryLanguage || 'Not specified'}</p>
                {client.interpreterNeeded && (
                  <Badge variant="secondary" className="mt-1">
                    Interpreter Needed
                  </Badge>
                )}
              </div>
            </div>

            {(client.culturalIdentity?.iwiHapu || client.iwi_hapu) && (
              <div>
                <label className="text-sm font-medium text-gray-500">Iwi/Hapū Affiliation</label>
                <p>{client.culturalIdentity?.iwiHapu || client.iwi_hapu}</p>
              </div>
            )}

            {(client.culturalIdentity?.spiritualNeeds || client.spiritual_needs) && (
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4 text-yellow-500" />
                <div>
                  <label className="text-sm font-medium text-gray-500">Spiritual Needs</label>
                  <p>{client.culturalIdentity?.spiritualNeeds || client.spiritual_needs}</p>
                </div>
              </div>
            )}

            {client.culturalIdentity?.primaryIdentity && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Cultural Identity</label>
                <p>{client.culturalIdentity.primaryIdentity}</p>
              </div>
            )}
          </div>

          {!client.culturalIdentity && !client.iwi_hapu && !client.spiritual_needs && (
            <div className="text-center py-8 text-gray-500">
              <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No cultural identity information recorded</p>
              {canEditClient && (
                <Button variant="outline" className="mt-3">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Cultural Information
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Emergency Contacts
          </CardTitle>
          {canEditClient && (
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {client.emergencyContacts && client.emergencyContacts.length > 0 ? (
            <div className="space-y-4">
              {client.emergencyContacts.map((contact, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-gray-400 mt-1" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {contact.first_name} {contact.last_name}
                          </h4>
                          {contact.is_primary && (
                            <Badge variant="default">Primary</Badge>
                          )}
                          {contact.relationship && (
                            <Badge variant="secondary">
                              {contact.relationship}
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1 mt-2 text-sm text-gray-600">
                          {contact.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              {contact.phone}
                            </div>
                          )}
                          {contact.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3" />
                              {contact.email}
                            </div>
                          )}
                          {contact.priority_order && (
                            <div className="text-xs text-gray-500">
                              Priority: {contact.priority_order}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {canEditClient && (
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No emergency contacts recorded</p>
              {canEditClient && (
                <Button variant="outline" className="mt-3">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Emergency Contact
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Additional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-500">Consent Required</label>
              <div className="mt-1">
                <Badge variant={client.consentRequired ? "secondary" : "outline"}>
                  {client.consentRequired ? "Yes" : "No"}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-500">Documentation Status</label>
              <div className="mt-1">
                <Badge variant={client.incompleteDocumentation ? "destructive" : "secondary"}>
                  {client.incompleteDocumentation ? "Incomplete" : "Complete"}
                </Badge>
              </div>
            </div>
          </div>

          {client.notes && (
            <div>
              <label className="text-sm font-medium text-gray-500">Notes</label>
              <p className="mt-1 text-gray-600">{client.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
