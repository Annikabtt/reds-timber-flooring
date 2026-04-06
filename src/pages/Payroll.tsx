import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";

const payrollData = [
  { name: "Mike R.", role: "Lead Tech", hours: 42, rate: 35, status: "pending" },
  { name: "James T.", role: "Technician", hours: 38, rate: 28, status: "pending" },
  { name: "Sarah L.", role: "Technician", hours: 40, rate: 28, status: "paid" },
  { name: "Tom K.", role: "Apprentice", hours: 36, rate: 20, status: "pending" },
];

export default function Payroll() {
  const totalPayroll = payrollData.reduce((sum, p) => sum + p.hours * p.rate, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Payroll</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Weekly payroll overview</p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Weekly Payroll Estimate</p>
            <p className="text-3xl font-bold">${totalPayroll.toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Team Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Hours</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollData.map((p) => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell className="text-muted-foreground">{p.role}</TableCell>
                  <TableCell className="text-right">{p.hours}h</TableCell>
                  <TableCell className="text-right">${p.rate}/h</TableCell>
                  <TableCell className="text-right font-medium">${(p.hours * p.rate).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={p.status === "paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}>
                      {p.status === "paid" ? "Paid" : "Pending"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
