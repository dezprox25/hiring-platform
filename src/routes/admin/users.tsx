import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { UserCircle2, Plus, Trash2, Shield, UserCheck, UserX, Loader2, Search, Mail, Lock } from "lucide-react";
import { usersApi, unwrapData } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Users · Dezprox" }] }),
  component: Users,
});

interface UserItem {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

function Users() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("manager");
  const [newPassword, setNewPassword] = useState("password123");

  const { data: users, isLoading } = useQuery<UserItem[]>({
    queryKey: ["admin-users"],
    queryFn: async () => unwrapData(await usersApi.findAll()),
  });

  const createMutation = useMutation({
    mutationFn: () => usersApi.create({ email: newEmail, role: newRole, password: newPassword }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User account provisioned successfully");
      setDialogOpen(false);
      setNewEmail("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create user account");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) => usersApi.update(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User account status updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("User account removed");
    },
  });

  const filteredUsers = (users || []).filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role.toUpperCase()) {
      case "ADMIN": return <Badge className="bg-destructive/15 text-destructive border-destructive/30 hover:bg-destructive/20 font-bold uppercase text-[10px]">Admin</Badge>;
      case "MANAGER": return <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20 font-bold uppercase text-[10px]">Manager</Badge>;
      case "HR": return <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/20 font-bold uppercase text-[10px]">HR</Badge>;
      default: return <Badge variant="secondary" className="font-mono text-[10px] uppercase">Candidate</Badge>;
    }
  };

  return (
    <DashboardLayout role="admin" title="Users & Staff Management">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Staff & User Directory</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage administrative privileges, hiring staff access, and candidate login credentials.
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl h-11 px-5 font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]">
              <Plus className="mr-2 h-4 w-4" /> Provision New Account
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-md border-primary/20">
            <DialogHeader>
              <DialogTitle className="text-xl font-black">Provision User Account</DialogTitle>
              <DialogDescription>Create login credentials for new staff members or candidates.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-primary" /> Email Address
                </label>
                <Input 
                  type="email" 
                  placeholder="name@dezprox.com" 
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="rounded-xl h-11 bg-muted/40" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" /> Access Role
                </label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="rounded-xl h-11 bg-muted/40">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="admin">Administrator (Full Access)</SelectItem>
                    <SelectItem value="manager">Hiring Manager (Review & Analytics)</SelectItem>
                    <SelectItem value="hr">HR Representative (Candidates & Reports)</SelectItem>
                    <SelectItem value="candidate">Candidate (Assessment Participant)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-primary" /> Initial Password
                </label>
                <Input 
                  type="text" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-xl h-11 font-mono bg-muted/40" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" className="rounded-xl" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button 
                className="rounded-xl px-6 font-bold"
                onClick={() => createMutation.mutate()}
                disabled={!newEmail || createMutation.isPending}
              >
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-2xl shadow-soft border-primary/10">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6">
          <div className="flex items-center gap-2.5">
            <UserCircle2 className="h-6 w-6 text-primary" />
            <div>
              <CardTitle className="text-lg font-bold">Active User Registry</CardTitle>
              <p className="text-xs text-muted-foreground">Total registered accounts: {users?.length || 0}</p>
            </div>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by email or role..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl h-10 bg-muted/30 border-muted focus:bg-background transition-all"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-medium">Loading user directory...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              No accounts matching your filter Criteria. Try clearing your search.
            </div>
          ) : (
            <div className="divide-y border-t-0">
              <div className="hidden sm:grid grid-cols-12 gap-4 bg-muted/30 px-6 py-3 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                <div className="col-span-4">Email Address</div>
                <div className="col-span-2">Role & Privileges</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Created Date</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex flex-col sm:grid sm:grid-cols-12 gap-4 items-start sm:items-center px-6 py-4 transition-colors hover:bg-muted/15">
                  <div className="col-span-4 flex items-center gap-3 font-medium text-foreground">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm uppercase">
                      {user.email[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{user.email}</div>
                      <div className="text-[11px] text-muted-foreground font-mono truncate max-w-[200px]">{user.id}</div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    {getRoleBadge(user.role)}
                  </div>
                  <div className="col-span-2">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                        <span className="h-2 w-2 rounded-full bg-success animate-pulse" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground" /> Suspended
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-xs text-muted-foreground font-medium">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}
                  </div>
                  <div className="col-span-2 w-full sm:w-auto sm:ml-auto flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      title={user.is_active ? "Suspend account" : "Activate account"}
                      className={`h-8 w-8 rounded-lg p-0 border-muted ${user.is_active ? "hover:border-amber-500 hover:text-amber-500 hover:bg-amber-500/10" : "hover:border-success hover:text-success hover:bg-success/10"}`}
                      onClick={() => updateMutation.mutate({ id: user.id, is_active: !user.is_active })}
                    >
                      {user.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      title="Delete user account"
                      className="h-8 w-8 rounded-lg p-0 border-muted hover:border-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm(`Permanently remove ${user.email}? This action cannot be undone.`)) {
                          deleteMutation.mutate(user.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
