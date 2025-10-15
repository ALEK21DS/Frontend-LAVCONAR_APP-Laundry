import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Container, Card, LoadingSpinner, Button } from '@/components/common';
import { useAuth } from '@/auth/hooks/useAuth';
import { useTodayGuides } from '@/laundry/hooks/useGuides';
import Icon from 'react-native-vector-icons/Ionicons';
import { GUIDE_STATUS_LABELS, GUIDE_STATUS_COLORS } from '@/constants';
import { formatDateTime } from '@/helpers/formatters.helper';

type DashboardPageProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigation }) => {
  const { user, logout } = useAuth();
  const { guides, isLoading, refetch } = useTodayGuides();
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const stats = {
    total: guides.length,
    recolectadas: guides.filter(g => g.status === 'COLLECTED').length,
    enTransito: guides.filter(g => g.status === 'IN_TRANSIT').length,
    enProceso: guides.filter(g => g.status === 'IN_PROCESS').length,
    completadas: guides.filter(g => g.status === 'COMPLETED').length,
    entregadas: guides.filter(g => g.status === 'DELIVERED').length,
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Cargando dashboard..." />;
  }

  return (
    <Container safe>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-2">
            <View>
              <Text className="text-3xl font-bold text-gray-900">Dashboard</Text>
              <Text className="text-base text-gray-500 mt-1">
                Bienvenido, {user?.nombre || 'Usuario'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleLogout}
              className="bg-danger-DEFAULT/10 p-3 rounded-lg">
              <Icon name="log-out-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Resumen de Hoy</Text>
          <View className="flex-row flex-wrap -mx-2">
            <View className="w-1/2 px-2 mb-4">
              <Card variant="elevated" padding="md">
                <View className="items-center">
                  <Icon name="document-text-outline" size={32} color="#3B82F6" />
                  <Text className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</Text>
                  <Text className="text-sm text-gray-500">Total Guías</Text>
                </View>
              </Card>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <Card variant="elevated" padding="md">
                <View className="items-center">
                  <Icon name="cube-outline" size={32} color="#F59E0B" />
                  <Text className="text-2xl font-bold text-gray-900 mt-2">
                    {stats.recolectadas}
                  </Text>
                  <Text className="text-sm text-gray-500">Recolectadas</Text>
                </View>
              </Card>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <Card variant="elevated" padding="md">
                <View className="items-center">
                  <Icon name="sync-outline" size={32} color="#3B82F6" />
                  <Text className="text-2xl font-bold text-gray-900 mt-2">{stats.enProceso}</Text>
                  <Text className="text-sm text-gray-500">En Proceso</Text>
                </View>
              </Card>
            </View>

            <View className="w-1/2 px-2 mb-4">
              <Card variant="elevated" padding="md">
                <View className="items-center">
                  <Icon name="checkmark-circle-outline" size={32} color="#10B981" />
                  <Text className="text-2xl font-bold text-gray-900 mt-2">{stats.completadas}</Text>
                  <Text className="text-sm text-gray-500">Completadas</Text>
                </View>
              </Card>
            </View>
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Acciones Rápidas</Text>
          <View className="space-y-3">
            <Button
              title="Registrar Cliente"
              icon={<Icon name="person-add-outline" size={20} color="white" />}
              onPress={() => navigation.navigate('RegisterClient')}
              variant="primary"
              fullWidth
            />
            <Button
              title="Crear Guía"
              icon={<Icon name="add-circle-outline" size={20} color="white" />}
              onPress={() => navigation.navigate('CreateGuide')}
              variant="primary"
              fullWidth
            />
            <Button
              title="Escanear Prendas"
              icon={<Icon name="scan-outline" size={20} color="white" />}
              onPress={() => navigation.navigate('ScanClothes')}
              variant="secondary"
              fullWidth
            />
          </View>
        </View>

        <View className="mb-6">
          <Text className="text-lg font-bold text-gray-900 mb-3">Guías Recientes</Text>
          {guides.length === 0 ? (
            <Card variant="outlined">
              <View className="items-center py-8">
                <Icon name="document-outline" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 mt-2">No hay guías registradas hoy</Text>
              </View>
            </Card>
          ) : (
            guides.slice(0, 5).map(guide => (
              <Card key={guide.id} variant="outlined" className="mb-3">
                <View className="flex-row justify-between items-start">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-gray-900">{guide.guide_number}</Text>
                    <Text className="text-sm text-gray-600 mt-1">
                      {guide.client_name || 'Cliente'}
                    </Text>
                    <Text className="text-xs text-gray-400 mt-1">
                      {formatDateTime(guide.created_at)}
                    </Text>
                  </View>
                  <View
                    className="px-3 py-1 rounded-full"
                    style={{
                      backgroundColor: `${GUIDE_STATUS_COLORS[guide.status]}20`,
                    }}>
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: GUIDE_STATUS_COLORS[guide.status] }}>
                      {GUIDE_STATUS_LABELS[guide.status]}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm text-gray-600 mt-2">
                  {guide.total_garments || 0} prenda{(guide.total_garments || 0) !== 1 ? 's' : ''}
                </Text>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </Container>
  );
};
