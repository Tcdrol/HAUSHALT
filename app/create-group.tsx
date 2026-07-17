import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/app-context';
import { GroupService } from '@/lib/services/group-service';
import { validateGroupData } from '@/utils/groupCalculations';

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [creating, setCreating] = useState(false);

  const addMember = () => {
    const email = memberEmail.trim().toLowerCase();
    if (email && !invitedEmails.includes(email)) {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email)) {
        setInvitedEmails([...invitedEmails, email]);
        setMemberEmail('');
      } else {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
      }
    }
  };

  const removeMember = (index: number) => {
    setInvitedEmails(invitedEmails.filter((_, i) => i !== index));
  };

  const createGroup = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a group');
      return;
    }

    const validation = validateGroupData(groupName, ['You', ...invitedEmails]);
    
    if (!validation.isValid) {
      Alert.alert('Error', validation.error || 'Please check your input');
      return;
    }

    setCreating(true);
    try {
      // Create the group in Supabase
      const groupResult = await GroupService.createGroup(
        {
          name: groupName,
          description: `Group created by ${user.email || 'user'}`,
          created_by: user.id,
        },
        user.id
      );

      if (!groupResult.success || !groupResult.data) {
        throw new Error(groupResult.error || 'Failed to create group');
      }

      const groupId = groupResult.data.id;

      // Add creator as admin member
      const memberResult = await GroupService.addGroupMember(
        groupId,
        user.id,
        'admin'
      );

      if (!memberResult.success) {
        console.warn('Warning: Could not add creator as member:', memberResult.error);
      }

      // Send invitations to all added emails
      let sentCount = 0;
      for (const email of invitedEmails) {
        const inviteResult = await GroupService.inviteMemberByEmail(
          groupId,
          email,
          user.id
        );
        if (inviteResult.success) {
          sentCount++;
        }
      }

      Alert.alert(
        'Success', 
        `Group "${groupName}" created!\nInvitations sent to ${sentCount} member(s).`,
        [
          { 
            text: 'OK', 
            onPress: () => router.push('/(tabs)/groups')
          }
        ]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to create group. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setCreating(false);
    }
  };

  const goBack = () => {
    router.push('/(tabs)/groups');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="px-5 pt-4 pb-6 flex-row items-center justify-between border-b border-border bg-surface">
        <ThemedText className="text-text text-xl font-bold">Create Group</ThemedText>
        <View className="w-6" />
      </View>
      
      <ScrollView className="flex-1 px-5 py-6">
        <View className="bg-surface rounded-2xl p-6 border border-border mb-6">
          <Input
            label="Group Name"
            placeholder="Enter group name"
            value={groupName}
            onChangeText={setGroupName}
            error={errors.groupName}
            containerClassName="mb-4"
          />
          
          <ThemedText className="text-text text-lg font-bold mb-4 mt-2">Invite Members by Email</ThemedText>
          
          <View className="mb-4">
            {/* Creator (You) */}
            <View className="flex-row items-center justify-between p-3 bg-background rounded-lg mb-2 border border-border">
              <View className="flex-row items-center flex-1">
                <IconSymbol size={20} name="person.fill" color="#14b8a6" />
                <ThemedText className="text-text text-base ml-2">You (Admin)</ThemedText>
              </View>
            </View>
            
            {/* Invited members */}
            {invitedEmails.map((email, index) => (
              <View key={index} className="flex-row items-center justify-between p-3 bg-background rounded-lg mb-2 border border-border">
                <View className="flex-row items-center flex-1">
                  <IconSymbol size={20} name="mail.fill" color="#f59e0b" />
                  <ThemedText className="text-text text-base ml-2">{email}</ThemedText>
                </View>
                <Button
                  title=""
                  onPress={() => removeMember(index)}
                  variant="ghost"
                  size="small"
                  icon={<IconSymbol size={20} name="xmark.circle.fill" color="#ef4444" />}
                />
              </View>
            ))}
          </View>
          
          <View className="flex-row items-end gap-2">
            <Input
              placeholder="Enter email address"
              value={memberEmail}
              onChangeText={setMemberEmail}
              onSubmitEditing={addMember}
              keyboardType="email-address"
              autoCapitalize="none"
              containerClassName="flex-1"
            />
            <Button
              title="Invite"
              onPress={addMember}
              variant="outline"
              size="small"
              className="mb-5"
            />
          </View>
        </View>
        
        <Button
          title={creating ? "Creating..." : "Create Group & Send Invites"}
          onPress={createGroup}
          size="large"
          className="w-full"
          disabled={!groupName.trim() || creating}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

