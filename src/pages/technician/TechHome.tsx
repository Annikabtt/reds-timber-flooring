import { useState } from "react";
import { TechLayout } from "@/components/technician/TechLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MapPin, Clock, Briefcase, ChevronRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function TechHome() {
  const { user } = useAuth();
  const [clockedIn, setClockedIn] = useState(false);

  const displayName =
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Technician";
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <TechLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Avatar className="h-12 w-12 border-2 border-[hsl(20,100%,41%)]">
          <AvatarFallback className="bg-[hsl(20,30%,92%)] text-[hsl(20,20%,15%)] text-lg font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm text-[hsl(20,10%,45%)]">Welcome back,</p>
          <h1 className="text-xl font-bold text-[hsl(20,20%,15%)]">{displayName}</h1>
        </div>
      </div>

      {/* Clock-in Card */}
      <Card className="mb-4 border-0 shadow-md overflow-hidden">
        <div
          className={`h-1.5 w-full ${
            clockedIn ? "bg-[hsl(142,55%,40%)]" : "bg-[hsl(20,100%,41%)]"
          }`}
        />
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3 text-sm text-[hsl(20,10%,45%)]">
            <MapPin className="h-4 w-4" />
            <span>Oak Valley Office — Lobby</span>
          </div>
          <div className="flex items-center gap-2 mb-5 text-sm text-[hsl(20,10%,45%)]">
            <Clock className="h-4 w-4" />
            <span>
              {clockedIn
                ? `Clocked in at ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "You are not clocked in"}
            </span>
          </div>
          <Button
            onClick={() => setClockedIn(!clockedIn)}
            className={`w-full h-14 text-lg font-bold rounded-xl shadow-lg transition-all active:scale-[0.97] ${
              clockedIn
                ? "bg-[hsl(0,72%,51%)] hover:bg-[hsl(0,72%,45%)] text-white"
                : "bg-[hsl(20,100%,41%)] hover:bg-[hsl(20,100%,35%)] text-white"
            }`}
          >
            {clockedIn ? "Clock Out" : "Clock In"}
          </Button>
        </CardContent>
      </Card>

      {/* Current Assignment */}
      <h2 className="text-sm font-semibold text-[hsl(20,10%,45%)] uppercase tracking-wide mb-2">
        Current Assignment
      </h2>
      <Card className="border-0 shadow-md mb-4">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-[hsl(20,30%,92%)] flex items-center justify-center shrink-0">
            <Briefcase className="h-6 w-6 text-[hsl(20,100%,41%)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[hsl(20,20%,15%)] truncate">
              Oak Valley Office — Lobby
            </p>
            <p className="text-sm text-[hsl(20,10%,45%)]">
              Engineered Oak • 120 sqm
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-[hsl(20,10%,45%)] shrink-0" />
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(20,100%,41%)]">12</p>
            <p className="text-xs text-[hsl(20,10%,45%)] mt-1">Hours This Week</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[hsl(142,55%,40%)]">3</p>
            <p className="text-xs text-[hsl(20,10%,45%)] mt-1">Photos Today</p>
          </CardContent>
        </Card>
      </div>
    </TechLayout>
  );
}
