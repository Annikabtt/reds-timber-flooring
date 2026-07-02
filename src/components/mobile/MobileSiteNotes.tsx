import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type MobileSiteNotesProps = {
  issuesFound: string;
  notes: string;
  setIssuesFound: (value: string) => void;
  setNotes: (value: string) => void;
};

export const MobileSiteNotes = ({
  issuesFound,
  notes,
  setIssuesFound,
  setNotes,
}: MobileSiteNotesProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label>Issue Found</Label>
        <Textarea
          className="min-h-24 rounded-xl text-base md:text-sm"
          value={issuesFound}
          onChange={(e) => setIssuesFound(e.target.value)}
          placeholder="Site issue, access issue, damage, delay, or anything that needs attention."
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>General Note</Label>
        <Textarea
          className="min-h-24 rounded-xl text-base md:text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="General site note, worker note, or extra information before photos."
          rows={3}
        />
      </div>
    </>
  );
};