import { supabase } from '../supabase';
import { ExpenseService } from './expense-service';

// Define types locally to avoid circular dependencies
type Group = {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  status: 'active' | 'settled' | 'completed';
  created_at: string;
  updated_at: string;
};

type GroupInsert = {
  name: string;
  description?: string | null;
  created_by: string;
  status?: 'active' | 'settled' | 'completed';
};

type GroupUpdate = {
  name?: string;
  description?: string | null;
  status?: 'active' | 'settled' | 'completed';
};

type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
};

type GroupExpense = {
  id: string;
  group_id: string;
  expense_id: string;
  paid_by: string;
  split_between: string[];
  amount: number;
  description: string;
  date: string;
  created_at: string;
};

type Settlement = {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at: string | null;
};

export class GroupService {
  // Get all groups for a user
  static async getUserGroups(
    userId: string
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      // First, get group IDs where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('group_members')
        .select('group_id, role, joined_at')
        .eq('user_id', userId);

      if (memberError) {
        throw memberError;
      }

      if (!memberData || memberData.length === 0) {
        return { success: true, data: [] };
      }

      // Get the group IDs
      const groupIds = memberData.map(m => m.group_id);

      // Then fetch the groups by ID (avoids RLS recursion)
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false });

      if (groupsError) {
        throw groupsError;
      }

      // Merge member info with groups
      const data = groups?.map(group => {
        const memberInfo = memberData.find(m => m.group_id === group.id);
        return {
          ...group,
          role: memberInfo?.role || 'member',
          joined_at: memberInfo?.joined_at,
        };
      });

      return { success: true, data };
    } catch (error: any) {
      console.error('Get user groups error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get user groups' 
      };
    }
  }

  // Create a new group
  static async createGroup(
    groupData: GroupInsert,
    creatorId: string
  ): Promise<{ success: boolean; data?: Group; error?: string }> {
    try {
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert(groupData)
        .select()
        .single();

      if (groupError) {
        throw groupError;
      }

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: creatorId,
          role: 'admin',
        });

      if (memberError) {
        throw memberError;
      }

      return { success: true, data: group };
    } catch (error: any) {
      console.error('Create group error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to create group' 
      };
    }
  }

  // Get group details with members
  static async getGroupDetails(
    groupId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('groups')
        .select(`
          *,
          group_members(
            id,
            user_id,
            role,
            joined_at,
            user_profiles(
              full_name,
              email
            )
          ),
          group_expenses(
            id,
            amount,
            description,
            date,
            paid_by,
            split_between
          )
        `)
        .eq('id', groupId)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get group details error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get group details' 
      };
    }
  }

  // Add member to group
  static async addGroupMember(
    groupId: string, 
    userId: string, 
    role: 'admin' | 'member' = 'member'
  ): Promise<{ success: boolean; data?: GroupMember; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Add group member error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to add group member' 
      };
    }
  }

  // Add multiple members to group
  static async addGroupMembers(
    groupId: string, 
    userIds: string[], 
    role: 'admin' | 'member' = 'member'
  ): Promise<{ success: boolean; data?: GroupMember[]; error?: string }> {
    try {
      const members = userIds.map(userId => ({
        group_id: groupId,
        user_id: userId,
        role,
      }));

      const { data, error } = await supabase
        .from('group_members')
        .insert(members)
        .select();

      if (error) {
        throw error;
      }

      return { success: true, data: data as GroupMember[] };
    } catch (error: any) {
      console.error('Add group members error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to add group members' 
      };
    }
  }

  // Get group members with profile information
  static async getGroupMembersWithProfiles(
    groupId: string
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          *,
          user_profiles(
            id,
            user_id,
            full_name,
            email,
            student_id
          )
        `)
        .eq('group_id', groupId);

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get group members with profiles error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get group members' 
      };
    }
  }

  // Remove member from group
  static async removeGroupMember(
    groupId: string, 
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Remove group member error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to remove group member' 
      };
    }
  }

  // Add group expense
  static async addGroupExpense(
    expenseData: Omit<GroupExpense, 'id' | 'created_at'>
  ): Promise<{ success: boolean; data?: GroupExpense; error?: string }> {
    try {
      // Use the expense service to add the group expense and reflect it across all members
      const result = await ExpenseService.addGroupExpenseForAll(expenseData);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add group expense');
      }

      return { success: true, data: result.data?.groupExpense as GroupExpense };
    } catch (error: any) {
      console.error('Add group expense error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to add group expense' 
      };
    }
  }

  // Calculate group balances
  static async calculateGroupBalances(
    groupId: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const { data: expenses, error } = await supabase
        .from('group_expenses')
        .select('*')
        .eq('group_id', groupId);

      if (error) {
        throw error;
      }

      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', groupId);

      if (!members) {
        throw new Error('No members found');
      }

      // Calculate balances
      const balances: Record<string, number> = {};
      
      // Initialize all members with 0 balance
      members.forEach(member => {
        balances[member.user_id] = 0;
      });

      // Process expenses
      expenses?.forEach(expense => {
        const splitAmount = expense.amount / expense.split_between.length;
        
        // Add to paid by user (they paid this amount)
        balances[expense.paid_by] = (balances[expense.paid_by] || 0) + expense.amount;
        
        // Subtract from each person who owes
        expense.split_between.forEach((userId: string) => {
          balances[userId] = (balances[userId] || 0) - splitAmount;
        });
      });

      return { success: true, data: balances };
    } catch (error: any) {
      console.error('Calculate group balances error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to calculate group balances' 
      };
    }
  }

  // Create settlement
  static async createSettlement(
    settlementData: Omit<Settlement, 'id' | 'created_at' | 'completed_at'>
  ): Promise<{ success: boolean; data?: Settlement; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('settlements')
        .insert(settlementData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Create settlement error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to create settlement' 
      };
    }
  }

  // Get settlements for a user in a group
  static async getUserSettlements(
    userId: string, 
    groupId: string
  ): Promise<{ success: boolean; data?: Settlement[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('group_id', groupId)
        .or(`from_user.eq.${userId},to_user.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get user settlements error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get user settlements' 
      };
    }
  }

  // Get pending invites for a user
  static async getPendingInvites(
    userEmail: string
  ): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('group_invitations')
        .select('*, groups(name)')
        .eq('invited_email', userEmail)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Get pending invites error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to get pending invites' 
      };
    }
  }

  // Accept group invite
  static async acceptGroupInvite(
    inviteId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get invite details
      const { data: invite, error: inviteError } = await supabase
        .from('group_invitations')
        .select('*')
        .eq('id', inviteId)
        .single();

      if (inviteError || !invite) {
        throw new Error('Invite not found');
      }

      // Add user to group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: invite.group_id,
          user_id: userId,
          role: 'member',
        });

      if (memberError) {
        throw memberError;
      }

      // Update invite status
      const { error: updateError } = await supabase
        .from('group_invitations')
        .update({ status: 'accepted' })
        .eq('id', inviteId);

      if (updateError) {
        throw updateError;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Accept invite error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to accept invite' 
      };
    }
  }

  // Decline group invite
  static async declineGroupInvite(
    inviteId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('group_invitations')
        .update({ status: 'declined' })
        .eq('id', inviteId);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Decline invite error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to decline invite' 
      };
    }
  }

  // Invite member by email
  static async inviteMemberByEmail(
    groupId: string,
    invitedEmail: string,
    invitedBy: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Check if user exists with this email
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', invitedEmail)
        .single();

      if (profileError || !profile) {
        return {
          success: false,
          error: 'User with this email not found'
        };
      }

      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', profile.id)
        .single();

      if (existingMember) {
        return {
          success: false,
          error: 'User is already a member of this group'
        };
      }

      // Create invitation
      const { data, error } = await supabase
        .from('group_invitations')
        .insert({
          group_id: groupId,
          invited_email: invitedEmail,
          invited_user_id: profile.id,
          invited_by: invitedBy,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (error: any) {
      console.error('Invite member error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send invitation' 
      };
    }
  }

  // Subscribe to group changes
  static subscribeToGroup(
    groupId: string, 
    callback: (payload: any) => void
  ) {
    return supabase
      .channel(`group_${groupId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'groups',
          filter: `id=eq.${groupId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_members',
          filter: `group_id=eq.${groupId}`,
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'group_expenses',
          filter: `group_id=eq.${groupId}`,
        },
        callback
      )
      .subscribe();
  }
}
