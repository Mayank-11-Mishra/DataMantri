import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { GiftedChat, IMessage, Bubble, InputToolbar, Send } from 'react-native-gifted-chat';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface ChatMessage extends IMessage {
  isInsight?: boolean;
  chartData?: any;
}

export default function ChatbotScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    // Initialize with welcome message
    setMessages([
      {
        _id: 1,
        text: "Hi! I'm your DataMantri AI assistant. I can help you analyze your data and provide insights. Try asking me questions like:\n\n• What are the top 5 selling products this month?\n• Show me sales trends for the last quarter\n• Which region has the highest revenue?\n• Compare this month's performance with last month",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'DataMantri AI',
          avatar: '🤖',
        },
        isInsight: true,
      },
    ]);
  }, []);

  const onSend = async (newMessages: ChatMessage[] = []) => {
    setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));
    
    const userMessage = newMessages[0];
    setIsTyping(true);
    
    try {
      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const aiResponse = await generateAIResponse(userMessage.text);
      setMessages(previousMessages => 
        GiftedChat.append(previousMessages, [aiResponse])
      );
    } catch (error) {
      const errorMessage: ChatMessage = {
        _id: Math.random(),
        text: "I'm sorry, I encountered an error processing your request. Please try again.",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'DataMantri AI',
          avatar: '🤖',
        },
      };
      setMessages(previousMessages => 
        GiftedChat.append(previousMessages, [errorMessage])
      );
    } finally {
      setIsTyping(false);
    }
  };

  const generateAIResponse = async (userInput: string): Promise<ChatMessage> => {
    const input = userInput.toLowerCase();
    
    // Sales-related queries
    if (input.includes('top') && (input.includes('selling') || input.includes('product'))) {
      return {
        _id: Math.random(),
        text: "Here are your top 5 selling products this month:\n\n1. **iPhone 15 Pro** - $2,847,500 (23.4% of total sales)\n2. **Samsung Galaxy S24** - $1,923,200 (15.8% of total sales)\n3. **MacBook Pro M3** - $1,456,800 (12.0% of total sales)\n4. **iPad Air** - $1,234,600 (10.2% of total sales)\n5. **AirPods Pro** - $987,400 (8.1% of total sales)\n\n**Insight**: Mobile devices dominate your sales, accounting for 39.2% of total revenue. Consider increasing inventory for these high-performing products.",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'DataMantri AI',
          avatar: '🤖',
        },
        isInsight: true,
      };
    }
    
    // Sales trend queries
    if (input.includes('trend') || input.includes('quarter') || input.includes('month')) {
      return {
        _id: Math.random(),
        text: "📈 **Sales Trend Analysis - Last Quarter**\n\n**Q4 2023 Performance:**\n• Total Revenue: $12.1M (+15.3% vs Q3)\n• Units Sold: 8,456 (+12.7% vs Q3)\n• Average Order Value: $1,431 (+2.3% vs Q3)\n\n**Key Insights:**\n• December was your best month with $4.8M revenue\n• Mobile category grew 18.2% quarter-over-quarter\n• Customer acquisition increased by 23.1%\n\n**Recommendation**: Continue focusing on mobile products and consider expanding your mobile accessories line.",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'DataMantri AI',
          avatar: '🤖',
        },
        isInsight: true,
      };
    }
    
    // Regional analysis
    if (input.includes('region') || input.includes('location') || input.includes('area')) {
      return {
        _id: Math.random(),
        text: "🌍 **Regional Performance Analysis**\n\n**Top Performing Regions:**\n1. **West Coast** - $4.2M (34.7% of total)\n2. **Northeast** - $3.1M (25.6% of total)\n3. **Southeast** - $2.8M (23.1% of total)\n4. **Midwest** - $2.0M (16.5% of total)\n\n**Key Insights:**\n• West Coast shows highest growth potential (+22.1% YoY)\n• Northeast has highest average order value ($1,687)\n• Southeast market is underserved - expansion opportunity\n\n**Action Items:**\n• Increase marketing spend in Southeast\n• Consider opening new stores in high-performing regions",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'DataMantri AI',
          avatar: '🤖',
        },
        isInsight: true,
      };
    }
    
    // Comparison queries
    if (input.includes('compare') || input.includes('vs') || input.includes('versus')) {
      return {
        _id: Math.random(),
        text: "📊 **Month-over-Month Comparison**\n\n**This Month vs Last Month:**\n\n**Revenue:**\n• This Month: $3.2M\n• Last Month: $2.9M\n• Change: +$300K (+10.3%) ✅\n\n**Units Sold:**\n• This Month: 2,156\n• Last Month: 1,987\n• Change: +169 units (+8.5%) ✅\n\n**Customer Acquisition:**\n• This Month: 456 new customers\n• Last Month: 389 new customers\n• Change: +67 customers (+17.2%) ✅\n\n**Key Drivers:**\n• Holiday season boost\n• New product launches\n• Improved marketing campaigns\n\n**Recommendation**: Maintain current momentum with continued marketing investment.",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'DataMantri AI',
          avatar: '🤖',
        },
        isInsight: true,
      };
    }
    
    // Customer analysis
    if (input.includes('customer') || input.includes('user') || input.includes('client')) {
      return {
        _id: Math.random(),
        text: "👥 **Customer Analytics Overview**\n\n**Customer Metrics:**\n• Total Active Customers: 12,456\n• New Customers This Month: 456\n• Customer Retention Rate: 87.3%\n• Average Customer Lifetime Value: $2,847\n\n**Customer Segments:**\n• **Premium Customers** (Top 20%): $4.2M revenue\n• **Regular Customers** (Middle 60%): $3.8M revenue\n• **New Customers** (Bottom 20%): $1.1M revenue\n\n**Insights:**\n• Premium customers drive 45.8% of revenue\n• Customer satisfaction score: 4.6/5.0\n• Repeat purchase rate: 73.2%\n\n**Recommendations:**\n• Implement loyalty program for premium customers\n• Focus on converting new customers to regular buyers",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: 'DataMantri AI',
          avatar: '🤖',
        },
        isInsight: true,
      };
    }
    
    // Default response
    return {
      _id: Math.random(),
      text: "I understand you're asking about: \"" + userInput + "\"\n\nI can help you with:\n\n📊 **Sales Analysis**\n• Top performing products\n• Sales trends and forecasts\n• Revenue comparisons\n\n👥 **Customer Insights**\n• Customer behavior patterns\n• Segmentation analysis\n• Retention metrics\n\n🌍 **Regional Performance**\n• Geographic sales data\n• Market opportunities\n• Regional comparisons\n\n💡 **Business Intelligence**\n• KPI monitoring\n• Performance insights\n• Strategic recommendations\n\nCould you be more specific about what data you'd like to explore?",
      createdAt: new Date(),
      user: {
        _id: 2,
        name: 'DataMantri AI',
        avatar: '🤖',
      },
      isInsight: true,
    };
  };

  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: theme.colors.primary,
          },
          left: {
            backgroundColor: theme.colors.surface,
          },
        }}
        textStyle={{
          right: {
            color: 'white',
          },
          left: {
            color: theme.colors.text,
          },
        }}
      />
    );
  };

  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={[styles.inputToolbar, { backgroundColor: theme.colors.background }]}
        textInputStyle={[styles.textInput, { color: theme.colors.text }]}
      />
    );
  };

  const renderSend = (props: any) => {
    return (
      <Send {...props}>
        <View style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="send" size={20} color="white" />
        </View>
      </Send>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={[styles.typingContainer, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.typingText, { color: theme.colors.textSecondary }]}>
          DataMantri AI is typing...
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: 1,
          }}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderSend={renderSend}
          renderTypingIndicator={renderTypingIndicator}
          placeholder="Ask me about your data..."
          alwaysShowSend
          scrollToBottom
          infiniteScroll
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 5,
  },
  typingContainer: {
    padding: 10,
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
