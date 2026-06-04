import { useCallback, useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Trash2, Shield, Plus, Briefcase, TrendingUp, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  apiAdminCreateUser,
  apiAdminDeleteUser,
  apiAdminListUsers,
  apiAdminUpdateUser,
  AuthUser,
} from "../api/auth";
import { validateRegister, hasErrors, RegisterValidationErrors } from "../data/validation";

const ITEMS_PER_PAGE = 5;

function roleBadge(role: AuthUser["role"]) {
  switch (role) {
    case "Admin":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "Investor":
      return "bg-[#06B6D4]/10 text-[#06B6D4] border-[#06B6D4]/20";
    default:
      return "bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]/20";
  }
}

function roleLabel(role: AuthUser["role"]) {
  if (role === "StartupOwner") return "Startup Owner";
  return role;
}

export function UserManagement() {
  const { currentUser } = useAuth();

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Add user form state
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirmPassword, setNewConfirmPassword] = useState("");
  const [newRole, setNewRole] = useState("");
  const [formErrors, setFormErrors] = useState<RegisterValidationErrors>({});
  const [addError, setAddError] = useState("");
  const [busy, setBusy] = useState(false);

  const canManage = currentUser?.role === "Admin";

  const refresh = useCallback(async () => {
    if (!canManage) return;
    setLoading(true);
    setLoadError("");
    try {
      const data = await apiAdminListUsers();
      setUsers(data);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (!canManage) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Shield className="w-12 h-12 mx-auto mb-4 text-[#6B7280]" />
            <p className="text-lg text-[#6B7280]">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(users.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentUsers = users.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  async function handleDeleteConfirm() {
    if (!userToDelete) return;
    setBusy(true);
    try {
      await apiAdminDeleteUser(userToDelete);
      setUserToDelete(null);
      await refresh();
      if (currentUsers.length === 1 && currentPage > 1) {
        setCurrentPage((p) => p - 1);
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  function resetAddForm() {
    setNewName("");
    setNewEmail("");
    setNewPassword("");
    setNewConfirmPassword("");
    setNewRole("");
    setFormErrors({});
    setAddError("");
  }

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setAddError("");

    const validationErrors = validateRegister({
      name: newName,
      email: newEmail,
      password: newPassword,
      confirmPassword: newConfirmPassword,
      role: newRole,
    });
    if (hasErrors(validationErrors)) {
      setFormErrors(validationErrors);
      return;
    }

    setBusy(true);
    try {
      await apiAdminCreateUser({
        name: newName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        role: newRole as AuthUser["role"],
      });
      setShowAddDialog(false);
      resetAddForm();
      await refresh();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Failed to create user");
    } finally {
      setBusy(false);
    }
  }

  async function handleRoleChange(id: string, role: AuthUser["role"]) {
    try {
      await apiAdminUpdateUser(id, { role });
      await refresh();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Role update failed");
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl">User Management</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
                title="Reload users"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </Button>
              <Button
                onClick={() => { resetAddForm(); setShowAddDialog(true); }}
                className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadError && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{loadError}</p>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-[#6B7280]">{user.email}</TableCell>
                    <TableCell>
                      <Select
                        value={user.role}
                        onValueChange={(value: AuthUser["role"]) => handleRoleChange(user.id, value)}
                        disabled={user.id === currentUser?.id}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="StartupOwner">Startup Owner</SelectItem>
                          <SelectItem value="Investor">Investor</SelectItem>
                          <SelectItem value="Admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleBadge(user.role)}`}
                        >
                          {roleLabel(user.role)}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setUserToDelete(user.id)}
                          disabled={user.id === currentUser?.id || busy}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {currentUsers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-[#6B7280] py-8">
                      {loading ? "Loading…" : "No users found."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAddDialog} onOpenChange={(open) => { if (!open) { setShowAddDialog(false); resetAddForm(); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUser} noValidate className="space-y-4 py-2">
            {addError && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <p className="text-sm text-red-600">{addError}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewRole("StartupOwner")}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    newRole === "StartupOwner" ? "border-[#4F46E5] bg-[#4F46E5]/5" : "border-gray-200"
                  }`}
                >
                  <Briefcase className={`w-4 h-4 mb-1 ${newRole === "StartupOwner" ? "text-[#4F46E5]" : "text-gray-400"}`} />
                  <p className={`text-xs font-semibold ${newRole === "StartupOwner" ? "text-[#4F46E5]" : "text-[#111827]"}`}>
                    Startup Owner
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setNewRole("Investor")}
                  className={`p-3 rounded-lg border-2 text-left transition-colors ${
                    newRole === "Investor" ? "border-[#06B6D4] bg-[#06B6D4]/5" : "border-gray-200"
                  }`}
                >
                  <TrendingUp className={`w-4 h-4 mb-1 ${newRole === "Investor" ? "text-[#06B6D4]" : "text-gray-400"}`} />
                  <p className={`text-xs font-semibold ${newRole === "Investor" ? "text-[#06B6D4]" : "text-[#111827]"}`}>
                    Investor
                  </p>
                </button>
              </div>
              {formErrors.role && <p className="text-sm text-red-600">{formErrors.role}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-name">Full Name</Label>
              <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" />
              {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input id="new-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" />
              {formErrors.email && <p className="text-sm text-red-600">{formErrors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Password</Label>
              <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
              {formErrors.password && <p className="text-sm text-red-600">{formErrors.password}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-confirm">Confirm Password</Label>
              <Input id="new-confirm" type="password" value={newConfirmPassword} onChange={(e) => setNewConfirmPassword(e.target.value)} placeholder="Repeat password" />
              {formErrors.confirmPassword && <p className="text-sm text-red-600">{formErrors.confirmPassword}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setShowAddDialog(false); resetAddForm(); }}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy} className="bg-[#4F46E5] hover:bg-[#4338CA] text-white disabled:opacity-60">
                {busy ? "Adding…" : "Add User"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this user?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The user account will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
