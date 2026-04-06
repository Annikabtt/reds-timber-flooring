import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Plus, Contact, Search, Mail, Phone, Building } from "lucide-react";

export default function Contacts() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");

  const { data: contacts = [] } = useQuery({
    queryKey: ["contacts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contacts").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const createContact = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("contacts").insert({
        name, email: email || null, phone: phone || null,
        company: company || null, notes: notes || null, owner_id: user!.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      queryClient.invalidateQueries({ queryKey: ["contact-count"] });
      setDialogOpen(false);
      setName(""); setEmail(""); setPhone(""); setCompany(""); setNotes("");
      toast({ title: "Contact added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const filtered = contacts.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Contacts</h1>
          <p className="text-muted-foreground mt-1">Your CRM contacts</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Add Contact</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); createContact.mutate(); }} className="space-y-4">
              <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label>Phone</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Company</Label><Input value={company} onChange={(e) => setCompany(e.target.value)} /></div>
              <div className="space-y-2"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={createContact.isPending}>
                {createContact.isPending ? "Adding..." : "Add Contact"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="pl-10"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((contact) => (
            <Card key={contact.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-secondary/15 flex items-center justify-center">
                    <span className="text-sm font-bold text-secondary">{contact.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{contact.name}</h3>
                    {contact.company && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Building className="h-3 w-3" /> {contact.company}
                      </p>
                    )}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {contact.email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" /> {contact.email}
                    </p>
                  )}
                  {contact.phone && (
                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Phone className="h-3 w-3" /> {contact.phone}
                    </p>
                  )}
                </div>
                {contact.notes && (
                  <p className="text-xs text-muted-foreground mt-3 line-clamp-2 border-t border-border pt-2">{contact.notes}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Contact className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">{search ? "No contacts match your search" : "No contacts yet"}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
