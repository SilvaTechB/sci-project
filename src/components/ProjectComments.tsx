import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  MessageSquare, 
  Send, 
  Loader2, 
  Trash2, 
  MoreVertical,
  User,
  GraduationCap 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import MentionInput from '@/components/MentionInput';
import { useMentionableUsers, extractMentions, createMentions } from '@/hooks/useMentions';
import { cn } from '@/lib/utils';

interface Comment {
  id: string;
  project_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    full_name: string;
    role: 'student' | 'lecturer';
  };
}

interface ProjectCommentsProps {
  projectId: string;
  className?: string;
}

/**
 * Highlight @mentions in comment text
 */
const HighlightedComment = ({ content }: { content: string }) => {
  const parts = content.split(/(@\w+(?:\s+\w+)*)/g);
  
  return (
    <p className="text-sm text-foreground whitespace-pre-wrap break-words">
      {parts.map((part, index) => {
        if (part.startsWith('@')) {
          return (
            <span
              key={index}
              className="text-primary font-medium bg-primary/10 rounded px-0.5"
            >
              {part}
            </span>
          );
        }
        return part;
      })}
    </p>
  );
};

const ProjectComments = ({ projectId, className }: ProjectCommentsProps) => {
  const { profile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Get mentionable users for this project
  const { users: mentionableUsers } = useMentionableUsers(projectId);

  useEffect(() => {
    fetchComments();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel(`comments-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'project_comments',
          filter: `project_id=eq.${projectId}`,
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('project_comments')
        .select(`
          *,
          author:profiles!project_comments_author_id_fkey(
            id, full_name, role
          )
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments((data as unknown as Comment[]) || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim() || !profile) return;

    setSubmitting(true);
    try {
      // Extract mentioned user IDs before submitting
      const mentionedUserIds = extractMentions(newComment, mentionableUsers)
        .filter(id => id !== profile.id); // Don't mention yourself

      const { data, error } = await supabase
        .from('project_comments')
        .insert({
          project_id: projectId,
          author_id: profile.id,
          content: newComment.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Create mention notifications
      if (data && mentionedUserIds.length > 0) {
        await createMentions(data.id, mentionedUserIds);
      }

      setNewComment('');
      toast.success('Comment added');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('project_comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;
      toast.success('Comment deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete comment');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className={cn('flex items-center justify-center py-8', className)}>
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-primary" />
        <h4 className="font-medium">Discussion ({comments.length})</h4>
      </div>

      {comments.length > 0 ? (
        <ScrollArea className="flex-1 max-h-[300px] pr-3 mb-4">
          <div className="space-y-4">
            {comments.map((comment) => {
              const isOwn = comment.author_id === profile?.id;
              const isLecturer = comment.author?.role === 'lecturer';

              return (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8 shrink-0">
                    <AvatarFallback className={isLecturer ? 'bg-primary/20 text-primary' : 'bg-muted'}>
                      {comment.author ? getInitials(comment.author.full_name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">
                        {comment.author?.full_name || 'Unknown'}
                      </span>
                      {isLecturer ? (
                        <GraduationCap className="w-3 h-3 text-primary shrink-0" />
                      ) : (
                        <User className="w-3 h-3 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                      </span>
                      {isOwn && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 ml-auto">
                              <MoreVertical className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDelete(comment.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    <HighlightedComment content={comment.content} />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-6 text-muted-foreground mb-4">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No comments yet. Start the discussion!</p>
        </div>
      )}

      {/* New comment input with @mentions */}
      <div className="flex gap-2">
        <div className="flex-1">
          <MentionInput
            value={newComment}
            onChange={setNewComment}
            users={mentionableUsers}
            placeholder="Write a comment... Type @ to mention"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleSubmit();
              }
            }}
          />
        </div>
        <Button
          variant="gradient"
          size="icon"
          className="shrink-0 self-start mt-0"
          onClick={handleSubmit}
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProjectComments;
