import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, 
  TouchableOpacity, KeyboardAvoidingView, Platform, 
  ActivityIndicator, SafeAreaView
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Markdown from 'react-native-markdown-display';
import client from '../api/client';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Xin chào! Tôi là trợ lý ảo **ChickHealth**. Tôi có thể giúp gì cho bạn về kỹ thuật chăn nuôi và bệnh thú y?',
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);

    try {
      const response = await client.post('/chat/ask', {
        message: userMsg.text,
        history: messages.slice(-5).map(m => ({
          role: m.sender === 'user' ? 'user' : 'ai',
          content: m.text
        }))
      });

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.answer,
        sender: 'ai',
        timestamp: new Date(),
        usage: response.data.usage,
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, tôi đang gặp chút trục trặc kết nối. Bạn vui lòng thử lại sau nhé!',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.aiRow]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Icon name="robot" size={20} color="#fff" />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {isUser ? (
            <Text style={styles.userText}>{item.text}</Text>
          ) : (
            <Markdown style={markdownStyles}>
              {item.text}
            </Markdown>
          )}
          <Text style={[styles.timeText, isUser && { color: 'rgba(255,255,255,0.6)' }]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2e7d32" />
            <Text style={styles.loadingText}>ChickHealth đang suy nghĩ...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập câu hỏi của bạn..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && styles.disabledBtn]} 
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Icon name="send" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const markdownStyles = StyleSheet.create({
  body: { color: '#333', fontSize: 15, lineHeight: 22 },
  strong: { fontWeight: 'bold', color: '#000' },
  em: { fontStyle: 'italic' },
  heading1: { fontSize: 20, fontWeight: 'bold', color: '#2e7d32', marginVertical: 5 },
  heading2: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', marginVertical: 5 },
  bullet_list: { marginVertical: 5 },
  ordered_list: { marginVertical: 5 },
  paragraph: { marginVertical: 2 },
  link: { color: '#1e88e5', textDecorationLine: 'underline' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  listContent: { padding: 15, paddingBottom: 20 },
  messageRow: { flexDirection: 'row', marginBottom: 15, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#2e7d32',
    justifyContent: 'center', alignItems: 'center', marginRight: 8
  },
  bubble: {
    maxWidth: '85%', padding: 12, borderRadius: 18,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2,
  },
  userBubble: { backgroundColor: '#2e7d32', borderBottomRightRadius: 2 },
  aiBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 2 },
  userText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  timeText: { fontSize: 10, color: 'rgba(0,0,0,0.3)', marginTop: 4, alignSelf: 'flex-end' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10 },
  loadingText: { fontSize: 12, color: '#2e7d32', fontStyle: 'italic', marginLeft: 8 },
  inputContainer: {
    flexDirection: 'row', padding: 10, backgroundColor: '#fff',
    alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1, backgroundColor: '#f0f2f5', borderRadius: 25,
    paddingHorizontal: 15, paddingVertical: 8, maxHeight: 100,
    fontSize: 15, color: '#333',
  },
  sendBtn: {
    width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#2e7d32',
    justifyContent: 'center', alignItems: 'center', marginLeft: 10
  },
  disabledBtn: { backgroundColor: '#ccc' }
});

export default ChatScreen;
