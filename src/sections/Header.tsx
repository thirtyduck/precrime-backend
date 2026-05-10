import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Database, Clock, Shield, Zap, LogOut, Lock, Users, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChangePasswordDialog } from '@/sections/ChangePasswordDialog';
import type { SystemStatus } from '@/types/threat';
import type { UserRole } from '@/types/user';

interface HeaderProps {
  systemStatus: SystemStatus;
  username?: string | null;
  onLogout?: () => void;
  role?: UserRole | null;
}

const roleBadgeColors: Record<UserRole, string> = {
  admin: 'bg-red-500/20 text-red-400 border-red-500/50',
  analyst: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
  viewer: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
};

export function Header({ systemStatus, username, onLogout, role }: HeaderProps) {
  const navigate = useNavigate();
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

  return (
    <>
      <header className="relative w-full border-b border-cyan-500/30 bg-cyber-dark/90 backdrop-blur-md">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 border border-cyan-500/50 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="font-orbitron text-2xl font-bold text-cyan-400 tracking-wider">
                  PRE<span className="text-white">CRIME</span>
                </h1>
                <p className="text-xs text-cyan-400/60 tracking-[0.3em] uppercase">
                  Threat Intelligence System
                </p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <StatusItem
                icon={Activity}
                label="System Status"
                value={systemStatus.online ? 'ONLINE' : 'OFFLINE'}
                status={systemStatus.online ? 'good' : 'bad'}
              />
              <StatusItem
                icon={Database}
                label="Data Sources"
                value={systemStatus.dataSources.toString()}
                status="good"
              />
              <StatusItem
                icon={Zap}
                label="Accuracy"
                value={`${systemStatus.predictionAccuracy}%`}
                status="good"
              />
              <StatusItem
                icon={Clock}
                label="Last Update"
                value={systemStatus.lastUpdate}
                status="neutral"
              />
              {username && onLogout && (
                <div className="flex items-center gap-2 pl-4 border-l border-cyan-500/30">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-auto py-1 px-2 text-cyan-400/60 hover:text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <span className="text-xs block">{username}</span>
                            {role && (
                              <Badge className={`text-[9px] px-1 py-0 ${roleBadgeColors[role]}`}>
                                {role.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <ChevronDown className="w-3 h-3" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="bg-cyber-dark border-cyan-500/30 text-cyan-400"
                    >
                      <DropdownMenuItem
                        onClick={() => setPasswordDialogOpen(true)}
                        className="hover:bg-cyan-500/10 cursor-pointer"
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Change Password
                      </DropdownMenuItem>
                      {role === 'admin' && (
                        <DropdownMenuItem
                          onClick={() => navigate('/admin')}
                          className="hover:bg-cyan-500/10 cursor-pointer"
                        >
                          <Users className="w-4 h-4 mr-2" />
                          User Management
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-cyan-500/20" />
                      <DropdownMenuItem
                        onClick={onLogout}
                        className="hover:bg-red-500/10 text-red-400 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-500/50" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-500/50" />
      </header>

      <ChangePasswordDialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen} />
    </>
  );
}

interface StatusItemProps {
  icon: React.ElementType;
  label: string;
  value: string;
  status: 'good' | 'bad' | 'neutral';
}

function StatusItem({ icon: Icon, label, value, status }: StatusItemProps) {
  const statusColors = {
    good: 'text-emerald-400',
    bad: 'text-red-400',
    neutral: 'text-cyan-400',
  };

  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${statusColors[status]}`} />
      <div className="flex flex-col">
        <span className="text-[10px] text-cyan-400/60 uppercase tracking-wider">{label}</span>
        <span className={`font-orbitron text-sm font-semibold ${statusColors[status]}`}>
          {value}
        </span>
      </div>
    </div>
  );
}
