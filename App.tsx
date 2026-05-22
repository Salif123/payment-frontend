import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import CustomerPortal from './src/screens/CustomerPortal';
import AdminDashboard from './src/screens/AdminDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState<'customer' | 'admin'>('customer');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
      
      {/* Premium Top Navigation Bar */}
      <View style={styles.navBar}>
        <Text style={styles.appTitle}>iNav Loans</Text>
        
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'customer' ? styles.tabButtonActive : null,
            ]}
            onPress={() => setActiveTab('customer')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'customer' ? styles.tabTextActive : null,
              ]}
            >
              Customer Portal
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'admin' ? styles.tabButtonActive : null,
            ]}
            onPress={() => setActiveTab('admin')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'admin' ? styles.tabTextActive : null,
              ]}
            >
              Admin Dashboard
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Screen Render */}
      <View style={styles.screenContent}>
        {activeTab === 'customer' ? <CustomerPortal /> : <AdminDashboard />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  navBar: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#38bdf8',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 3,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#38bdf8',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#0f172a',
  },
  screenContent: {
    flex: 1,
    backgroundColor: '#f6f9fc',
  },
});
