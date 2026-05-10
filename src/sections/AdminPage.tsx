import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, Plus, Trash2, Edit3, Key, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { userAPI } from '@/services/api';
import type { User, UserRole } from '@/types/user';

const roleBadgeColors: Record<UserRole, string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/50',
  analyst: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  viewer: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
};

export function AdminPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      const data = await userAPI.getAll();
      setUsers(data.users as User[]);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async () => {
    if (!deleteUser) return;
    try {
      await userAPI.delete(deleteUser.id);
      setDeleteUser(null);
      fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-dark text-foreground grid-bg">
      <div className="fixed inset-0 hexagon-pattern opacity-20 pointer-events-none" />
      <div className="fixed inset-0 bg-gradient-to-b from-cyber-dark via-transparent to-cyber-dark pointer-events-none" />

      <div className="relative container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-cyan-400 hover:bg-cyan-500/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/50 flex items-center justify-center">
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-orbitron text-xl font-bold text-cyan-400 tracking-wider">
                USER MANAGEMENT
              </h1>
              <p className="text-xs text-cyan-400/60">Manage system users and roles</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="cyber-card border-red-500/50 bg-red-500/10 p-4 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="cyber-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              <span className="font-orbitron text-cyan-400 tracking-wide">USERS</span>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 ml-2">
                {users.length}
              </Badge>
            </div>
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-cyan-500 text-cyber-dark hover:bg-cyan-400"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : (
            <div className="rounded border border-cyan-500/20 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-cyan-500/20 hover:bg-transparent">
                    <TableHead className="text-cyan-400/70 font-orbitron text-xs">Username</TableHead>
                    <TableHead className="text-cyan-400/70 font-orbitron text-xs">Role</TableHead>
                    <TableHead className="text-cyan-400/70 font-orbitron text-xs">Created</TableHead>
                    <TableHead className="text-cyan-400/70 font-orbitron text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className="border-cyan-500/10 hover:bg-cyan-500/5">
                      <TableCell className="text-cyan-400 font-medium">{user.username}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${roleBadgeColors[user.role]}`}>
                          {user.role.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-cyan-400/60 text-sm">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10"
                            onClick={() => setEditUser(user)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10"
                            onClick={() => setResetPasswordUser(user)}
                          >
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => setDeleteUser(user)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-6 p-3 rounded bg-cyan-500/5 border border-cyan-500/20">
            <p className="text-[10px] text-cyan-400/50">
              <strong className="text-cyan-400/70">Roles:</strong>{' '}
              <span className="text-red-400">Admin</span> - Full access including user management |{' '}
              <span className="text-amber-400">Analyst</span> - Can manage data sources and refresh data |{' '}
              <span className="text-cyan-400">Viewer</span> - Read-only dashboard access
            </p>
          </div>
        </div>
      </div>

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchUsers}
      />

      <EditUserDialog
        user={editUser}
        onOpenChange={(open) => { if (!open) setEditUser(null); }}
        onUpdated={fetchUsers}
      />

      <ResetPasswordDialog
        user={resetPasswordUser}
        onOpenChange={(open) => { if (!open) setResetPasswordUser(null); }}
      />

      <AlertDialog open={!!deleteUser} onOpenChange={(open) => { if (!open) setDeleteUser(null); }}>
        <AlertDialogContent className="bg-cyber-dark border-red-500/30 text-cyan-400">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-orbitron text-red-400">Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-cyan-400/70">
              Are you sure you want to delete <strong className="text-cyan-400">{deleteUser?.username}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function CreateUserDialog({ open, onOpenChange, onCreated }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setUsername('');
    setPassword('');
    setRole('viewer');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await userAPI.create({ username, password, role });
      onOpenChange(false);
      reset();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="bg-cyber-dark border-cyan-500/30 text-cyan-400">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-cyan-400 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create User
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-cyan-400/70 text-xs">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-cyber-dark border-cyan-500/30 text-cyan-400"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-cyan-400/70 text-xs">Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-cyber-dark border-cyan-500/30 text-cyan-400"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-cyan-400/70 text-xs">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="bg-cyber-dark border-cyan-500/30 text-cyan-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-cyber-dark border-cyan-500/30 text-cyan-400">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-cyan-500/30 text-cyan-400">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-cyan-500 text-cyber-dark hover:bg-cyan-400">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EditUserDialog({ user, onOpenChange, onUpdated }: {
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}) {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState<UserRole>('viewer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setRole(user.role);
      setError('');
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);
    try {
      await userAPI.update(user.id, { username, role });
      onOpenChange(false);
      onUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="bg-cyber-dark border-cyan-500/30 text-cyan-400">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-cyan-400 flex items-center gap-2">
            <Edit3 className="w-5 h-5" />
            Edit User
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-cyan-400/70 text-xs">Username</Label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-cyber-dark border-cyan-500/30 text-cyan-400"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-cyan-400/70 text-xs">Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
              <SelectTrigger className="bg-cyber-dark border-cyan-500/30 text-cyan-400">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-cyber-dark border-cyan-500/30 text-cyan-400">
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="analyst">Analyst</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-cyan-500/30 text-cyan-400">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-cyan-500 text-cyber-dark hover:bg-cyan-400">
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordDialog({ user, onOpenChange }: {
  user: User | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setNewPassword('');
    setError('');
    setSuccess(false);
  };

  useEffect(() => { if (user) reset(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError('');
    setLoading(true);
    try {
      await userAPI.resetPassword(user.id, newPassword);
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        reset();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={!!user} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="bg-cyber-dark border-cyan-500/30 text-cyan-400">
        <DialogHeader>
          <DialogTitle className="font-orbitron text-cyan-400 flex items-center gap-2">
            <Key className="w-5 h-5" />
            Reset Password
          </DialogTitle>
        </DialogHeader>
        {success ? (
          <div className="py-6 text-center">
            <p className="text-emerald-400 font-semibold">Password reset successfully</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-cyan-400/70 text-sm">
              Reset password for <strong className="text-cyan-400">{user?.username}</strong>
            </p>
            <div className="space-y-2">
              <Label className="text-cyan-400/70 text-xs">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-cyber-dark border-cyan-500/30 text-cyan-400"
                required
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-cyan-500/30 text-cyan-400">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-amber-500 text-cyber-dark hover:bg-amber-400">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Reset Password
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
