import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Clock, 
  FileText, 
  Stethoscope, 
  ClipboardList, 
  Activity,
  Plus,
  MessageSquare,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { TimelineActivity, Program } from '@/types/client';
import { mockClientService } from '@/services/mock-client-service';
import { cn } from '@/lib/utils';

interface TimelineSectionProps {
  clientId: string;
  canEditClient?: boolean;
}

type ActivityType = 'clinical' | 'administrative' | 'episode' | 'assessment';

const activityTypeConfig = {
  clinical: {
    icon: Stethoscope,
    label: 'Progress Notes',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    badgeColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
  },
  administrative: {
    icon: ClipboardList,
    label: 'Administrative',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    borderColor: 'border-blue-200 dark:border-blue-800',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100'
  },
  assessment: {
    icon: BookOpen,
    label: 'Assessment',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    borderColor: 'border-purple-200 dark:border-purple-800',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
  },
  episode: {
    icon: Activity,
    label: 'Episodes',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100'
  }
};

export function TimelineSection({ clientId, canEditClient = true }: TimelineSectionProps) {
  const [activities, setActivities] = useState<TimelineActivity[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<ActivityType[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [expandedView, setExpandedView] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [showNewNoteDialog, setShowNewNoteDialog] = useState(false);
  const [newNoteType, setNewNoteType] = useState<'clinical' | 'administrative'>('clinical');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteProgram, setNewNoteProgram] = useState<string>('');
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    loadData();
  }, [clientId, selectedTypes]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [activitiesData, programsData] = await Promise.all([
        mockClientService.getTimelineActivities(clientId, { 
          activityTypes: selectedTypes.length > 0 ? selectedTypes : undefined 
        }),
        mockClientService.getPrograms()
      ]);
      
      setActivities(activitiesData);
      setPrograms(programsData);
    } catch (error) {
      console.error('Error loading timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeToggle = (type: ActivityType) => {
    setSelectedTypes(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleItemToggle = (activityId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(activityId)) {
        newSet.delete(activityId);
      } else {
        newSet.add(activityId);
      }
      return newSet;
    });
  };

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      setSubmittingNote(true);
      const newActivity = await mockClientService.createNote(clientId, {
        type: newNoteType,
        content: newNoteContent,
        program: newNoteProgram
      });
      
      setActivities(prev => [newActivity, ...prev]);
      setNewNoteContent('');
      setNewNoteProgram('');
      setShowNewNoteDialog(false);
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setSubmittingNote(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredActivities = activities.filter(activity => {
    if (selectedProgram !== 'all' && activity.program !== selectedProgram) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="flex items-center gap-4 flex-wrap justify-between">
        <div className="flex items-center gap-4 flex-wrap">
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programs</SelectItem>
              {programs.map(program => (
                <SelectItem key={program.id} value={program.name}>
                  {program.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            {Object.entries(activityTypeConfig).map(([type, config]) => (
              <Button
                key={type}
                variant={selectedTypes.includes(type as ActivityType) ? "default" : "outline"}
                size="sm"
                onClick={() => handleTypeToggle(type as ActivityType)}
                className="flex items-center gap-1"
              >
                <config.icon className="h-3 w-3" />
                {config.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="expanded-view"
              checked={expandedView}
              onCheckedChange={setExpandedView}
            />
            <Label htmlFor="expanded-view">Expanded View</Label>
          </div>
        </div>

        {canEditClient && (
          <div className="flex items-center gap-2">
            <Dialog open={showNewNoteDialog} onOpenChange={setShowNewNoteDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Progress Note
                </Button>
              </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Note</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="clinical"
                          name="noteType"
                          checked={newNoteType === 'clinical'}
                          onChange={() => setNewNoteType('clinical')}
                        />
                        <Label htmlFor="clinical">Clinical Note</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="administrative"
                          name="noteType"
                          checked={newNoteType === 'administrative'}
                          onChange={() => setNewNoteType('administrative')}
                        />
                        <Label htmlFor="administrative">Admin Note</Label>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="program">Program (optional)</Label>
                      <Select value={newNoteProgram} onValueChange={setNewNoteProgram}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select program" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">No program</SelectItem>
                          {programs.map(program => (
                            <SelectItem key={program.id} value={program.name}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="content">Note Content</Label>
                      <Textarea
                        id="content"
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        placeholder="Enter your note content..."
                        rows={6}
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowNewNoteDialog(false)}
                        disabled={submittingNote}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleCreateNote}
                        disabled={!newNoteContent.trim() || submittingNote}
                      >
                        {submittingNote ? 'Creating...' : 'Create Note'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Assessment
              </Button>
            </div>
          )}
      </div>

      {/* Timeline Activities */}
      <div className="space-y-2">
        {filteredActivities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No activities found for the selected filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredActivities.map((activity) => {
            const config = activityTypeConfig[activity.type];
            const IconComponent = config.icon;
            const isItemExpanded = expandedView || expandedItems.has(activity.id);
            
            return (
              <Card 
                key={activity.id} 
                className={cn("transition-colors overflow-hidden cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50", config.borderColor)}
                onClick={() => handleItemToggle(activity.id)}
              >
                <CardContent className={cn(isItemExpanded ? "py-1 px-3" : "py-0.5 px-3")}>
                  <div className="flex items-start gap-3">
                    <div className={cn("p-1.5 rounded-full", config.badgeColor)}>
                      <IconComponent className="h-3 w-3" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={config.badgeColor}>
                              {config.label}
                            </Badge>
                            {activity.title && (
                              <span className="text-sm text-gray-600 dark:text-gray-400">
                                • {activity.title}
                              </span>
                            )}
                            <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
                              • {activity.staffMember}
                            </span>
                            {activity.program && (
                              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                • {activity.program}
                              </span>
                            )}
                          </div>
                          
                          {isItemExpanded && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mt-1">
                              {activity.content}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(activity.date)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}