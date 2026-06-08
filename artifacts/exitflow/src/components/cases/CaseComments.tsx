import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, Lock } from "lucide-react";
import { ExitCase, CommentVisibility, Role } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { useExitStore } from "@/store/exitStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ROLE_LABELS } from "@/lib/constants";

interface CaseCommentsProps {
  exitCase: ExitCase;
}

function canSeeComment(viewerRole: Role, visibility: CommentVisibility): boolean {
  if (visibility === "all") return true;
  return ["manager", "hr", "admin"].includes(viewerRole);
}

function canPostInternal(viewerRole: Role): boolean {
  return ["manager", "hr", "admin"].includes(viewerRole);
}

export function CaseComments({ exitCase }: CaseCommentsProps) {
  const { user } = useAuth();
  const addComment = useExitStore((s) => s.addComment);
  const [message, setMessage] = useState("");
  const [visibility, setVisibility] = useState<CommentVisibility>("all");

  if (!user) return null;

  const comments = (exitCase.comments ?? [])
    .filter((c) => canSeeComment(user.role, c.visibility))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const handleSubmit = () => {
    if (!message.trim()) {
      toast.error("Comment cannot be empty");
      return;
    }
    addComment(exitCase.id, {
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      message: message.trim(),
      visibility: canPostInternal(user.role) ? visibility : "all",
    });
    setMessage("");
    toast.success("Comment added");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Notes & Comments
        </CardTitle>
        <CardDescription>
          Collaborate on this exit case. Internal notes are visible to managers and HR only.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Add a note or comment..."
            className="resize-none min-h-[80px]"
          />
          <div className="flex items-center justify-between gap-3">
            {canPostInternal(user.role) ? (
              <Select value={visibility} onValueChange={(v) => setVisibility(v as CommentVisibility)}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Visible to all</SelectItem>
                  <SelectItem value="internal">Internal only</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <span className="text-xs text-muted-foreground">Visible to all parties</span>
            )}
            <Button onClick={handleSubmit} size="sm">Post Comment</Button>
          </div>
        </div>

        <div className="divide-y border rounded-lg">
          {comments.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No comments yet. Start the conversation.
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-4 flex gap-3">
                <UserAvatar name={comment.authorName} className="w-8 h-8 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-semibold">{comment.authorName}</span>
                    <Badge variant="outline" className="text-[10px] h-5">
                      {ROLE_LABELS[comment.authorRole] ?? comment.authorRole}
                    </Badge>
                    {comment.visibility === "internal" && (
                      <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                        <Lock className="w-3 h-3" /> Internal
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">{comment.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
