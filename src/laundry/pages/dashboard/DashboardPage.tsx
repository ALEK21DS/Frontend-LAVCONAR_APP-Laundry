import React from 'react';
import { View, Text, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { MainLayout } from '@/components/layout/MainLayout';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDashboardStats, useRecentActivity } from '@/laundry/hooks/dashboard';

type StatCardProps = {
  title: string;
  icon: string;
  value?: number | null;
  subtitle: string;
  isLoading: boolean;
};

const formatPercentage = (value?: number | null) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '--';
  }
  return `${Number(value).toFixed(1)}%`;
};

const StatCard: React.FC<StatCardProps> = ({ title, icon, value, subtitle, isLoading }) => (
  <Card variant="outlined" padding="lg" className="bg-white">
    <View className="flex-row items-start justify-between">
      <View className="flex-1 pr-3">
        <Text className="text-sm font-semibold text-gray-900">{title}</Text>
        <Text className="text-3xl font-bold text-gray-900 mt-1">
          {isLoading ? '--' : formatPercentage(value)}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">{subtitle}</Text>
      </View>
      <View className="w-12 h-12 rounded-full bg-[#8EB021]/15 items-center justify-center">
        <Icon name={icon as any} size={22} color="#8EB021" />
      </View>
    </View>
  </Card>
);

 type DashboardPageProps = { navigation: NativeStackNavigationProp<any> };

 export const DashboardPage: React.FC<DashboardPageProps> = ({ navigation }) => {
  // Obtener estadísticas reales del backend
  const { metrics, isLoading: metricsLoading } = useDashboardStats();
  const { data: activities = [], isLoading: activitiesLoading, refetch: refetchActivities } = useRecentActivity();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchActivities();
    setRefreshing(false);
  };

  return (
    <MainLayout 
      activeTab="Dashboard" 
      onNavigate={(route: string, params?: any) => {
        // @ts-ignore
        navigation.navigate(route, params);
      }}
    >
      <ScrollView className="flex-1" refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View className="px-4 pt-4">
          <View className="mb-6">
            <Text className="text-lg font-bold text-black">DASHBOARD</Text>
            <Text className="text-base text-black mt-1">Monitoreo en tiempo real del sistema de lavandería</Text>
            <View className="h-4" />
            <View className="space-y-3">
              <StatCard
                title="Incidentes Pendientes"
                icon="pulse-outline"
                value={metrics?.pendingIncidentsPercentage}
                isLoading={metricsLoading}
                subtitle={
                  metrics
                    ? `${metrics.pendingIncidents ?? 0} de ${metrics.totalIncidents ?? 0} totales`
                    : 'Sin datos'
                }
              />
              <StatCard
                title="Máquinas Operativas"
                icon="hardware-chip-outline"
                value={metrics?.operationalMachinesPercentage}
                isLoading={metricsLoading}
                subtitle={
                  metrics
                    ? `${metrics.operationalMachines ?? 0} Operativas | ${metrics.maintenanceMachines ?? 0} Mantenimiento`
                    : 'Sin datos'
                }
              />
              <StatCard
                title="Vehículos Disponibles"
                icon="car-outline"
                value={metrics?.availableVehiclesPercentage}
                isLoading={metricsLoading}
                subtitle={
                  metrics
                    ? `${metrics.availableVehicles ?? 0} Disponibles | ${metrics.inUseVehicles ?? 0} En Uso | ${metrics.maintenanceVehicles ?? 0} Mantenimiento`
                    : 'Sin datos'
                }
              />
            </View>
          </View>


          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-3">Actividad Reciente</Text>
            {activitiesLoading ? (
              <View className="flex-1 items-center justify-center py-8">
                <ActivityIndicator size="large" color="#8EB021" />
              </View>
            ) : activities.length === 0 ? (
              <Card variant="outlined" padding="lg">
                <View className="items-center py-4">
                  <Icon name="time-outline" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 mt-2">No hay actividad reciente</Text>
                </View>
              </Card>
            ) : (
              <View className="-mx-2 flex-row flex-wrap">
                {activities.map(item => (
                  <View key={item.id} className="w-full px-2 mb-3">
                    <Card variant="elevated" padding="md">
                      {/* Título con badge al lado */}
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-900 text-sm font-medium flex-1 mr-2">
                          {item.title}
                        </Text>
                        <View 
                          className="px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: `${item.actionColor}20` }}
                        >
                          <Text 
                            className="text-xs font-semibold"
                            style={{ color: item.actionColor }}
                          >
                            {item.actionLabel}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Fecha y hora */}
                      <Text className="text-gray-500 text-xs">
                        {item.description}
                      </Text>
                    </Card>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

    </MainLayout>
  );
 }
