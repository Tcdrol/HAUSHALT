import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { GroupService } from '@/lib/services/group-service';
import { cn } from '@/utils/cn';

export default function GroupsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadGroups();
      loadInvites();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadGroups = async () => {
    try {
      const result = await GroupService.getUserGroups(user.id);
      if (result.success && result.data) {
        setGroups(result.data);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([
        {
          id: '1',
          name: 'Diggers Lodge',
          members: '4 members • Active',
          balance: 'You owe K125',
          status: 'active',
        },
        {
          id: '2',
          name: 'CS Study Group',
          members: '3 members • Active',
          balance: 'All settled',
          status: 'settled',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadInvites = async () => {
    try {
      const result = await GroupService.getPendingInvites(user.email);
      if (result.success && result.data) {
        setInvites(result.data);
      }
    } catch (error) {
      console.error('Error loading invites:', error);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    const result = await GroupService.acceptGroupInvite(inviteId, user.id);
    if (result.success) {
      setInvites(invites.filter(i => i.id !== inviteId));
      loadGroups();
    } else {
      Alert.alert('Error', result.error || 'Failed to accept invite');
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    const result = await GroupService.declineGroupInvite(inviteId);
    if (result.success) {
      setInvites(invites.filter(i => i.id !== inviteId));
    }
  };

  const handleCreateGroup = () => {
    router.push('/create-group');
  };

  const handleViewGroup = (groupId: string) => {
    router.push(`/group-detail?id=${groupId}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-6">
        <View className="flex-row justify-between items-center">
          <View>
            <ThemedText className="text-text-muted text-sm uppercase tracking-wider">Expense Sharing</ThemedText>
            <ThemedText className="text-text text-2xl font-bold mt-1">Groups</ThemedText>
          </View>
          <View className="w-12 h-12 bg-surface rounded-full items-center justify-center border border-border">
            <IconSymbol size={24} name="person.2.fill" color="#94a3b8" />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Pending Invitations */}
        {invites.length > 0 && (
          <View className="px-5 mb-6">
            <ThemedText className="text-text-muted text-sm uppercase tracking-wider mb-3">Pending Invites</ThemedText>
            <View className="space-y-3">
              {invites.map((invite) => (
                <View key={invite.id} className="bg-surface rounded-2xl p-4 border border-warning/30">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <ThemedText className="text-text text-lg font-bold mb-1">{invite.group_name}</ThemedText>
                      <ThemedText className="text-text-secondary text-sm">
                        Invited by {invite.invited_by_name}
                      </ThemedText>
                    </View>
                    <View className="w-10 h-10 rounded-xl bg-warning/20 items-center justify-center">
                      <IconSymbol size={20} name="mail.fill" color="#f59e0b" />
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    <Button
                      title="Accept"
                      onPress={() => handleAcceptInvite(invite.id)}
                      size="small"
                      className="flex-1 bg-success"
                      textClassName="text-white"
                    />
                    <Button
                      title="Decline"
                      onPress={() => handleDeclineInvite(invite.id)}
                      variant="outline"
                      size="small"
                      className="flex-1"
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Create Group Button */}
        <View className="px-5 mb-6">
          <Button
            title="Create New Group"
            onPress={handleCreateGroup}
            size="large"
            className="bg-primary shadow-lg shadow-primary/30"
            textClassName="text-white"
            icon={<IconSymbol size={20} name="plus.circle.fill" color="#ffffff" />}
          />
        </View>

        {/* Groups List */}
        <View className="px-5">
          {loading ? (
            <View className="py-20 items-center">
              <ActivityIndicator size="large" color="#14b8a6" />
              <ThemedText className="text-text-secondary mt-4">Loading groups...</ThemedText>
            </View>
          ) : groups.length > 0 ? (
            <View className="space-y-4">
              {groups.map((group) => (
                <View
                  key={group.id}
                  className="bg-surface rounded-2xl p-5 border border-border"
                >
                  {/* Group Header */}
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-1">
                      <ThemedText className="text-text text-lg font-bold mb-1">{group.name}</ThemedText>
                      <ThemedText className="text-text-secondary text-sm">{group.members}</ThemedText>
                    </View>
                    <View
                      className={cn(
                        'w-10 h-10 rounded-xl items-center justify-center',
                        group.status === 'active' && 'bg-primary/20',
                        group.status === 'settled' && 'bg-success/20',
                        group.status === 'completed' && 'bg-surface-elevated'
                      )}
                    >
                      <IconSymbol
                        size={20}
                        name={group.status === 'active' ? 'person.2.fill' :
                              group.status === 'settled' ? 'checkmark.circle.fill' :
                              'clock.fill'}
                        color={group.status === 'active' ? '#14b8a6' :
                               group.status === 'settled' ? '#22c55e' : '#64748b'}
                      />
                    </View>
                  </View>

                  {/* Balance */}
                  <ThemedText
                    className={cn(
                      'text-base font-semibold mb-4',
                      group.status === 'active' && 'text-error',
                      group.status === 'settled' && 'text-success',
                      group.status === 'completed' && 'text-text-muted'
                    )}
                  >
                    {group.balance}
                  </ThemedText>

                  {/* Action Button */}
                  {group.status !== 'completed' && (
                    <Button
                      title="View Details"
                      onPress={() => handleViewGroup(group.id)}
                      variant="outline"
                      size="medium"
                      className="w-full"
                    />
                  )}
                </View>
              ))}
            </View>
          ) : (
            <View className="py-20 items-center">
              <View className="w-20 h-20 bg-surface-elevated rounded-full items-center justify-center mb-4">
                <IconSymbol size={36} name="person.2.fill" color="#64748b" />
              </View>
              <ThemedText className="text-text text-xl font-semibold mb-2">No Groups Yet</ThemedText>
              <ThemedText className="text-text-secondary text-center px-8 mb-6">
                Create a group to start sharing expenses with friends and family
              </ThemedText>
              <Button
                title="Create Your First Group"
                onPress={handleCreateGroup}
                variant="outline"
                size="medium"
              />
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

