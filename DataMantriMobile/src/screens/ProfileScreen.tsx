import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function ProfileScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  
  const { user, logout } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const handleNotificationToggle = (value: boolean) => {
    setNotificationsEnabled(value);
    // Here you would typically save this preference to your backend
  };

  const handleDarkModeToggle = (value: boolean) => {
    setDarkModeEnabled(value);
    toggleTheme();
  };

  const ProfileItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showArrow = true,
    rightComponent 
  }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity
      style={[styles.profileItem, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.profileItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <Ionicons name={icon} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.profileItemText}>
          <Text style={[styles.profileItemTitle, { color: theme.colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.profileItemSubtitle, { color: theme.colors.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.profileItemRight}>
        {rightComponent || (showArrow && onPress && (
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
        ))}
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Profile Header */}
      <View style={[styles.profileHeader, { backgroundColor: theme.colors.surface }]}>
        <View style={[styles.avatarContainer, { backgroundColor: theme.colors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={[styles.userName, { color: theme.colors.text }]}>
          {user?.name || 'User'}
        </Text>
        <Text style={[styles.userEmail, { color: theme.colors.textSecondary }]}>
          {user?.email || 'user@example.com'}
        </Text>
        <View style={[styles.roleBadge, { backgroundColor: theme.colors.primary + '20' }]}>
          <Text style={[styles.roleText, { color: theme.colors.primary }]}>
            {user?.role || 'VIEWER'}
          </Text>
        </View>
      </View>

      {/* Account Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Account
        </Text>
        
        <ProfileItem
          icon="person-outline"
          title="Edit Profile"
          subtitle="Update your personal information"
          onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon!')}
        />
        
        <ProfileItem
          icon="key-outline"
          title="Change Password"
          subtitle="Update your account password"
          onPress={() => Alert.alert('Coming Soon', 'Password change will be available soon!')}
        />
        
        <ProfileItem
          icon="shield-checkmark-outline"
          title="Privacy & Security"
          subtitle="Manage your privacy settings"
          onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon!')}
        />
      </View>

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          App Settings
        </Text>
        
        <ProfileItem
          icon="notifications-outline"
          title="Notifications"
          subtitle="Push notifications and alerts"
          showArrow={false}
          rightComponent={
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={notificationsEnabled ? theme.colors.primary : theme.colors.textSecondary}
            />
          }
        />
        
        <ProfileItem
          icon="moon-outline"
          title="Dark Mode"
          subtitle="Switch between light and dark themes"
          showArrow={false}
          rightComponent={
            <Switch
              value={isDark}
              onValueChange={handleDarkModeToggle}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
              thumbColor={isDark ? theme.colors.primary : theme.colors.textSecondary}
            />
          }
        />
        
        <ProfileItem
          icon="language-outline"
          title="Language"
          subtitle="English"
          onPress={() => Alert.alert('Coming Soon', 'Language selection will be available soon!')}
        />
      </View>

      {/* Data & Storage */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Data & Storage
        </Text>
        
        <ProfileItem
          icon="download-outline"
          title="Export Data"
          subtitle="Download your dashboard data"
          onPress={() => Alert.alert('Coming Soon', 'Data export will be available soon!')}
        />
        
        <ProfileItem
          icon="cloud-outline"
          title="Sync Settings"
          subtitle="Manage cloud synchronization"
          onPress={() => Alert.alert('Coming Soon', 'Cloud sync settings will be available soon!')}
        />
        
        <ProfileItem
          icon="trash-outline"
          title="Clear Cache"
          subtitle="Free up storage space"
          onPress={() => Alert.alert('Cache Cleared', 'App cache has been cleared successfully!')}
        />
      </View>

      {/* Support */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Support
        </Text>
        
        <ProfileItem
          icon="help-circle-outline"
          title="Help Center"
          subtitle="Get help and support"
          onPress={() => Alert.alert('Coming Soon', 'Help center will be available soon!')}
        />
        
        <ProfileItem
          icon="chatbubble-outline"
          title="Contact Support"
          subtitle="Get in touch with our team"
          onPress={() => Alert.alert('Coming Soon', 'Contact support will be available soon!')}
        />
        
        <ProfileItem
          icon="star-outline"
          title="Rate App"
          subtitle="Rate us on the App Store"
          onPress={() => Alert.alert('Thank You!', 'Thank you for your feedback!')}
        />
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          About
        </Text>
        
        <ProfileItem
          icon="information-circle-outline"
          title="App Version"
          subtitle="1.0.0"
          showArrow={false}
        />
        
        <ProfileItem
          icon="document-text-outline"
          title="Terms of Service"
          onPress={() => Alert.alert('Coming Soon', 'Terms of service will be available soon!')}
        />
        
        <ProfileItem
          icon="shield-outline"
          title="Privacy Policy"
          onPress={() => Alert.alert('Coming Soon', 'Privacy policy will be available soon!')}
        />
      </View>

      {/* Logout Button */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: theme.colors.error }]}
        onPress={handleLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="white" />
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          DataMantri Mobile v1.0.0
        </Text>
        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
          Made with ❤️ for data-driven decisions
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingLeft: 4,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileItemText: {
    flex: 1,
  },
  profileItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  profileItemSubtitle: {
    fontSize: 14,
  },
  profileItemRight: {
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 40,
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 4,
  },
});
