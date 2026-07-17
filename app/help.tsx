import { useState } from 'react';
import { Alert, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/app-context';
import { useRouter } from 'expo-router';

export default function HelpScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [feedback, setFeedback] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const faqItems = [
    {
      question: 'How do I add expenses?',
      answer: 'Go to the Dashboard and tap the "+ Add Expense" button. You can enter the description and amount, and the app will automatically categorize it.'
    },
    {
      question: 'How do shared expenses work?',
      answer: 'Create a group, add members, and then add shared expenses. The app automatically calculates who owes what and provides settlement suggestions.'
    },
    {
      question: 'What are price suggestions?',
      answer: 'Based on historical purchase data, the app suggests realistic prices for grocery items in your area. The more data we have, the more accurate the suggestions.'
    },
    {
      question: 'How do I set up a budget?',
      answer: 'Go to Budget Settings to set your monthly income and budget categories. The app will track your spending against these limits.'
    },
    {
      question: 'Can I export my data?',
      answer: 'Yes! Go to Profile > Export Data to download all your expense data in CSV format.'
    }
  ];

  const handleSendFeedback = async () => {
    if (!feedback.trim()) {
      Alert.alert('Error', 'Please enter your feedback before sending.');
      return;
    }
    
    if (!user) {
      Alert.alert('Error', 'You must be logged in to send feedback.');
      return;
    }
    
    setSending(true);
    try {
      const result = await FeedbackService.submitFeedback({
        user_id: user.id,
        feedback: feedback.trim(),
        email: user.email,
      });

      if (result.success) {
        Alert.alert(
          'Feedback Sent',
          'Thank you for your feedback! We\'ll review it and get back to you if needed.',
          [{ text: 'OK', onPress: () => setFeedback('') }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to send feedback. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send feedback. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScrollView className="flex-1 px-5 py-6">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol size={24} name="chevron.right" color="#14b8a6" />
          </TouchableOpacity>
          <ThemedText className="text-text text-3xl font-bold">Help & Feedback</ThemedText>
          <View className="w-6" />
        </View>
        
        <View className="bg-surface rounded-2xl p-5 border border-border mb-5">
          <View className="mb-8">
            <View className="flex-row items-center mb-5">
              <IconSymbol size={20} name="questionmark.circle.fill" color="#10b981" />
              <ThemedText className="text-text text-lg font-bold ml-2">Frequently Asked Questions</ThemedText>
            </View>
            
            {faqItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                className="py-4 border-b border-border"
                onPress={() => toggleFAQ(index)}
              >
                <View className="flex-row justify-between items-center">
                  <ThemedText className="text-text text-base font-semibold flex-1">{item.question}</ThemedText>
                  <IconSymbol 
                    size={20} 
                    name="chevron.right" 
                    color="#64748b"
                    style={expandedFAQ === index ? { transform: [{ rotate: '90deg' }] } : undefined}
                  />
                </View>
                {expandedFAQ === index && (
                  <ThemedText className="text-text-secondary text-sm mt-4 leading-5">{item.answer}</ThemedText>
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          <View className="mb-8">
            <View className="flex-row items-center mb-5">
              <IconSymbol size={20} name="lightbulb.fill" color="#f59e0b" />
              <ThemedText className="text-text text-lg font-bold ml-2">Quick Tips</ThemedText>
            </View>
            
            <View className="flex-row items-start mb-5">
              <IconSymbol size={20} name="cart.fill" color="#ffffff" />
              <View className="ml-3 flex-1">
                <ThemedText className="text-text text-base font-semibold mb-1">Smart Shopping</ThemedText>
                <ThemedText className="text-text-secondary text-sm leading-5">
                  Use price suggestions to budget accurately and save money on groceries.
                </ThemedText>
              </View>
            </View>
            
            <View className="flex-row items-start mb-5">
              <IconSymbol size={20} name="person.2.fill" color="#ffffff" />
              <View className="ml-3 flex-1">
                <ThemedText className="text-text text-base font-semibold mb-1">Group Expenses</ThemedText>
                <ThemedText className="text-text-secondary text-sm leading-5">
                  Track shared expenses with roommates to avoid confusion about who owes what.
                </ThemedText>
              </View>
            </View>
            
            <View className="flex-row items-start mb-5">
              <IconSymbol size={20} name="chart.bar.fill" color="#ffffff" />
              <View className="ml-3 flex-1">
                <ThemedText className="text-text text-base font-semibold mb-1">Budget Tracking</ThemedText>
                <ThemedText className="text-text-secondary text-sm leading-5">
                  Set up budget alerts to stay on track with your monthly spending goals.
                </ThemedText>
              </View>
            </View>
          </View>
          
          <View className="mb-8">
            <View className="flex-row items-center mb-5">
              <IconSymbol size={20} name="mail.fill" color="#8b5cf6" />
              <ThemedText className="text-text text-lg font-bold ml-2">Contact Support</ThemedText>
            </View>
            
            <View className="flex-row items-center mb-4">
              <IconSymbol size={20} name="phone.fill" color="#ffffff" />
              <View className="ml-3">
                <ThemedText className="text-text text-base font-semibold mb-1">Phone Support</ThemedText>
                <ThemedText className="text-text-secondary text-sm">
                  +260 955 123 456 (Mon-Fri, 9AM-5PM)
                </ThemedText>
              </View>
            </View>
            
            <View className="flex-row items-center mb-4">
              <IconSymbol size={20} name="mail.fill" color="#ffffff" />
              <View className="ml-3">
                <ThemedText className="text-text text-base font-semibold mb-1">Email Support</ThemedText>
                <ThemedText className="text-text-secondary text-sm">
                  support@haushalt.app
                </ThemedText>
              </View>
            </View>
            
            <View className="flex-row items-center mb-4">
              <IconSymbol size={20} name="location.fill" color="#ffffff" />
              <View className="ml-3">
                <ThemedText className="text-text text-base font-semibold mb-1">Office Location</ThemedText>
                <ThemedText className="text-text-secondary text-sm">
                  Kitwe, Copperbelt Province
                </ThemedText>
              </View>
            </View>
          </View>
          
          <View className="mb-5">
            <View className="flex-row items-center mb-5">
              <IconSymbol size={20} name="chat.fill" color="#10b981" />
              <ThemedText className="text-text text-lg font-bold ml-2">Send Feedback</ThemedText>
            </View>
            
            <Input
              label="Your Feedback"
              placeholder="Tell us what you think..."
              value={feedback}
              onChangeText={setFeedback}
              multiline
              numberOfLines={4}
              containerClassName="mb-4"
            />
            
            <Button
              title={sending ? "Sending..." : "Send Feedback"}
              onPress={handleSendFeedback}
              size="large"
              className="w-full"
              disabled={sending || !feedback.trim()}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
