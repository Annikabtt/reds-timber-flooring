import { useState } from "react";
import { TechLayout } from "@/components/technician/TechLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock } from "lucide-react";
import { toast } from "sonner";

const leaveHistory = [
  { id: 1, type: "Sick", from: "28 Mar 2026", to: "28 Mar 2026", status: "Approved" },
  { id: 2, type: "Personal", from: "15 Mar 2026", to: "16 Mar 2026", status: "Approved" },
  { id: 3, type: "Sick", from: "02 Mar 2026", to: "02 Mar 2026", status: "Pending" },
];

export default function TechLeave() {
  const [leaveType, setLeaveType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveType || !fromDate || !toDate) {
      toast.error("Please fill in all fields.");
      return;
    }
    toast.success("Leave request submitted!");
    setLeaveType("");
    setFromDate("");
    setToDate("");
  };

  const statusColor = (status: string) => {
    if (status === "Approved") return "bg-[hsl(142,55%,40%)] text-white hover:bg-[hsl(142,55%,35%)]";
    if (status === "Pending") return "bg-[hsl(34,80%,50%)] text-white hover:bg-[hsl(34,80%,45%)]";
    return "bg-[hsl(0,72%,51%)] text-white";
  };

  return (
    <TechLayout>
      <h1 className="text-xl font-bold text-[hsl(20,20%,15%)] mb-5">Leave Request</h1>

      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <Card className="border-0 shadow-md mb-4">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-[hsl(20,20%,15%)]">Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sick">Sick Leave</SelectItem>
                  <SelectItem value="Personal">Personal Leave</SelectItem>
                  <SelectItem value="Annual">Annual Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-[hsl(20,20%,15%)]">From</Label>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-semibold text-[hsl(20,20%,15%)]">To</Label>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="h-12 text-base"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full h-14 text-lg font-bold rounded-xl bg-[hsl(20,100%,41%)] hover:bg-[hsl(20,100%,35%)] text-white shadow-lg active:scale-[0.97] transition-all"
        >
          Submit Request
        </Button>
      </form>

      {/* History */}
      <h2 className="text-sm font-semibold text-[hsl(20,10%,45%)] uppercase tracking-wide mb-3">
        Request History
      </h2>
      <div className="space-y-3">
        {leaveHistory.map((item) => (
          <Card key={item.id} className="border-0 shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[hsl(30,20%,97%)] flex items-center justify-center shrink-0">
                {item.type === "Sick" ? (
                  <Clock className="h-5 w-5 text-[hsl(20,100%,41%)]" />
                ) : (
                  <CalendarDays className="h-5 w-5 text-[hsl(20,100%,41%)]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[hsl(20,20%,15%)] text-sm">{item.type} Leave</p>
                <p className="text-xs text-[hsl(20,10%,45%)]">
                  {item.from}{item.from !== item.to ? ` → ${item.to}` : ""}
                </p>
              </div>
              <Badge className={statusColor(item.status)}>{item.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </TechLayout>
  );
}
