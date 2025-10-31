import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Card } from '@/components/common';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/auth/hooks/useAuth';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDashboardStats, useRecentActivity } from '@/laundry/hooks/dashboard';

 type DashboardPageProps = { navigation: NativeStackNavigationProp<any> };

 export const DashboardPage: React.FC<DashboardPageProps> = ({ navigation }) => {
  // Obtener estadísticas reales del backend
  const { stats, isLoading: statsLoading } = useDashboardStats();
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
            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                <Card variant="elevated" padding="md">
                  <View className="items-center">
                    <Icon name="people-outline" size={32} color="#3B82F6" />
                    <Text className="text-2xl font-bold text-gray-900 mt-2">{stats.clients || 0}</Text>
                    <Text className="text-sm text-gray-500">Clientes</Text>
                  </View>
                </Card>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <Card variant="elevated" padding="md">
                  <View className="items-center">
                    <Icon name="document-text-outline" size={32} color="#F59E0B" />
                    <Text className="text-2xl font-bold text-gray-900 mt-2">{stats.guides || 0}</Text>
                    <Text className="text-sm text-gray-500">Guías</Text>
                  </View>
                </Card>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <Card variant="elevated" padding="md">
                  <View className="items-center">
                    <Icon name="shirt-outline" size={32} color="#10B981" />
                    <Text className="text-2xl font-bold text-gray-900 mt-2">{stats.garments || 0}</Text>
                    <Text className="text-sm text-gray-500">Prendas</Text>
                  </View>
                </Card>
              </View>
              <View className="w-1/2 px-2 mb-4">
                <Card variant="elevated" padding="md">
                  <View className="items-center">
                    <Icon name="construct-outline" size={32} color="#6366F1" />
                    <Text className="text-2xl font-bold text-gray-900 mt-2">{stats.processes || 0}</Text>
                    <Text className="text-sm text-gray-500">Procesos</Text>
                  </View>
                </Card>
              </View>
            </View>
          </View>


          <View className="mb-8">
            <Text className="text-xl font-bold text-gray-900 mb-3">Actividad Reciente</Text>
            {activitiesLoading ? (
              <View className="flex-1 items-center justify-center py-8">
                <ActivityIndicator size="large" color="#0b1f36" />
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
                {activities.map((item) => (
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
