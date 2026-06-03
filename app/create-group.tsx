import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/app-context';
import { GroupService } from '@/lib/services/group-service';
import { ProfileService } from '@/lib/services/profile-service';

interface SearchResult {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  student_id: string;
}

interface AddedMember {
  user_id: string;
  full_name: string;
  email: string;
}

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [addedMembers, setAddedMembers] = useState<AddedMember[]>([]);
  const [creating, setCreating] = useState(false);
  const [searching, setSearching] = useState(false);

  // Search for users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length >= 2 && user) {
        setSearching(true);
        const result = await ProfileService.searchUsers(searchQuery, user.id);
        if (result.success && result.data) {
          // Filter out already added members
          const filteredResults = result.data.filter(
            (result: SearchResult) => !addedMembers.find(m => m.user_id === result.user_id)
          );
          setSearchResults(filteredResults);
        } else {
          setSearchResults([]);
        }
        setSearching(false);
      } else {
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(searchUsers, 500); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery, user, addedMembers]);

  const addMember = (searchResult: SearchResult) => {
    if (!addedMembers.find(m => m.user_id === searchResult.user_id)) {
      setAddedMembers([...addedMembers, {
        user_id: searchResult.user_id,
        full_name: searchResult.full_name,
        email: searchResult.email,
      }]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeMember = (userId: string) => {
    setAddedMembers(addedMembers.filter(m => m.user_id !== userId));
  };

  const createGroup = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a group');
      return;
    }

    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (addedMembers.length === 0) {
      Alert.alert('Error', 'Please add at least one member to the group');
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

      // Add all members (creator is already added as admin in createGroup)
      const memberIds = addedMembers.map(m => m.user_id);
      if (memberIds.length > 0) {
        const membersResult = await GroupService.addGroupMembers(groupId, memberIds, 'member');
        if (!membersResult.success) {
          console.warn('Warning: Could not add all members:', membersResult.error);
        }
      }

      Alert.alert(
        'Success', 
        `Group "${groupName}" created successfully with ${addedMembers.length + 1} member(s)!`,
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Create Group</ThemedText>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Input
            label="Group Name"
            placeholder="Enter group name"
            value={groupName}
            onChangeText={setGroupName}
          />
          
          <ThemedText style={styles.sectionTitle}>Add Members</ThemedText>
          
          <Input
            placeholder="Search by email or name"
            value={searchQuery}
            onChangeText={setSearchQuery}
            containerStyle={styles.searchInput}
          />
          
          {searching && (
            <ThemedText style={styles.searchingText}>Searching...</ThemedText>
          )}
          
          {searchResults.length > 0 && (
            <View style={styles.searchResults}>
              <ThemedText style={styles.resultsTitle}>Search Results:</ThemedText>
              {searchResults.map((result) => (
                <TouchableOpacity
                  key={result.user_id}
                  style={styles.searchResultItem}
                  onPress={() => addMember(result)}
                >
                  <View style={styles.resultInfo}>
                    <IconSymbol size={20} name="person.2.fill" color="#0066CC" />
                    <View>
                      <ThemedText style={styles.resultName}>{result.full_name}</ThemedText>
                      <ThemedText style={styles.resultEmail}>{result.email}</ThemedText>
                    </View>
                  </View>
                  <IconSymbol size={20} name="plus.circle.fill" color="#10B981" />
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          <ThemedText style={styles.sectionTitle}>Added Members</ThemedText>
          
          <View style={styles.membersList}>
            <View style={styles.memberItem}>
              <View style={styles.memberInfo}>
                <IconSymbol size={20} name="person.fill" color="#0066CC" />
                <ThemedText style={styles.memberName}>{user?.email || 'You'} (Creator)</ThemedText>
              </View>
            </View>
            
            {addedMembers.map((member) => (
              <View key={member.user_id} style={styles.memberItem}>
                <View style={styles.memberInfo}>
                  <IconSymbol size={20} name="person.2.fill" color="#0066CC" />
                  <View>
                    <ThemedText style={styles.memberName}>{member.full_name}</ThemedText>
                    <ThemedText style={styles.memberEmail}>{member.email}</ThemedText>
                  </View>
                </View>
                <Button
                  title=""
                  onPress={() => removeMember(member.user_id)}
                  variant="ghost"
                  size="small"
                  icon={<IconSymbol size={16} name="xmark.circle.fill" color="#EF4444" />}
                />
              </View>
            ))}
            
            {addedMembers.length === 0 && (
              <ThemedText style={styles.noMembersText}>No members added yet</ThemedText>
            )}
          </View>
        </Card>
        
        <Button
          title={creating ? "Creating..." : "Create Group"}
          onPress={createGroup}
          size="large"
          style={styles.createButton}
          disabled={!groupName.trim() || creating}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#2A2A2A',
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    marginTop: 20,
    color: '#FFFFFF',
  },
  searchInput: {
    marginBottom: 10,
  },
  searchingText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
  },
  searchResults: {
    marginBottom: 15,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#FFFFFF',
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#404040',
  },
  resultInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    marginLeft: 8,
    color: '#FFFFFF',
  },
  resultEmail: {
    fontSize: 12,
    marginLeft: 8,
    color: '#888',
  },
  membersList: {
    marginBottom: 15,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#404040',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    marginLeft: 8,
    color: '#FFFFFF',
  },
  memberEmail: {
    fontSize: 12,
    marginLeft: 8,
    color: '#888',
  },
  noMembersText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    padding: 20,
  },
  createButton: {
    marginTop: 10,
  },
});
