import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

interface Dashboard {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
  chartCount: number;
  isPublic: boolean;
  thumbnail?: string;
}

export default function DashboardListScreen() {
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { theme } = useTheme();
  const navigation = useNavigation();

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    try {
      setIsLoading(true);
      // Mock data - replace with actual API call
      const mockDashboards: Dashboard[] = [
        {
          id: '1',
          name: 'Sales Performance',
          description: 'Monthly sales metrics and KPIs',
          lastUpdated: '2024-01-15',
          chartCount: 8,
          isPublic: true,
        },
        {
          id: '2',
          name: 'Customer Analytics',
          description: 'Customer behavior and engagement insights',
          lastUpdated: '2024-01-14',
          chartCount: 6,
          isPublic: false,
        },
        {
          id: '3',
          name: 'Inventory Management',
          description: 'Stock levels and supply chain metrics',
          lastUpdated: '2024-01-13',
          chartCount: 5,
          isPublic: true,
        },
        {
          id: '4',
          name: 'Financial Overview',
          description: 'Revenue, expenses, and profitability',
          lastUpdated: '2024-01-12',
          chartCount: 7,
          isPublic: false,
        },
        {
          id: '5',
          name: 'Marketing Campaigns',
          description: 'Campaign performance and ROI analysis',
          lastUpdated: '2024-01-11',
          chartCount: 4,
          isPublic: true,
        },
      ];
      
      setDashboards(mockDashboards);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboards');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboards();
    setRefreshing(false);
  };

  const renderDashboardItem = ({ item }: { item: Dashboard }) => (
    <TouchableOpacity
      style={[styles.dashboardCard, { backgroundColor: theme.colors.surface }]}
      onPress={() => navigation.navigate('DashboardView', { dashboardId: item.id })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={[styles.dashboardName, { color: theme.colors.text }]}>
            {item.name}
          </Text>
          {item.isPublic && (
            <View style={[styles.publicBadge, { backgroundColor: theme.colors.success }]}>
              <Text style={styles.publicBadgeText}>Public</Text>
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
      </View>
      
      <Text style={[styles.dashboardDescription, { color: theme.colors.textSecondary }]}>
        {item.description}
      </Text>
      
      <View style={styles.cardFooter}>
        <View style={styles.metricContainer}>
          <Ionicons name="bar-chart-outline" size={16} color={theme.colors.primary} />
          <Text style={[styles.metricText, { color: theme.colors.textSecondary }]}>
            {item.chartCount} charts
          </Text>
        </View>
        <View style={styles.metricContainer}>
          <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.metricText, { color: theme.colors.textSecondary }]}>
            {formatDate(item.lastUpdated)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="grid-outline" size={64} color={theme.colors.textSecondary} />
      <Text style={[styles.emptyStateTitle, { color: theme.colors.text }]}>
        No Dashboards Yet
      </Text>
      <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
        Your dashboards will appear here once they're created
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          My Dashboards
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {dashboards.length} dashboard{dashboards.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={dashboards}
        renderItem={renderDashboardItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  dashboardCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  publicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  publicBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  dashboardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    marginLeft: 4,
    fontSize: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
});
