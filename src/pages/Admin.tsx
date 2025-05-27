import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import PromoCodeManager from '@/components/Admin/PromoCodeManager';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion } from 'framer-motion';

interface User {
  id: string;
  username: string;
  email: string;
  balance: number;
  is_banned: boolean;
  is_admin: boolean;
}

interface RiggedUser {
  user_id: string;
  win_chance: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [balanceChange, setBalanceChange] = useState<number>(0);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [banReason, setBanReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [banDuration, setBanDuration] = useState<number>(10);
  const [riggedUsers, setRiggedUsers] = useState<RiggedUser[]>([]);
  const [selectedUserForRig, setSelectedUserForRig] = useState<string>('');
  const [winChance, setWinChance] = useState<number>(10);

  useEffect(() => {
    checkAdminStatus();
    fetchUsers();
    if (isOwner) {
      fetchRiggedUsers();
    }
  }, [isOwner]);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, is_owner')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin && !profile?.is_owner) {
      navigate('/');
      return;
    }

    setIsAdmin(profile.is_admin || false);
    setIsOwner(profile.is_owner || false);
  };

  const fetchUsers = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('*');

      if (walletsError) throw walletsError;

      const { data: bannedUsers, error: bannedError } = await supabase
        .from('banned_users')
        .select('*');

      if (bannedError) throw bannedError;

      const combinedUsers = profiles.map(profile => ({
        id: profile.id,
        username: profile.username,
        email: profile.email || '',
        balance: wallets?.find(w => w.user_id === profile.id)?.balance || 0,
        is_banned: bannedUsers?.some(b => b.user_id === profile.id) || false,
        is_admin: profile.is_admin || false
      }));

      setUsers(combinedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const fetchRiggedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('rigged_users')
        .select('*');

      if (error) throw error;
      setRiggedUsers(data || []);
    } catch (error) {
      console.error('Error fetching rigged users:', error);
      toast.error('Failed to fetch rigged users');
    }
  };

  const handleRigUser = async () => {
    if (!isOwner || !selectedUserForRig) return;

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('rig_user', {
        target_user_id: selectedUserForRig,
        owner_id: user.id,
        win_chance: winChance / 100
      });

      if (error) throw error;

      toast.success('User rigged successfully');
      fetchRiggedUsers();
      setSelectedUserForRig('');
      setWinChance(10);
    } catch (error) {
      console.error('Error rigging user:', error);
      toast.error('Failed to rig user');
    } finally {
      setLoading(false);
    }
  };

  const handleBalanceChange = async () => {
    if (!isOwner) {
      toast.error('Only owners can modify balance');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.rpc('update_user_balance', {
        target_user_id: selectedUser,
        amount_change: balanceChange
      });

      if (error) throw error;

      toast.success('Balance updated successfully');
      fetchUsers();
      setSelectedUser('');
      setBalanceChange(0);
    } catch (error) {
      toast.error('Failed to update balance');
      console.error('Error updating balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyMessage = async () => {
    if (!isOwner) {
      toast.error('Only owners can send emergency messages');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('emergency_messages')
        .insert({
          message: emergencyMessage,
          target_user_id: targetUserId || null,
        });

      if (error) throw error;

      toast.success('Emergency message created successfully');
      setEmergencyMessage('');
      setTargetUserId('');
    } catch (error) {
      toast.error('Failed to create emergency message');
      console.error('Error creating emergency message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId: string) => {
    if (!isOwner) {
      toast.error('Only owners can ban users');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const duration = `${banDuration} hours`;

      const { error } = await supabase.rpc('ban_user', {
        target_user_id: userId,
        admin_user_id: user.id,
        ban_reason: banReason,
        duration: duration
      });

      if (error) throw error;

      toast.success('User banned successfully');
      fetchUsers();
      setBanReason('');
    } catch (error) {
      toast.error('Failed to ban user');
      console.error('Error banning user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    if (!isOwner) {
      toast.error('Only owners can unban users');
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.rpc('unban_user', {
        target_user_id: userId,
        admin_user_id: user.id
      });

      if (error) throw error;

      toast.success('User unbanned successfully');
      fetchUsers();
    } catch (error) {
      toast.error('Failed to unban user');
      console.error('Error unbanning user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (!isOwner) {
      toast.error('Only owners can modify admin status');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ is_admin: !isCurrentlyAdmin })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`User ${isCurrentlyAdmin ? 'removed from' : 'added to'} admin role`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update admin status');
      console.error('Error updating admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner && !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl text-red-500">Access Denied</h1>
        <p className="text-gray-400">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-center"
      >
        <h1 className="text-3xl font-bold text-spdm-green">
          {isOwner ? 'Owner Panel' : 'Admin Panel'}
        </h1>
        <Button
          onClick={fetchUsers}
          variant="outline"
          className="border-spdm-green text-spdm-green hover:bg-spdm-green/10"
        >
          Refresh Data
        </Button>
      </motion.div>

      {/* User Management Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-6 bg-spdm-dark border-spdm-green/20">
          <h2 className="text-xl font-semibold text-spdm-green mb-4">User Management</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.balance} coins</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.is_banned ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                      }`}>
                        {user.is_banned ? 'Banned' : 'Active'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        user.is_admin ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {user.is_admin ? 'Admin' : 'User'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {isOwner && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedUser(user.id);
                                setBalanceChange(0);
                              }}
                              className="bg-spdm-green hover:bg-spdm-darkGreen text-black"
                            >
                              Modify Balance
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleToggleAdmin(user.id, user.is_admin)}
                              variant="outline"
                              className="border-blue-500 text-blue-400 hover:bg-blue-500/10"
                            >
                              {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                            </Button>
                          </>
                        )}
                        {(isOwner || isAdmin) && (
                          <>
                            {user.is_banned ? (
                              <Button
                                size="sm"
                                onClick={() => handleUnbanUser(user.id)}
                                variant="destructive"
                              >
                                Unban
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setBanReason('');
                                  handleBanUser(user.id);
                                }}
                                variant="destructive"
                              >
                                Ban
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </motion.div>

      {/* Balance Modification Section */}
      {isOwner && selectedUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-spdm-dark border-spdm-green/20">
            <h2 className="text-xl font-semibold text-spdm-green mb-4">Modify Balance</h2>
            <div className="space-y-4">
              <div>
                <Label>Amount Change</Label>
                <Input
                  type="number"
                  value={balanceChange}
                  onChange={(e) => setBalanceChange(parseInt(e.target.value) || 0)}
                  className="bg-spdm-gray border-spdm-green/30"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleBalanceChange}
                  disabled={loading}
                  className="bg-spdm-green hover:bg-spdm-darkGreen text-black"
                >
                  Update Balance
                </Button>
                <Button
                  onClick={() => setSelectedUser('')}
                  variant="outline"
                  className="border-spdm-green text-spdm-green hover:bg-spdm-green/10"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Emergency Message Section - Owner Only */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6 bg-spdm-dark border-spdm-green/20">
            <h2 className="text-xl font-semibold text-spdm-green mb-4">Emergency Message</h2>
            <div className="space-y-4">
              <div>
                <Label>Message</Label>
                <Textarea
                  value={emergencyMessage}
                  onChange={(e) => setEmergencyMessage(e.target.value)}
                  className="bg-spdm-gray border-spdm-green/30"
                  placeholder="Enter emergency message..."
                />
              </div>
              <div>
                <Label>Target User ID (optional)</Label>
                <Input
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="bg-spdm-gray border-spdm-green/30"
                  placeholder="Leave empty to send to all users"
                />
              </div>
              <Button
                onClick={handleEmergencyMessage}
                disabled={loading || !emergencyMessage}
                className="bg-spdm-green hover:bg-spdm-darkGreen text-black"
              >
                Send Emergency Message
              </Button>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Rig Users Section */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-spdm-dark border-spdm-green/20">
            <h2 className="text-xl font-semibold text-spdm-green mb-4">Rig Users</h2>
            <div className="space-y-4">
              <div>
                <Label>Select User</Label>
                <select
                  value={selectedUserForRig}
                  onChange={(e) => setSelectedUserForRig(e.target.value)}
                  className="w-full bg-spdm-gray border-spdm-green/30 rounded-md p-2"
                >
                  <option value="">Select a user</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Win Chance (%)</Label>
                <Input
                  type="number"
                  value={winChance}
                  onChange={(e) => setWinChance(Number(e.target.value))}
                  min={0}
                  max={100}
                  className="bg-spdm-gray border-spdm-green/30"
                />
              </div>
              <Button
                onClick={handleRigUser}
                disabled={loading || !selectedUserForRig}
                className="bg-spdm-green hover:bg-spdm-darkGreen text-black"
              >
                Rig User
              </Button>

              <div className="mt-4">
                <h3 className="text-lg font-medium text-spdm-green mb-2">Rigged Users</h3>
                <div className="space-y-2">
                  {riggedUsers.map((riggedUser) => {
                    const user = users.find(u => u.id === riggedUser.user_id);
                    return (
                      <div key={riggedUser.user_id} className="flex justify-between items-center p-2 bg-spdm-gray rounded-md">
                        <span>{user?.username || 'Unknown User'}</span>
                        <span>{(riggedUser.win_chance * 100).toFixed(1)}% win chance</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Ban User Form */}
      <div className="space-y-4">
        <Label>Ban Duration (hours)</Label>
        <Input
          type="number"
          value={banDuration}
          onChange={(e) => setBanDuration(parseInt(e.target.value))}
          min={1}
          max={720}
          className="bg-spdm-gray border-spdm-green/30"
        />
        
        <Label>Ban Reason</Label>
        <Textarea
          value={banReason}
          onChange={(e) => setBanReason(e.target.value)}
          className="bg-spdm-gray border-spdm-green/30"
          placeholder="Enter reason for ban..."
        />
      </div>

      {/* Promo Code Manager - Owner Only */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <PromoCodeManager />
        </motion.div>
      )}
    </div>
  );
};

export default Admin;