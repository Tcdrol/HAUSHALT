import { useRouter } from 'expo-router';
import { Alert, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatCurrency, suggestSettlements } from '@/utils/groupCalculations';

export default function SettleUpScreen() {
  const router = useRouter();
  
  // Sample data - in real app, this would come from state/API
  const balances = [
    { userId: '1', userName: 'Christopher', amount: 125, isOwed: true },
    { userId: '2', userName: 'Niza', amount: 75, isOwed: true },
  ];

  const settlements = suggestSettlements(balances);

  const handleSettleUp = (from: string, to: string, amount: number) => {
    Alert.alert(
      'Confirm Settlement',
      `Pay ${formatCurrency(amount)} to ${to}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Pay Now', 
          onPress: () => {
            // Here you would integrate with payment system
            Alert.alert(
              'Success', 
              `Payment of ${formatCurrency(amount)} to ${to} initiated!`,
              [
                { 
                  text: 'OK', 
                  onPress: () => router.push('/(tabs)/groups')
                }
              ]
            );
          }
        }
      ]
    );
  };

  const goBack = () => {
    router.push('/(tabs)/groups');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="px-5 pt-4 pb-6 flex-row items-center justify-between border-b border-border bg-surface">
        <ThemedText className="text-text text-xl font-bold">Settle Up</ThemedText>
        <View className="w-6" />
      </View>
      
      <ScrollView className="flex-1 px-5 py-6">
        <View className="bg-surface rounded-2xl p-5 border border-border mb-5">
          <ThemedText className="text-text text-lg font-bold mb-4">Suggested Settlements</ThemedText>
          
          {settlements.length === 0 ? (
            <View className="items-center py-10">
              <IconSymbol size={48} name="checkmark.circle.fill" color="#10b981" />
              <ThemedText className="text-text text-lg font-semibold mt-4 text-center">All settled up!</ThemedText>
              <ThemedText className="text-text-secondary text-sm mt-1 text-center">No payments needed at this time.</ThemedText>
            </View>
          ) : (
            settlements.map((settlement, index) => (
              <View key={index} className="flex-row items-center justify-between p-4 bg-background rounded-lg mb-3 border border-border">
                <View className="flex-1">
                  <View className="flex-row items-center mb-1">
                    <IconSymbol size={20} name="arrow.up.circle.fill" color="#ef4444" />
                    <ThemedText className="text-text text-base ml-2">
                      {settlement.from} pays {settlement.to}
                    </ThemedText>
                  </View>
                  <ThemedText className="text-error text-base font-semibold">
                    {formatCurrency(settlement.amount)}
                  </ThemedText>
                </View>
                
                <Button
                  title={`Pay ${formatCurrency(settlement.amount)}`}
                  onPress={() => handleSettleUp(settlement.from, settlement.to, settlement.amount)}
                  size="small"
                  variant="outline"
                />
              </View>
            ))
          )}
        </View>
        
        <View className="bg-surface rounded-2xl p-5 border border-border mb-5">
          <ThemedText className="text-text text-lg font-bold mb-4">Balance Summary</ThemedText>
          
          {balances.map((balance, index) => (
            <View key={index} className="flex-row items-center justify-between p-4 bg-background rounded-lg mb-3 border border-border">
              <View className="flex-row items-center flex-1">
                <IconSymbol 
                  size={20} 
                  name={balance.isOwed ? "arrow.up.circle.fill" : "arrow.down.circle.fill"} 
                  color={balance.isOwed ? "#ef4444" : "#10b981"} 
                />
                <ThemedText className="text-text text-base ml-3">{balance.userName}</ThemedText>
              </View>
              <ThemedText className={`text-base font-semibold ${balance.isOwed ? 'text-error' : 'text-success'}`}>
                {balance.isOwed ? 'You owe' : 'You are owed'} {formatCurrency(balance.amount)}
              </ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
