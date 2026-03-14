import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Mention {
  id: string;
  comment_id: string;
  mentioned_user_id: string;
  is_read: boolean;
  created_at: string;
}

interface MentionableUser {
  id: string;
  full_name: string;
  role: 'student' | 'lecturer';
}

export const useMentions = () => {
  const { profile } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mentions, setMentions] = useState<Mention[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUnreadMentions = useCallback(async () => {
    if (!profile) return;

    try {
      const { data, error, count } = await supabase
        .from('comment_mentions')
        .select('*', { count: 'exact' })
        .eq('mentioned_user_id', profile.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMentions(data || []);
      setUnreadCount(count || 0);
    } catch (error) {
      console.error('Error fetching mentions:', error);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchUnreadMentions();

    // Subscribe to realtime updates for new mentions
    if (!profile) return;

    const channel = supabase
      .channel(`mentions-${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comment_mentions',
          filter: `mentioned_user_id=eq.${profile.id}`,
        },
        () => {
          fetchUnreadMentions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile, fetchUnreadMentions]);

  const markAsRead = async (mentionId: string) => {
    try {
      const { error } = await supabase
        .from('comment_mentions')
        .update({ is_read: true })
        .eq('id', mentionId);

      if (error) throw error;

      setMentions((prev) => prev.filter((m) => m.id !== mentionId));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking mention as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('comment_mentions')
        .update({ is_read: true })
        .eq('mentioned_user_id', profile.id)
        .eq('is_read', false);

      if (error) throw error;

      setMentions([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all mentions as read:', error);
    }
  };

  return {
    mentions,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchUnreadMentions,
  };
};

/**
 * Hook to get mentionable users for a project
 */
export const useMentionableUsers = (projectId: string) => {
  const [users, setUsers] = useState<MentionableUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Get project student and assigned lecturer, plus all lecturers
        const { data: project } = await supabase
          .from('projects')
          .select('student_id, assigned_lecturer_id')
          .eq('id', projectId)
          .single();

        if (!project) return;

        // Get all relevant users
        const userIds = [project.student_id];
        if (project.assigned_lecturer_id) {
          userIds.push(project.assigned_lecturer_id);
        }

        // Fetch profiles - include all lecturers for wider notification scope
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .or(`id.in.(${userIds.join(',')}),role.eq.lecturer`);

        if (error) throw error;

        // Remove duplicates
        const uniqueUsers = profiles?.reduce((acc, user) => {
          if (!acc.find((u) => u.id === user.id)) {
            acc.push(user as MentionableUser);
          }
          return acc;
        }, [] as MentionableUser[]);

        setUsers(uniqueUsers || []);
      } catch (error) {
        console.error('Error fetching mentionable users:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchUsers();
    }
  }, [projectId]);

  return { users, loading };
};

/**
 * Extract mentions from comment text
 * Returns array of user IDs that were mentioned
 */
export const extractMentions = (text: string, users: MentionableUser[]): string[] => {
  const mentionPattern = /@(\w+(?:\s+\w+)*)/g;
  const matches = text.matchAll(mentionPattern);
  const mentionedIds: string[] = [];

  for (const match of matches) {
    const mentionName = match[1].toLowerCase();
    const user = users.find(
      (u) => u.full_name.toLowerCase().includes(mentionName)
    );
    if (user && !mentionedIds.includes(user.id)) {
      mentionedIds.push(user.id);
    }
  }

  return mentionedIds;
};

/**
 * Create mention records for a comment
 */
export const createMentions = async (
  commentId: string,
  mentionedUserIds: string[]
): Promise<void> => {
  if (mentionedUserIds.length === 0) return;

  try {
    const mentions = mentionedUserIds.map((userId) => ({
      comment_id: commentId,
      mentioned_user_id: userId,
    }));

    const { error } = await supabase.from('comment_mentions').insert(mentions);

    if (error) {
      // Ignore unique constraint errors (duplicate mentions)
      if (!error.message.includes('unique_mention_per_comment')) {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error creating mentions:', error);
  }
};
