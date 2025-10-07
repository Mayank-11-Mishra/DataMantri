import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { useTheme } from '../contexts/ThemeContext';
import { useRoute } from '@react-navigation/native';

const screenWidth = Dimensions.get('window').width;

interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'kpi';
  title: string;
  data: any;
}

export default function DashboardViewScreen() {
  const [dashboardData, setDashboardData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { theme } = useTheme();
  const route = useRoute();
  const { dashboardId } = route.params as { dashboardId: string };

  useEffect(() => {
    loadDashboardData();
  }, [dashboardId]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      // Mock data - replace with actual API call
      const mockData: ChartData[] = [
        {
          id: '1',
          type: 'kpi',
          title: 'Total Sales',
          data: {
            value: '$125,430',
            change: '+12.5%',
            trend: 'up',
          },
        },
        {
          id: '2',
          type: 'line',
          title: 'Sales Trend',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              data: [20, 45, 28, 80, 99, 43],
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            }],
          },
        },
        {
          id: '3',
          type: 'bar',
          title: 'Product Performance',
          data: {
            labels: ['Product A', 'Product B', 'Product C', 'Product D'],
            datasets: [{
              data: [20, 45, 28, 80],
            }],
          },
        },
        {
          id: '4',
          type: 'pie',
          title: 'Market Share',
          data: [
            { name: 'Mobile', population: 45, color: '#3B82F6', legendFontColor: '#7F7F7F', legendFontSize: 15 },
            { name: 'Desktop', population: 30, color: '#8B5CF6', legendFontColor: '#7F7F7F', legendFontSize: 15 },
            { name: 'Tablet', population: 25, color: '#10B981', legendFontColor: '#7F7F7F', legendFontSize: 15 },
          ],
        },
        {
          id: '5',
          type: 'kpi',
          title: 'Active Users',
          data: {
            value: '2,847',
            change: '+8.2%',
            trend: 'up',
          },
        },
      ];
      
      setDashboardData(mockData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const renderKPIChart = (chart: ChartData) => (
    <View key={chart.id} style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
        {chart.title}
      </Text>
      <View style={styles.kpiContainer}>
        <Text style={[styles.kpiValue, { color: theme.colors.text }]}>
          {chart.data.value}
        </Text>
        <View style={styles.kpiChangeContainer}>
          <Ionicons 
            name={chart.data.trend === 'up' ? 'trending-up' : 'trending-down'} 
            size={16} 
            color={chart.data.trend === 'up' ? theme.colors.success : theme.colors.error} 
          />
          <Text style={[
            styles.kpiChange, 
            { color: chart.data.trend === 'up' ? theme.colors.success : theme.colors.error }
          ]}>
            {chart.data.change}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderLineChart = (chart: ChartData) => (
    <View key={chart.id} style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
        {chart.title}
      </Text>
      <LineChart
        data={chart.data}
        width={screenWidth - 80}
        height={220}
        chartConfig={{
          backgroundColor: theme.colors.surface,
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          labelColor: (opacity = 1) => theme.colors.text,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '6',
            strokeWidth: '2',
            stroke: '#3B82F6',
          },
        }}
        bezier
        style={styles.chart}
      />
    </View>
  );

  const renderBarChart = (chart: ChartData) => (
    <View key={chart.id} style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
        {chart.title}
      </Text>
      <BarChart
        data={chart.data}
        width={screenWidth - 80}
        height={220}
        chartConfig={{
          backgroundColor: theme.colors.surface,
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
          labelColor: (opacity = 1) => theme.colors.text,
          style: {
            borderRadius: 16,
          },
        }}
        style={styles.chart}
      />
    </View>
  );

  const renderPieChart = (chart: ChartData) => (
    <View key={chart.id} style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.chartTitle, { color: theme.colors.text }]}>
        {chart.title}
      </Text>
      <PieChart
        data={chart.data}
        width={screenWidth - 80}
        height={220}
        chartConfig={{
          backgroundColor: theme.colors.surface,
          backgroundGradientFrom: theme.colors.surface,
          backgroundGradientTo: theme.colors.surface,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        style={styles.chart}
      />
    </View>
  );

  const renderChart = (chart: ChartData) => {
    switch (chart.type) {
      case 'kpi':
        return renderKPIChart(chart);
      case 'line':
        return renderLineChart(chart);
      case 'bar':
        return renderBarChart(chart);
      case 'pie':
        return renderPieChart(chart);
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="analytics" size={48} color={theme.colors.primary} />
        <Text style={[styles.loadingText, { color: theme.colors.text }]}>
          Loading Dashboard...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.dashboardTitle, { color: theme.colors.text }]}>
            Sales Performance
          </Text>
          <Text style={[styles.lastUpdated, { color: theme.colors.textSecondary }]}>
            Last updated: 2 hours ago
          </Text>
        </View>

        <View style={styles.chartsGrid}>
          {dashboardData.map(renderChart)}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.actionButtonText}>Refresh Data</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border }]}>
            <Ionicons name="share-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  lastUpdated: {
    fontSize: 14,
  },
  chartsGrid: {
    gap: 20,
  },
  chartContainer: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chart: {
    borderRadius: 16,
  },
  kpiContainer: {
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  kpiChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  kpiChange: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  actionButtonText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
});
