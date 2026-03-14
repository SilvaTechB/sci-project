-- Create table for storing comment mentions/notifications
CREATE TABLE public.comment_mentions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comment_id UUID NOT NULL REFERENCES public.project_comments(id) ON DELETE CASCADE,
  mentioned_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Prevent duplicate mentions of same user in same comment
  CONSTRAINT unique_mention_per_comment UNIQUE (comment_id, mentioned_user_id)
);

-- Create index for faster lookup of unread mentions
CREATE INDEX idx_comment_mentions_user_unread ON public.comment_mentions(mentioned_user_id, is_read) WHERE is_read = false;

-- Enable Row Level Security
ALTER TABLE public.comment_mentions ENABLE ROW LEVEL SECURITY;

-- Users can view their own mentions
CREATE POLICY "Users can view their own mentions"
ON public.comment_mentions
FOR SELECT
USING (mentioned_user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Users can mark their own mentions as read
CREATE POLICY "Users can update their own mentions"
ON public.comment_mentions
FOR UPDATE
USING (mentioned_user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Comment authors can create mentions (handled via trigger for safety)
CREATE POLICY "Comment authors can create mentions"
ON public.comment_mentions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM project_comments pc
    WHERE pc.id = comment_id
    AND pc.author_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  )
);

-- Enable realtime for mentions
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_mentions;