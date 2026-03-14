import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { GraduationCap, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MentionableUser {
  id: string;
  full_name: string;
  role: 'student' | 'lecturer';
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  users: MentionableUser[];
  placeholder?: string;
  className?: string;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}

const MentionInput = ({
  value,
  onChange,
  users,
  placeholder = 'Write a comment...',
  className,
  onKeyDown,
}: MentionInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [filteredUsers, setFilteredUsers] = useState<MentionableUser[]>([]);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (mentionSearch) {
      const search = mentionSearch.toLowerCase();
      const filtered = users.filter((user) =>
        user.full_name.toLowerCase().includes(search)
      );
      setFilteredUsers(filtered.slice(0, 5));
      setSuggestionIndex(0);
    } else {
      setFilteredUsers(users.slice(0, 5));
    }
  }, [mentionSearch, users]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    onChange(newValue);

    // Check for @ trigger
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if we're in a valid mention context (no spaces after @ or just starting)
      const hasNoCompletedMention = !textAfterAt.includes(' ') || textAfterAt.split(' ').length <= 2;
      
      if (hasNoCompletedMention && (lastAtIndex === 0 || newValue[lastAtIndex - 1] === ' ' || newValue[lastAtIndex - 1] === '\n')) {
        setMentionStart(lastAtIndex);
        setMentionSearch(textAfterAt);
        setShowSuggestions(true);
        return;
      }
    }
    
    setShowSuggestions(false);
    setMentionSearch('');
    setMentionStart(-1);
  };

  const insertMention = (user: MentionableUser) => {
    if (mentionStart === -1) return;

    const beforeMention = value.slice(0, mentionStart);
    const cursorPos = textareaRef.current?.selectionStart || value.length;
    const afterCursor = value.slice(cursorPos);
    
    const newValue = `${beforeMention}@${user.full_name} ${afterCursor}`;
    onChange(newValue);
    
    setShowSuggestions(false);
    setMentionSearch('');
    setMentionStart(-1);

    // Focus back on textarea
    setTimeout(() => {
      const newCursorPos = beforeMention.length + user.full_name.length + 2;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex((prev) => (prev + 1) % filteredUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex((prev) => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertMention(filteredUsers[suggestionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        insertMention(filteredUsers[suggestionIndex]);
        return;
      }
    }
    
    onKeyDown?.(e);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={cn('min-h-[80px] resize-none bg-input border-border', className)}
        onBlur={() => {
          // Delay hiding to allow click on suggestion
          setTimeout(() => setShowSuggestions(false), 200);
        }}
      />

      {/* Mention suggestions dropdown */}
      {showSuggestions && filteredUsers.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-1">
            <p className="text-xs text-muted-foreground px-2 py-1">
              Mention someone
            </p>
            {filteredUsers.map((user, index) => (
              <button
                key={user.id}
                type="button"
                className={cn(
                  'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm transition-colors',
                  index === suggestionIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted'
                )}
                onClick={() => insertMention(user)}
                onMouseEnter={() => setSuggestionIndex(index)}
              >
                <Avatar className="w-6 h-6">
                  <AvatarFallback
                    className={cn(
                      'text-xs',
                      user.role === 'lecturer'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted'
                    )}
                  >
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{user.full_name}</span>
                {user.role === 'lecturer' ? (
                  <GraduationCap className="w-3 h-3 text-primary shrink-0" />
                ) : (
                  <User className="w-3 h-3 text-muted-foreground shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-1">
        Type @ to mention someone • Ctrl+Enter to send
      </p>
    </div>
  );
};

export default MentionInput;
