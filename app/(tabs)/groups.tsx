import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useAuth } from '@/contexts/app-context';
import { GroupService } from '@/lib/services/group-service';

export default function GroupsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadGroups();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const result = await GroupService.getUserGroups(user.id);
      if (result.success && result.data) {
        setGroups(result.data);
      } else {
        console.error('Failed to load groups:', result.error);
        setGroups([]);
      }
    } catch (error) {
      console.error('Error loading groups:', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    router.push('/create-group');
  };

  const handleViewGroup = (groupId: string) => {
    router.push(`/group-detail?groupId=${groupId}`);
  };

  const getGroupMembers = (group: any) => {
    if (group.group_members && group.group_members.length > 0) {
      return `${group.group_members.length} member${group.group_members.length > 1 ? 's' : ''}`;
    }
    return 'No members';
  };

  return (
    <ScrollView style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>Groups</ThemedText>
        
        <Button
          title="+ Create New Group"
          onPress={handleCreateGroup}
          size="large"
          style={styles.createButton}
        />
        
        <View style={styles.spacer} />
        
        {loading ? (
          <View style={styles.loadingContainer}>
            <ThemedText style={styles.loadingText}>Loading groups...</ThemedText>
          </View>
        ) : (
          groups.length === 0 ? (
            <View style={styles.emptyContainer}>
              <IconSymbol size={48} name="person.2.fill" color="#666" />
              <ThemedText style={styles.emptyText}>No groups yet</ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Create a group to start sharing expenses
              </ThemedText>
            </View>
          ) : (
            groups.map((group) => (
              <Card key={group.id} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <View style={styles.groupInfo}>
                    <ThemedText style={styles.groupName}>{group.name}</ThemedText>
                    <ThemedText style={styles.groupMembers}>{getGroupMembers(group)}</ThemedText>
                    {group.description && (
                      <ThemedText style={styles.groupDescription}>{group.description}</ThemedText>
                    )}
                  </View>
                  <IconSymbol 
                    size={24} 
                    name="chevron.right" 
                    color="#0066CC" 
                  />
                </View>
                
                <Button
                  title="View Group"
                  onPress={() => handleViewGroup(group.id)}
                  variant="outline"
                  size="small"
                  style={styles.viewButton}
                />
              </Card>
            ))
          )
        )}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#FFFFFF',
  },
  createButton: {
    marginBottom: 30,
  },
  spacer: {
    height: 20,
  },
  groupCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#404040',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#FFFFFF',
  },
  groupMembers: {
    fontSize: 14,
    opacity: 0.8,
    color: '#FFFFFF',
    marginBottom: 5,
  },
  groupDescription: {
    fontSize: 13,
    opacity: 0.6,
    color: '#FFFFFF',
  },
  viewButton: {
    marginTop: 'auto',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#FFFFFF',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 10,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});
