import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type MobileSiteNotesProps = {
  workCompleted: string;
  issuesFound: string;
  nextActions: string;
  notes: string;
  setWorkCompleted: (value: string) => void;
  setIssuesFound: (value: string) => void;
  setNextActions: (value: string) => void;
  setNotes: (value: string) => void;
};

export const MobileSiteNotes = ({
  workCompleted,
  issuesFound,
  nextActions,
  notes,
  setWorkCompleted,
  setIssuesFound,
  setNextActions,
  setNotes,
}: MobileSiteNotesProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label>Work Completed</Label>
        <Textarea
          className="min-h-24 rounded-xl text-base md:text-sm"
          value={workCompleted}
          onChange={(e) => setWorkCompleted(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Issues Found</Label>
        <Textarea
          className="min-h-24 rounded-xl text-base md:text-sm"
          value={issuesFound}
          onChange={(e) => setIssuesFound(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Next Actions</Label>
        <Textarea
          className="min-h-24 rounded-xl text-base md:text-sm"
          value={nextActions}
          onChange={(e) => setNextActions(e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea
          className="min-h-24 rounded-xl text-base md:text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>
    </>
  );
};