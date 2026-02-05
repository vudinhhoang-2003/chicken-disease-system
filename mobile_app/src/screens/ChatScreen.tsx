import React, { useState, useRef, useEffect } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TextInput, 
  TouchableOpacity, KeyboardAvoidingView, Platform, 
  ActivityIndicator, SafeAreaView, StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Markdown from 'react-native-markdown-display';
import client from '../api/client';
import CustomHeader from '../components/CustomHeader';

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

const ChatScreen = ({ route }: any) => {
  const initialMessage = route.params?.initialMessage;
  const PRIMARY_GREEN = '#2e7d32';
  const LIGHT_GREEN = '#E8F5E9';

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

  useEffect(() => {
    if (initialMessage) {
      handleAutoSend(initialMessage);
    }
  }, [initialMessage]);

  const handleAutoSend = (msg: string) => {
    const userMsg: Message = { id: Date.now().toString(), text: msg, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    callApi(msg, [userMsg]); 
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text: inputText.trim(), sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    await callApi(userMsg.text, [...messages, userMsg]);
  };

  const callApi = async (msgText: string, history: Message[]) => {
    try {
      const response = await client.post('/chat/ask', {
        message: msgText,
        history: history.slice(-5).map(m => ({
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
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Xin lỗi, kết nối đang gặp gián đoạn. Bà con vui lòng kiểm tra lại mạng nhé!',
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
          <View style={[styles.aiAvatar, {backgroundColor: PRIMARY_GREEN}]}>
            <Icon name="robot-confused-outline" size={20} color="#fff" />
          </View>
        )}
        <View style={[styles.bubble, isUser ? [styles.userBubble, {backgroundColor: PRIMARY_GREEN}] : styles.aiBubble]}>
          {isUser ? (
            <Text style={styles.userText}>{item.text}</Text>
          ) : (
            <Markdown style={markdownStyles}>
              {item.text}
            </Markdown>
          )}
          <Text style={[styles.timeText, isUser ? { color: 'rgba(255,255,255,0.7)' } : { color: '#90A4AE' }]}>
            {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomHeader title="Trợ lý AI" subtitle="Tư vấn chăn nuôi 24/7" />
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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
            <View style={[styles.typingDot, {backgroundColor: PRIMARY_GREEN}]} />
            <Text style={styles.loadingText}>Bác sĩ AI đang trả lời...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập câu hỏi của bạn..."
            placeholderTextColor="#90A4AE"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendBtn, !inputText.trim() && styles.disabledBtn, inputText.trim() && {backgroundColor: PRIMARY_GREEN}]} 
            onPress={sendMessage}
            disabled={!inputText.trim() || loading}
          >
            <Icon name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const markdownStyles = StyleSheet.create({
  body: { color: '#37474F', fontSize: 15, lineHeight: 22 },
  strong: { fontWeight: 'bold', color: '#1B5E20' },
  em: { fontStyle: 'italic' },
  heading1: { fontSize: 18, fontWeight: 'bold', color: '#2e7d32', marginVertical: 8 },
  heading2: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32', marginVertical: 6 },
  bullet_list: { marginVertical: 5 },
  ordered_list: { marginVertical: 5 },
  paragraph: { marginVertical: 4 },
  link: { color: '#2e7d32', textDecorationLine: 'underline' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  listContent: { padding: 16, paddingBottom: 20 },
  messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  aiAvatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10, elevation: 2 },
  bubble: { maxWidth: '80%', padding: 14, borderRadius: 20, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2 },
  userBubble: { borderBottomRightRadius: 4, shadowOpacity: 0.2 },
  aiBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E8F5E9' },
  userText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  timeText: { fontSize: 10, marginTop: 6, alignSelf: 'flex-end' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 15 },
  typingDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8, opacity: 0.6 },
  loadingText: { fontSize: 12, color: '#78909C', fontStyle: 'italic' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#E8F5E9', paddingBottom: Platform.OS === 'ios' ? 25 : 12 },
  input: { flex: 1, backgroundColor: '#F1F8E9', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10, maxHeight: 100, fontSize: 15, color: '#263238', marginRight: 10 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', elevation: 2 },
  disabledBtn: { backgroundColor: '#CFD8DC', elevation: 0 }
});

export default ChatScreen;
