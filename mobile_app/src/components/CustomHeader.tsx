import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

interface CustomHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightComponent?: React.ReactNode;
  transparent?: boolean;
  lightContent?: boolean;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ 
  title, 
  subtitle, 
  showBack = true, 
  rightComponent,
  transparent = false,
  lightContent = false
}) => {
  const navigation = useNavigation();
  
  // Theme Sync with Web Admin
  const PRIMARY_GREEN = '#2e7d32';
  const textColor = lightContent ? '#FFFFFF' : '#1B5E20';
  const subTextColor = lightContent ? 'rgba(255,255,255,0.8)' : '#666';
  const iconColor = lightContent ? '#FFFFFF' : '#2e7d32';

  return (
    <View style={[
      styles.container, 
      transparent ? styles.transparent : styles.solid,
      { paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 10 : 0 }
    ]}>
      <StatusBar 
        barStyle={lightContent ? "light-content" : "dark-content"} 
        backgroundColor="transparent" 
        translucent={true} 
      />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.leftContainer}>
            {showBack && (
              <TouchableOpacity 
                onPress={() => navigation.goBack()} 
                style={styles.backButton}
                hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
              >
                <Icon name="arrow-left" size={28} color={iconColor} />
              </TouchableOpacity>
            )}
            
            <View style={[styles.textContainer, !showBack && { marginLeft: 0 }]}>
              <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
                {title}
              </Text>
              {subtitle && (
                <Text style={[styles.subtitle, { color: subTextColor }]} numberOfLines={1}>
                  {subtitle}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.rightContainer}>
            {rightComponent}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 100,
  },
  solid: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5E9',
  },
  transparent: {
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  safeArea: {
    width: '100%',
  },
  content: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  leftContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
    borderRadius: 20,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default CustomHeader;