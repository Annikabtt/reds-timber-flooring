import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DollarSign, CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";

const payrollData = [
  { name: "Mike R.", role: "Lead Installer", hours: 42, tasks: 8, rate: 35, status: "pending" as const },
  { name: "James T.", role: "Technician", hours: 38, tasks: 6, rate: 28, status: "pending" as const },
  { name: "Sarah L.", role: "Technician", hours: 40, tasks: 7, rate: 28, status: "paid" as const },
  { name: "Tom K.", role: "Apprentice", hours: 36, tasks: 5, rate: 20, status: "pending" as const },
];

export default function Payroll() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2026, 3, 1),
    to: new Date(2026, 3, 7),
  });
  const [statuses, setStatuses] = useState(payrollData.map((p) => p.status));

  const totalPayroll = payrollData.reduce((sum, p) => sum + p.hours * p.rate, 0);

  const handleApprove = (index: number) => {
    setStatuses((prev) => prev.map((s, i) => (i === index ? "paid" : s)));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Weekly Payroll Summary</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Review and approve technician payouts</p>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 w-fit">
              <CalendarIcon className="h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "MMM d")} – {format(dateRange.to, "MMM d, yyyy")}
                  </>
                ) : (
                  format(dateRange.from, "MMM d, yyyy")
                )
              ) : (
                "Select date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={1}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Data Table */}
      <Card className="shadow-sm border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Team Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Technician Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Hours / Tasks</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Total Payout</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollData.map((p, i) => {
                const isPaid = statuses[i] === "paid";
                return (
                  <TableRow key={p.name}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground">{p.role}</TableCell>
                    <TableCell className="text-center">
                      {p.hours}h / {p.tasks} tasks
                    </TableCell>
                    <TableCell className="text-right">${p.rate}/h</TableCell>
                    <TableCell className="text-right font-semibold">
                      ${(p.hours * p.rate).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={cn(
                          isPaid
                            ? "bg-[hsl(142,55%,40%)]/10 text-[hsl(142,55%,40%)]"
                            : "bg-[hsl(34,80%,50%)]/10 text-[hsl(34,80%,50%)]"
                        )}
                      >
                        {isPaid ? "Paid" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {isPaid ? (
                        <span className="text-muted-foreground text-xs flex items-center justify-center gap-1">
                          <Check className="h-3.5 w-3.5" /> Approved
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(i)}
                          className="bg-[hsl(20,100%,41%)] hover:bg-[hsl(20,100%,35%)] text-white h-8 px-3 text-xs"
                        >
                          Approve
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Total Payout Summary */}
      <Card className="shadow-sm border-border">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Weekly Payout</p>
            <p className="text-3xl font-bold">${totalPayroll.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
