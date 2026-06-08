import { ExitCase } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useExitStore } from "@/store/exitStore";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function ExitInterviewForm({ exitCase, readOnly = false }: { exitCase: ExitCase, readOnly?: boolean }) {
  const saveInterview = useExitStore(state => state.saveExitInterview);
  const interview = exitCase.exitInterview;
  const isCompleted = !!interview;

  const [ratings, setRatings] = useState({
    overall: interview?.overallRating || 0,
    management: interview?.managementRating || 0,
    culture: interview?.cultureRating || 0,
  });

  const [text, setText] = useState({
    reason: interview?.reason || "",
    improvements: interview?.improvements || "",
    comments: interview?.comments || "",
  });

  if (readOnly && !isCompleted) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          Exit interview has not been completed yet.
        </CardContent>
      </Card>
    );
  }

  const handleSave = () => {
    saveInterview(exitCase.id, {
      overallRating: ratings.overall,
      managementRating: ratings.management,
      cultureRating: ratings.culture,
      reason: text.reason,
      improvements: text.improvements,
      wouldRejoin: true,
      comments: text.comments,
    });
    toast.success("Exit interview saved.");
  };

  const StarRating = ({ label, value, onChange }: any) => (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={cn(
              "w-6 h-6 cursor-pointer transition-colors",
              star <= value ? "fill-amber-400 text-amber-400" : "fill-muted text-muted-foreground/30",
              (isCompleted && readOnly) && "cursor-default"
            )}
            onClick={() => !readOnly && !isCompleted && onChange(star)}
          />
        ))}
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exit Interview Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StarRating label="Overall Experience" value={ratings.overall} onChange={(v:number) => setRatings({...ratings, overall: v})} />
          <StarRating label="Management" value={ratings.management} onChange={(v:number) => setRatings({...ratings, management: v})} />
          <StarRating label="Company Culture" value={ratings.culture} onChange={(v:number) => setRatings({...ratings, culture: v})} />
        </div>

        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <Label>Primary Reason for Leaving</Label>
            <Textarea 
              value={text.reason} 
              onChange={e => setText({...text, reason: e.target.value})} 
              disabled={isCompleted || readOnly}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Areas of Improvement</Label>
            <Textarea 
              value={text.improvements} 
              onChange={e => setText({...text, improvements: e.target.value})} 
              disabled={isCompleted || readOnly}
              className="resize-none"
            />
          </div>
          <div className="space-y-2">
            <Label>Additional Comments</Label>
            <Textarea 
              value={text.comments} 
              onChange={e => setText({...text, comments: e.target.value})} 
              disabled={isCompleted || readOnly}
              className="resize-none"
            />
          </div>
        </div>

        {!isCompleted && !readOnly && (
          <div className="flex justify-end pt-4">
            <Button onClick={handleSave}>Save Interview Record</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
