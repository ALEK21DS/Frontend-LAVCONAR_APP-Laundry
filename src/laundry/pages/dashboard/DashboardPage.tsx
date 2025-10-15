import React from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Container, Card, LoadingSpinner, Button } from '@/components/common';
import { HeaderBar } from '@/components/layout/HeaderBar';
import { SideMenu } from '@/components/layout/SideMenu';
import { useAuth } from '@/auth/hooks/useAuth';
import { useTodayGuides } from '@/laundry/hooks/useGuides';
import Icon from 'react-native-vector-icons/Ionicons';
import { GUIDE_STATUS_COLORS } from '@/constants';
import { formatDateTime } from '@/helpers/formatters.helper';

type DashboardPageProps = {
  navigation: NativeStackNavigationProp<any>;
};

export const DashboardPage: React.FC<DashboardPageProps> = ({ navigation: _navigation }) => {
  const { logout } = useAuth();
  const { guides, isLoading, refetch } = useTodayGuides();
  const [refreshing, setRefreshing] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

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
    clientes: Array.from(
      new Set(guides.map(g => (g.client_id ? String(g.client_id) : g.client_name || '')))
    ).filter(Boolean).length,
    guias: guides.length,
    prendas: guides.reduce((sum, g) => sum + (g.total_garments || 0), 0),
    procesos: guides.filter(g => g.status === 'IN_PROCESS').length,
  };

  type ActivityType = 'CLIENT' | 'GUIDE' | 'PROCESS' | 'GARMENT';
  type ActivityItem = {
    id: string;
    type: ActivityType;
    title: string;
    subtitle: string;
    date: string; // ISO string
  };

  const activities: ActivityItem[] = React.useMemo(() => {
    const guideActivities: ActivityItem[] = guides.map(g => ({
      id: `guide-${g.id}`,
      type: 'GUIDE',
      title: `Guía ${g.guide_number}`,
      subtitle: g.client_name || 'Cliente',
      date: g.created_at || new Date().toISOString(),
    }));

    // Eventos demo adicionales en modo mock
    const extras: ActivityItem[] = guides.slice(0, 2).map((g, idx) => ({
      id: `client-${g.id}`,
      type: 'CLIENT',
      title: 'Cliente registrado',
      subtitle: g.client_name || 'Nuevo cliente',
      date: new Date(
        new Date(g.created_at || Date.now()).getTime() + (idx + 1) * 60000
      ).toISOString(),
    }));

    const processExtras: ActivityItem[] = guides.slice(0, 2).map((g, idx) => ({
      id: `process-${g.id}`,
      type: 'PROCESS',
      title: 'Proceso actualizado',
      subtitle: `Guía ${g.guide_number}`,
      date: new Date(
        new Date(g.created_at || Date.now()).getTime() + (idx + 3) * 60000
      ).toISOString(),
    }));

    const all = [...guideActivities, ...extras, ...processExtras];
    return all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [guides]);

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Cargando dashboard..." />;
  }

  return (
    <Container safe padding="none">
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setMenuOpen(true)}>
          <HeaderBar showThemeToggle={false} />
        </TouchableOpacity>
        <View className="px-4 pt-4">
          <View className="mb-6">
            <Text className="text-3xl font-bold text-black">Dashboard</Text>
            <Text className="text-base text-black mt-1">
              Monitoreo en tiempo real del sistema de lavandería
            </Text>
            <View className="h-4" />
            <View className="flex-row flex-wrap -mx-2">
              <View className="w-1/2 px-2 mb-4">
                <Card variant="elevated" padding="md">
                  <View className="items-center">
                    <Icon name="people-outline" size={32} color="#3B82F6" />
                    <Text className="text-2xl font-bold text-gray-900 mt-2">{stats.clientes}</Text>
                    <Text className="text-sm text-gray-500">Clientes</Text>
                  </View>
                </Card>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <Card variant="elevated" padding="md">
                  <View className="items-center">
                    <Icon name="document-text-outline" size={32} color="#F59E0B" />
                    <Text className="text-2xl font-bold text-gray-900 mt-2">{stats.guias}</Text>
                    <Text className="text-sm text-gray-500">Guías</Text>
                  </View>
                </Card>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <Card variant="elevated" padding="md">
                  <View className="items-center">
                    <Icon name="shirt-outline" size={32} color="#3B82F6" />
                    <Text className="text-2xl font-bold text-gray-900 mt-2">{stats.prendas}</Text>
                    <Text className="text-sm text-gray-500">Prendas</Text>
                  </View>
                </Card>
              </View>

              <View className="w-1/2 px-2 mb-4">
                <Card variant="elevated" padding="md">
                  <View className="items-center">
                    <Icon name="sync-outline" size={32} color="#10B981" />
                    <Text className="text-2xl font-bold text-gray-900 mt-2">{stats.procesos}</Text>
                    <Text className="text-sm text-gray-500">Procesos</Text>
                  </View>
                </Card>
              </View>
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">Acceso rápido</Text>
            <View className="space-y-3">
              <Button
                title="Escanear RFID"
                onPress={() => _navigation.navigate('ScanClothes' as never)}
                icon={<Icon name="scan-outline" size={20} color="#FFFFFF" />}
                variant="primary"
                fullWidth
                style={{ backgroundColor: '#1f4eed' }}
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-900 mb-3">Actividad Reciente</Text>
            {activities.length === 0 ? (
              <Card variant="outlined">
                <View className="items-center py-8">
                  <Icon name="time-outline" size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 mt-2">No hay actividad registrada hoy</Text>
                </View>
              </Card>
            ) : (
              activities.slice(0, 5).map(item => (
                <Card key={item.id} variant="outlined" className="mb-3">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-base font-bold text-gray-900">{item.title}</Text>
                      <Text className="text-sm text-gray-600 mt-1">{item.subtitle}</Text>
                      <Text className="text-xs text-gray-400 mt-1">
                        {formatDateTime(item.date)}
                      </Text>
                    </View>
                    {item.type === 'GUIDE' && (
                      <View
                        className="px-3 py-1 rounded-full"
                        style={{ backgroundColor: `${GUIDE_STATUS_COLORS.IN_PROCESS}20` }}>
                        <Text
                          className="text-xs font-semibold"
                          style={{ color: GUIDE_STATUS_COLORS.IN_PROCESS }}>
                          Guía
                        </Text>
                      </View>
                    )}
                  </View>
                </Card>
              ))
            )}
          </View>
        </View>
      </ScrollView>
      <SideMenu
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={route => _navigation.navigate(route as never)}
        onLogout={handleLogout}
      />
    </Container>
  );
};
