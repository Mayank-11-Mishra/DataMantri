import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('login');

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    setIsLoggedIn(true);
    setCurrentScreen('dashboard');
  };

  const handleDemoLogin = () => {
    setIsLoggedIn(true);
    setCurrentScreen('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentScreen('login');
    setEmail('');
    setPassword('');
  };

  const renderLoginScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.loginContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>📊</Text>
          <Text style={styles.appName}>DataMantri</Text>
          <Text style={styles.tagline}>Your Data, Your Insights</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to access your dashboards</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.demoButton} onPress={handleDemoLogin}>
            <Text style={styles.demoButtonText}>Try Demo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  const renderDashboardScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Dashboards</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.dashboardContainer}>
        <View style={styles.dashboardCard}>
          <Text style={styles.dashboardTitle}>Sales Performance</Text>
          <Text style={styles.dashboardDescription}>Monthly sales metrics and KPIs</Text>
          <View style={styles.dashboardFooter}>
            <Text style={styles.chartCount}>8 charts</Text>
            <Text style={styles.lastUpdated}>Updated 2 hours ago</Text>
          </View>
        </View>

        <View style={styles.dashboardCard}>
          <Text style={styles.dashboardTitle}>Customer Analytics</Text>
          <Text style={styles.dashboardDescription}>Customer behavior and engagement insights</Text>
          <View style={styles.dashboardFooter}>
            <Text style={styles.chartCount}>6 charts</Text>
            <Text style={styles.lastUpdated}>Updated 1 day ago</Text>
          </View>
        </View>

        <View style={styles.dashboardCard}>
          <Text style={styles.dashboardTitle}>Inventory Management</Text>
          <Text style={styles.dashboardDescription}>Stock levels and supply chain metrics</Text>
          <View style={styles.dashboardFooter}>
            <Text style={styles.chartCount}>5 charts</Text>
            <Text style={styles.lastUpdated}>Updated 3 hours ago</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const renderChatbotScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('dashboard')}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Assistant</Text>
      </View>

      <ScrollView style={styles.chatContainer}>
        <View style={styles.chatMessage}>
          <Text style={styles.chatText}>
            Hi! I'm your DataMantri AI assistant. I can help you analyze your data and provide insights.
          </Text>
        </View>

        <View style={styles.chatMessage}>
          <Text style={styles.chatText}>
            Try asking me questions like:
            • What are the top 5 selling products this month?
            • Show me sales trends for the last quarter
            • Which region has the highest revenue?
          </Text>
        </View>

        <View style={styles.chatMessage}>
          <Text style={styles.chatText}>
            Here are your top 5 selling products this month:
            1. iPhone 15 Pro - $2,847,500 (23.4% of total sales)
            2. Samsung Galaxy S24 - $1,923,200 (15.8% of total sales)
            3. MacBook Pro M3 - $1,456,800 (12.0% of total sales)
            4. iPad Air - $1,234,600 (10.2% of total sales)
            5. AirPods Pro - $987,400 (8.1% of total sales)
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const renderMainScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>DataMantri Mobile</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'dashboard' && styles.activeTab]}
          onPress={() => setCurrentScreen('dashboard')}
        >
          <Text style={styles.tabText}>📊 Dashboards</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, currentScreen === 'chatbot' && styles.activeTab]}
          onPress={() => setCurrentScreen('chatbot')}
        >
          <Text style={styles.tabText}>🤖 AI Assistant</Text>
        </TouchableOpacity>
      </View>

      {currentScreen === 'dashboard' && renderDashboardScreen()}
      {currentScreen === 'chatbot' && renderChatbotScreen()}
    </SafeAreaView>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="auto" />
      {!isLoggedIn ? renderLoginScreen() : renderMainScreen()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 60,
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: '#6b7280',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#6b7280',
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: 'white',
  },
  loginButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#6b7280',
  },
  demoButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  backButton: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  dashboardContainer: {
    flex: 1,
    padding: 20,
  },
  dashboardCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  dashboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  dashboardDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 16,
  },
  dashboardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chartCount: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#6b7280',
  },
  chatContainer: {
    flex: 1,
    padding: 20,
  },
  chatMessage: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chatText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#1f2937',
  },
});