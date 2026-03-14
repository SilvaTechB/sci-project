import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow, isPast, isWithinInterval, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProjectDeadlineProps {
  projectId: string;
  deadline: string | null;
  canEdit?: boolean;
  onDeadlineChange?: (deadline: string | null) => void;
  compact?: boolean;
}

const ProjectDeadline = ({ 
  projectId, 
  deadline, 
  canEdit = false, 
  onDeadlineChange,
  compact = false 
}: ProjectDeadlineProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    deadline ? new Date(deadline) : undefined
  );

  const handleSave = async () => {
    if (!selectedDate) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ deadline: selectedDate.toISOString() })
        .eq('id', projectId);

      if (error) throw error;

      onDeadlineChange?.(selectedDate.toISOString());
      setIsOpen(false);
      toast.success('Deadline updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update deadline');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ deadline: null })
        .eq('id', projectId);

      if (error) throw error;

      setSelectedDate(undefined);
      onDeadlineChange?.(null);
      setIsOpen(false);
      toast.success('Deadline removed');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove deadline');
    } finally {
      setSaving(false);
    }
  };

  const getDeadlineStatus = () => {
    if (!deadline) return null;

    const deadlineDate = new Date(deadline);
    const now = new Date();

    if (isPast(deadlineDate)) {
      return { status: 'overdue', label: 'Overdue', variant: 'rejected' as const };
    }

    if (isWithinInterval(now, { start: now, end: addDays(now, 3) }) && 
        isWithinInterval(deadlineDate, { start: now, end: addDays(now, 3) })) {
      return { status: 'soon', label: 'Due soon', variant: 'pending' as const };
    }

    return { status: 'ok', label: 'On track', variant: 'secondary' as const };
  };

  const deadlineStatus = getDeadlineStatus();

  if (!deadline && !canEdit) {
    return null;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        {deadline ? (
          <>
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
            <span className={cn(
              deadlineStatus?.status === 'overdue' && 'text-destructive',
              deadlineStatus?.status === 'soon' && 'text-warning'
            )}>
              {format(new Date(deadline), 'MMM d, yyyy')}
            </span>
            {deadlineStatus?.status === 'overdue' && (
              <AlertTriangle className="w-4 h-4 text-destructive" />
            )}
          </>
        ) : canEdit ? (
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                <CalendarDays className="w-4 h-4 mr-1" />
                Set deadline
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                initialFocus
              />
              <div className="p-3 border-t flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave} disabled={!selectedDate || saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-lg bg-muted/50 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h4 className="font-medium">Deadline</h4>
        </div>
        {deadlineStatus && (
          <Badge variant={deadlineStatus.variant}>
            {deadlineStatus.status === 'overdue' && <AlertTriangle className="w-3 h-3 mr-1" />}
            {deadlineStatus.status === 'ok' && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {deadlineStatus.label}
          </Badge>
        )}
      </div>

      {deadline ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{format(new Date(deadline), 'PPP')}</span>
          </div>
          <p className={cn(
            'text-sm',
            deadlineStatus?.status === 'overdue' ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {isPast(new Date(deadline)) 
              ? `Overdue by ${formatDistanceToNow(new Date(deadline))}`
              : `Due ${formatDistanceToNow(new Date(deadline), { addSuffix: true })}`
            }
          </p>
          {canEdit && (
            <div className="flex gap-2 pt-2">
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">Change</Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                  <div className="p-3 border-t flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={!selectedDate || saving}>
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="sm" onClick={handleClear} disabled={saving}>
                Remove
              </Button>
            </div>
          )}
        </div>
      ) : canEdit ? (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <CalendarDays className="w-4 h-4 mr-2" />
              Set Deadline
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < new Date()}
              initialFocus
            />
            <div className="p-3 border-t flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={!selectedDate || saving}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      ) : (
        <p className="text-sm text-muted-foreground">No deadline set</p>
      )}
    </div>
  );
};

export default ProjectDeadline;
