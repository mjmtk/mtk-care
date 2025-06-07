'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, UserCheck, UserPlus, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NewClientService } from '@/services/new-client-service';
import type { components } from '@/types/openapi';

type ClientListSchema = components['schemas']['ClientListSchema'];

interface ClientSearchDialogProps {
  trigger?: React.ReactNode;
  onClientSelect?: (client: ClientListSchema) => void;
  onCreateNew?: (searchTerm: string, isReferral?: boolean) => void;
  isReferral?: boolean; // Whether this is for a referral flow
}

export function ClientSearchDialog({ 
  trigger, 
  onClientSelect, 
  onCreateNew,
  isReferral = false 
}: ClientSearchDialogProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<ClientListSchema[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (term: string) => {
      if (term.length >= 2) {
        setIsSearching(true);
        try {
          const response = await NewClientService.searchClients({ 
            search: term, 
            limit: 10 
          });
          setSearchResults(response.items || []);
          setHasSearched(true);
        } catch (error) {
          console.error('Search failed:', error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setHasSearched(false);
      }
    }, 300),
    []
  );

  // Get search suggestions for autocomplete
  const getSuggestions = useCallback(
    debounce(async (term: string) => {
      if (term.length >= 2) {
        try {
          const suggestions = await NewClientService.getSearchSuggestions(term);
          setSuggestions(suggestions);
        } catch (error) {
          console.error('Failed to get suggestions:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    }, 200),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    getSuggestions(searchTerm);
  }, [searchTerm, debouncedSearch, getSuggestions]);

  const handleClientSelect = (client: ClientListSchema) => {
    onClientSelect?.(client);
    setOpen(false);
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleCreateNew = (isReferral: boolean) => {
    onCreateNew?.(searchTerm, isReferral);
    setOpen(false);
    setSearchTerm('');
    setSearchResults([]);
    setHasSearched(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRiskBadgeVariant = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Client
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Find or Add Client</DialogTitle>
          <DialogDescription>
            Search for an existing client first. If not found, you can create a new one.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, phone, or other details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="space-y-1">
              <p className="text-sm text-gray-500">Suggestions:</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchTerm(suggestion.split(' (')[0])}
                    className="h-7 text-xs"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {isSearching ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <p className="text-sm text-gray-500 mt-2">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <p className="text-sm text-gray-500">
                  Found {searchResults.length} matching client{searchResults.length === 1 ? '' : 's'}:
                </p>
                {searchResults.map((client) => (
                  <Card 
                    key={client.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleClientSelect(client)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {client.first_name} {client.last_name}
                              {client.preferred_name && ` (${client.preferred_name})`}
                            </h4>
                            <Badge variant={getRiskBadgeVariant(client.risk_level)}>
                              {client.risk_level} risk
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                            <div>DOB: {formatDate(client.date_of_birth)}</div>
                            {client.email && <div>Email: {client.email}</div>}
                            {client.phone && <div>Phone: {client.phone}</div>}
                            {client.status && <div>Status: {client.status.label || client.status.name}</div>}
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          <UserCheck className="h-4 w-4 mr-2" />
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : hasSearched && searchTerm.length >= 2 ? (
              <div className="text-center py-8 space-y-4">
                <div className="text-gray-400">
                  <Search className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-lg font-medium">No clients found</p>
                  <p className="text-sm">No existing clients match "{searchTerm}"</p>
                </div>
                
                {/* Create new client options */}
                <div className="space-y-2 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Create new client:
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button 
                      onClick={() => handleCreateNew(false)}
                      variant="default"
                      size="sm"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Walk-in Client
                    </Button>
                    <Button 
                      onClick={() => handleCreateNew(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Referred Client
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start typing to search for existing clients</p>
                <p className="text-xs mt-1">Enter at least 2 characters</p>
              </div>
            )}
          </div>

          {/* Quick create when search term exists */}
          {searchTerm.length >= 2 && !isSearching && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Can't find the client? Create new:
              </p>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleCreateNew(false)}
                  variant="default"
                  size="sm"
                  className="flex-1"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Walk-in Client
                </Button>
                <Button 
                  onClick={() => handleCreateNew(true)}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Referred Client
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}