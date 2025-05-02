
import { useState, useEffect } from 'react';
import { fetchMilestones, createMilestone, updateMilestoneStatus, deleteMilestone } from '@/services/api';
import { Milestone } from '@/types/models';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, CheckCircle, Circle, Clock, XCircle, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { MilestoneForm } from './MilestoneForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MilestonesSectionProps {
  ideaId: string;
  isOwner: boolean;
}

export const MilestonesSection = ({ ideaId, isOwner }: MilestonesSectionProps) => {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const { toast } = useToast();
  
  const loadMilestones = async () => {
    try {
      setIsLoading(true);
      const data = await fetchMilestones(ideaId);
      setMilestones(data);
    } catch (error) {
      console.error('Failed to load milestones:', error);
      toast({
        title: 'Error',
        description: 'Failed to load implementation milestones',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadMilestones();
  }, [ideaId]);
  
  const handleStatusChange = async (milestone: Milestone, newStatus: Milestone['status']) => {
    try {
      const isCompleting = newStatus === 'completed';
      const updated = await updateMilestoneStatus(
        milestone.id,
        newStatus,
        isCompleting
      );
      
      setMilestones(milestones.map(m => m.id === milestone.id ? updated : m));
      
      toast({
        title: 'Status updated',
        description: `Milestone status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error('Failed to update milestone status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update milestone status',
        variant: 'destructive',
      });
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      await deleteMilestone(id);
      setMilestones(milestones.filter(m => m.id !== id));
      
      toast({
        title: 'Milestone removed',
        description: 'Milestone has been deleted',
      });
    } catch (error) {
      console.error('Failed to delete milestone:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete milestone',
        variant: 'destructive',
      });
    }
  };
  
  const handleSave = async (milestone: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const newMilestone = await createMilestone({
        ...milestone,
        idea_id: ideaId
      });
      
      setMilestones([...milestones, newMilestone]);
      setShowForm(false);
      
      toast({
        title: 'Milestone added',
        description: 'New implementation milestone has been added',
      });
    } catch (error) {
      console.error('Failed to create milestone:', error);
      toast({
        title: 'Error',
        description: 'Failed to add milestone',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="outline" className="flex gap-1 items-center"><Circle className="h-3 w-3" /> Planned</Badge>;
      case 'in_progress':
        return <Badge variant="secondary" className="flex gap-1 items-center"><Clock className="h-3 w-3" /> In Progress</Badge>;
      case 'completed':
        return <Badge variant="default" className="bg-green-600 flex gap-1 items-center"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
      case 'blocked':
        return <Badge variant="destructive" className="flex gap-1 items-center"><XCircle className="h-3 w-3" /> Blocked</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-32" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full mb-4" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Implementation Progress</span>
          {isOwner && !showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <PlusCircle className="h-4 w-4 mr-2" /> Add Milestone
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showForm && (
          <>
            <MilestoneForm onSave={handleSave} onCancel={() => setShowForm(false)} />
            <Separator className="my-6" />
          </>
        )}
        
        {milestones.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No implementation milestones yet.</p>
            {isOwner && !showForm && (
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <PlusCircle className="h-4 w-4 mr-2" /> Add First Milestone
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{milestone.title}</h3>
                    {milestone.description && (
                      <p className="text-muted-foreground mt-1">{milestone.description}</p>
                    )}
                  </div>
                  {getStatusBadge(milestone.status)}
                </div>
                
                <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
                  {milestone.due_date && (
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      <span>Due: {format(new Date(milestone.due_date), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                  {milestone.completed_at && (
                    <div className="flex items-center gap-1 ml-4">
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span>Completed: {format(new Date(milestone.completed_at), 'MMM d, yyyy')}</span>
                    </div>
                  )}
                </div>
                
                {isOwner && (
                  <div className="flex justify-end gap-2 mt-4">
                    {milestone.status !== 'planned' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange(milestone, 'planned')}
                      >
                        Mark as Planned
                      </Button>
                    )}
                    
                    {milestone.status !== 'in_progress' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange(milestone, 'in_progress')}
                      >
                        Mark In Progress
                      </Button>
                    )}
                    
                    {milestone.status !== 'completed' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange(milestone, 'completed')}
                      >
                        Mark Complete
                      </Button>
                    )}
                    
                    {milestone.status !== 'blocked' && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleStatusChange(milestone, 'blocked')}
                      >
                        Mark Blocked
                      </Button>
                    )}
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Milestone</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this milestone. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(milestone.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
