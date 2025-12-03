import React, { useState, useMemo } from 'react';
import { View, Alert, Modal, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Container, Button } from '@/components/common';
import { HeaderBar } from './HeaderBar';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/auth/hooks/useAuth';
import { ProcessTypeModal } from '@/laundry/components/ProcessTypeModal';
import { GuideSelectionModal } from '@/laundry/components/GuideSelectionModal';
import { ServiceTypeModal } from '@/laundry/components/ServiceTypeModal';
import { useUpdateRfidScan, useGetAllRfidScans } from '@/laundry/hooks/guides/rfid-scan';
import { useGuides } from '@/laundry/hooks/guides/guide';
import { WashingProcessForm } from '@/laundry/pages/processes/ui/WashingProcessForm';
import { useAuthStore } from '@/auth/store/auth.store';
import { useBranchOffices } from '@/laundry/hooks/branch-offices';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { getPreferredBranchOfficeId, isSuperAdminUser } from '@/helpers/user.helper';
import { useCatalogValuesByType } from '@/laundry/hooks/catalogs';
import { NotificationsModal } from '@/components/notifications/NotificationsModal';
import { useGetUserAuthorizations } from '@/laundry/hooks/authorizations';
import { useNotificationsStore } from '@/laundry/store/notifications.store';
import type { AuthorizationRequest } from '@/laundry/interfaces/authorizations/authorization.interface';

interface MainLayoutProps {
  activeTab: 'Dashboard' | 'Clients' | 'ScanClothes' | 'Guides' | 'Processes' | 'Incidents';
  onNavigate: (route: MainLayoutProps['activeTab'], params?: any) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ activeTab, onNavigate, children }) => {
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const { sucursales } = useBranchOffices();
  const isSuperAdmin = isSuperAdminUser(user);
  
  const preferredBranchOfficeId = getPreferredBranchOfficeId(user);
  const branchOfficeId = preferredBranchOfficeId || '';
  const currentBranch = preferredBranchOfficeId
    ? sucursales.find(branch => branch.id === preferredBranchOfficeId)
    : undefined;
  const branchOfficeName = preferredBranchOfficeId
    ? currentBranch?.name || 'Sucursal no asignada'
    : isSuperAdmin
      ? 'Todas las sucursales'
      : 'Sucursal no asignada';
  const fullName = [user?.nombre, user?.apellido].filter(Boolean).join(' ').trim();
  const displayName = fullName || user?.username || 'Usuario';
  const userEmail = user?.email || 'Sin correo';
  // Obtener el rol del usuario tal como viene del backend (tomar el primer rol si hay varios)
  const userRole = user?.roles && user.roles.length > 0 
    ? user.roles[0]
    : 'Sin rol';

  const [serviceTypeModalOpen, setServiceTypeModalOpen] = useState(false);
  const [processTypeModalOpen, setProcessTypeModalOpen] = useState(false);
  const [guideSelectionModalOpen, setGuideSelectionModalOpen] = useState(false);
  const [selectedProcessType, setSelectedProcessType] = useState<string>('');
  const [selectedServiceType, setSelectedServiceType] = useState<'industrial' | 'personal' | undefined>(undefined);
  const [selectedRfidScan, setSelectedRfidScan] = useState<any>(null);
  const [selectedGuideForProcess, setSelectedGuideForProcess] = useState<any>(null);
  const [washingProcessFormOpen, setWashingProcessFormOpen] = useState(false);
  const [userInfoModalOpen, setUserInfoModalOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);

  // Sistema de notificaciones (solo para usuarios no SuperAdmin)
  const shouldShowNotifications = !isSuperAdmin;
  const { approvedAuthorizations, refetch: refetchAuthorizations } = useGetUserAuthorizations(shouldShowNotifications);
  const { getActiveNotifications } = useNotificationsStore();

  // Obtener notificaciones activas (filtradas por las que no han sido procesadas)
  const activeNotifications = shouldShowNotifications ? getActiveNotifications(approvedAuthorizations) : [];

  // Refetch notificaciones al navegar (solo si no es SuperAdmin)
  useFocusEffect(
    useCallback(() => {
      if (shouldShowNotifications) {
        refetchAuthorizations();
      }
    }, [refetchAuthorizations, shouldShowNotifications])
  );

  // Detectar cuando se regresa de ScanClothesPage y abrir form de proceso si corresponde
  useFocusEffect(
    useCallback(() => {
      // Si estamos esperando el escaneo y estamos en la pestaña Processes, abrir el form
      if (selectedGuideForProcess?.waitingForScan && activeTab === 'Processes') {
        // Usar setTimeout para asegurar que la navegación se complete primero
        setTimeout(async () => {
          if (selectedGuideForProcess) {
            // Intentar obtener los datos del RFID scan actualizado desde AsyncStorage
            // Estos datos se guardan en ScanClothesPage cuando se envía el ScanForm
            try {
              const rfidScanUpdateDataJson = await AsyncStorage.getItem('pendingRfidScanUpdate');
              if (rfidScanUpdateDataJson) {
                const rfidScanUpdateData = JSON.parse(rfidScanUpdateDataJson);
                // Limpiar el dato temporal
                await AsyncStorage.removeItem('pendingRfidScanUpdate');
                // Actualizar selectedGuideForProcess con los datos del RFID scan
                setSelectedGuideForProcess({
                  ...selectedGuideForProcess,
                  waitingForScan: false,
                  rfidScanUpdateData: rfidScanUpdateData, // Guardar los datos para actualizar después
                });
              } else {
                setSelectedGuideForProcess({ ...selectedGuideForProcess, waitingForScan: false });
              }
            } catch (error) {
              // Si hay error, simplemente continuar sin los datos
              setSelectedGuideForProcess({ ...selectedGuideForProcess, waitingForScan: false });
            }
            setWashingProcessFormOpen(true);
          }
        }, 300);
      }
    }, [selectedGuideForProcess?.waitingForScan, activeTab, selectedGuideForProcess])
  );
  
  const { updateRfidScanAsync } = useUpdateRfidScan();

  // Mapear el tipo de proceso al scan_type NUEVO (para actualizar)
  // Ahora los scan_type son los mismos nombres del catálogo
  const getNewScanTypeFromProcess = (processType: string): string => {
    // El scan_type es el mismo que el proceso (1:1 con el catálogo)
    return processType;
  };

  // Obtener procesos del catálogo para determinar si requieren escaneo obligatorio
  const { data: processCatalog, isLoading: isLoadingProcessCatalog } = useCatalogValuesByType('process_status', true, { forceFresh: true });
  
  // Procesos con escaneo opcional (preguntan si quieren escanear)
  // Estos son procesos que tradicionalmente permiten saltarse el escaneo
  const processesWithOptionalScan = ['WASHING', 'DRYING', 'IRONING', 'FOLDING'];
  
  // Función para determinar si un proceso requiere escaneo obligatorio
  // Basado en: 1) metadata del catálogo, 2) código conocido, 3) por defecto: obligatorio si no está en opcionales
  const isProcessRequiringScan = useCallback((processType: string | undefined | null): boolean => {
    if (!processType) return false;
    
    const normalizedType = processType.toUpperCase();
    
    // Si está en la lista de opcionales, no requiere escaneo obligatorio
    if (processesWithOptionalScan.includes(normalizedType)) {
      return false;
    }
    
    // Si el catálogo está cargando, asumir que requiere escaneo (por seguridad)
    if (isLoadingProcessCatalog) {
      return true;
    }
    
    // Verificar en el catálogo si tiene metadata que indique si requiere escaneo
    if (processCatalog?.data) {
      const catalogItem = processCatalog.data.find(
        item => item.code?.toUpperCase() === normalizedType && item.is_active !== false
      );
      
      if (catalogItem?.metadata) {
        // Si el catálogo tiene metadata con requires_scan, usarlo
        if (typeof catalogItem.metadata === 'object' && 'requires_scan' in catalogItem.metadata) {
          return catalogItem.metadata.requires_scan === true;
        }
      }
    }
    
    // Por defecto: si no está en opcionales, requiere escaneo obligatorio
    return true;
  }, [processCatalog, processesWithOptionalScan, isLoadingProcessCatalog]);
  
  // Mapear el tipo de servicio seleccionado al valor del backend
  const serviceTypeMap: Record<'industrial' | 'personal', 'INDUSTRIAL' | 'PERSONAL'> = {
    'industrial': 'INDUSTRIAL',
    'personal': 'PERSONAL',
  };
  
  const targetServiceType = selectedServiceType ? serviceTypeMap[selectedServiceType] : undefined;
  
  // Obtener guías filtradas por tipo de servicio
  const { guides: filteredGuides, isLoading: isLoadingGuides } = useGuides({
    page: 1,
    limit: 50, // Máximo permitido por el backend
    service_type: targetServiceType,
    branch_office_id: branchOfficeId || undefined,
    enabled: !!targetServiceType, // Solo ejecutar cuando hay servicio seleccionado
  });

  // Extraer los guide_ids de las guías filtradas
  const filteredGuideIds = useMemo(() => {
    if (!targetServiceType || isLoadingGuides) {
      return [];
    }
    return filteredGuides.map(g => g.id);
  }, [filteredGuides, targetServiceType, isLoadingGuides, selectedServiceType]);

  // Obtener RFID scans filtrados por guide_ids de las guías filtradas
  // IMPORTANTE: Si no hay guide_ids, pasar array vacío para que el hook devuelva array vacío
  const { rfidScans, isLoading: isLoadingScans, total } = useGetAllRfidScans({
    page: 1,
    limit: 50,
    guide_id: filteredGuideIds.length > 0 ? filteredGuideIds : [],
    branch_office_id: branchOfficeId || undefined,
  });

  // Si no hay servicio seleccionado, no mostrar RFID scans
  const finalRfidScans = !targetServiceType ? [] : rfidScans;

  const getGuideClientMeta = useCallback(
    (scan: any) => {
      const guideFromList = filteredGuides.find(g => g.id === scan.guide_id);
      const clientName =
        scan.guide?.client_name ||
        scan.guide?.client?.name ||
        guideFromList?.client_name ||
        guideFromList?.client?.name ||
        'Sin cliente';
      const clientAcronym =
        scan.guide?.client?.acronym ||
        guideFromList?.client_acronym ||
        guideFromList?.client?.acronym;
      const clientObj =
        scan.guide?.client ||
        (guideFromList
          ? {
              id: guideFromList.client_id,
              name: guideFromList.client_name,
              acronym: guideFromList.client_acronym,
            }
          : undefined);
      return { clientName, clientAcronym, clientObj };
    },
    [filteredGuides]
  );

  const handleNavigate = (route: MainLayoutProps['activeTab'], params?: any) => {
    onNavigate(route, params);
  };

  const handleServiceTypeSelect = (serviceType: 'industrial' | 'personal') => {
    setSelectedServiceType(serviceType);
    setSelectedProcessType(''); // Resetear proceso al cambiar servicio
    setServiceTypeModalOpen(false);
    setProcessTypeModalOpen(true);
  };

  const handleProcessTypeSelect = (processType: string) => {
    setSelectedProcessType(processType);
    setProcessTypeModalOpen(false);
    
    // Para todos los procesos, mostrar modal de selección de guías
    setGuideSelectionModalOpen(true);
  };

  const handleRfidScanSelect = (rfidScanId: string) => {
    // Verificar si es un guideId (de QR scan) o un rfidScanId
    let rfidScan = finalRfidScans.find(scan => scan.id === rfidScanId);
    
    // Si no se encuentra el rfidScan, verificar si es un guideId de un QR escaneado
    if (!rfidScan) {
      // Buscar si hay un rfidScan existente para este guideId
      rfidScan = finalRfidScans.find(scan => scan.guide_id === rfidScanId);
      
      if (!rfidScan) {
        // No hay rfidScan, es un guideId de QR scan sin rfidScan asociado
        // Buscar la guía en la lista de guías filtradas
        let guideFromQR = filteredGuides.find(g => g.id === rfidScanId);
        
        // Si no se encuentra en filteredGuides, es porque viene de un QR scan directo
        // En ese caso, usar el guideId directamente sin depender de los filtros
        if (!guideFromQR) {
          // Es un guideId de QR scan que no está en filteredGuides (puede estar fuera de los filtros)
          // Usar el guideId directamente para continuar
          const guideServiceType = selectedServiceType === 'personal' ? 'PERSONAL' : 'INDUSTRIAL';
          
          // Si el proceso requiere escaneo obligatorio, navegar al escáner
          if (isProcessRequiringScan(selectedProcessType)) {
            setGuideSelectionModalOpen(false);
            setSelectedGuideForProcess({
              id: rfidScanId,
              guide_number: 'Guía escaneada',
              waitingForScan: true,
            });
            onNavigate('ScanClothes', {
              mode: 'process',
              processType: selectedProcessType,
              guideId: rfidScanId,
              serviceType: guideServiceType === 'PERSONAL' ? 'personal' : 'industrial',
            });
            return;
          }
          
          // Para procesos sin rfidScan y sin escaneo obligatorio, mostrar el formulario directamente
          setGuideSelectionModalOpen(false);
          const newScanType = getNewScanTypeFromProcess(selectedProcessType);
          setSelectedGuideForProcess({
            id: rfidScanId,
            guide_number: 'Guía escaneada', // Se actualizará cuando se obtenga la guía
            pendingScanTypeUpdate: newScanType,
          });
          setWashingProcessFormOpen(true);
          return;
        }
        
        // Si se encontró en filteredGuides, usar esa guía
        const guideServiceType = guideFromQR.service_type || (selectedServiceType === 'personal' ? 'PERSONAL' : 'INDUSTRIAL');
        
        // Si el proceso requiere escaneo obligatorio, navegar al escáner
        if (isProcessRequiringScan(selectedProcessType)) {
          setGuideSelectionModalOpen(false);
          setSelectedGuideForProcess({
            id: guideFromQR.id,
            guide_number: guideFromQR.guide_number || 'Sin número',
            waitingForScan: true,
          });
          onNavigate('ScanClothes', {
            mode: 'process',
            processType: selectedProcessType,
            guideId: guideFromQR.id,
            serviceType: guideServiceType === 'PERSONAL' ? 'personal' : 'industrial',
          });
          return;
        }
        
        // Para procesos sin rfidScan y sin escaneo obligatorio, mostrar el formulario directamente
        setGuideSelectionModalOpen(false);
        const newScanType = getNewScanTypeFromProcess(selectedProcessType);
        setSelectedGuideForProcess({
          id: guideFromQR.id,
          guide_number: guideFromQR.guide_number || 'Sin número',
          pendingScanTypeUpdate: newScanType,
        });
        setWashingProcessFormOpen(true);
        return;
      }
      // Si se encontró un rfidScan por guide_id, continuar con la lógica normal usando ese rfidScan
    }
    
    // Verificar que rfidScan esté definido antes de continuar
    if (!rfidScan) {
      return; // No se encontró rfidScan, no continuar
    }
    
    // Procesos con escaneo obligatorio: abrir escáner directamente
    if (isProcessRequiringScan(selectedProcessType)) {
      setGuideSelectionModalOpen(false);
      setSelectedRfidScan(rfidScan);
      setSelectedGuideForProcess({
        id: rfidScan.guide_id,
        guide_number: rfidScan.guide?.guide_number || rfidScan.guide_number || 'Sin número',
        rfidScanId: rfidScan.id,
        rfidScan: rfidScan,
        waitingForScan: true,
      });
      
      // Navegar directamente al escáner
      // Obtener serviceType de la guía o usar el seleccionado
      const guideServiceType = rfidScan.guide?.service_type || (selectedServiceType === 'personal' ? 'PERSONAL' : 'INDUSTRIAL');
      onNavigate('ScanClothes', {
        mode: 'process',
        processType: selectedProcessType,
        guideId: rfidScan.guide_id,
        rfidScanId: rfidScan.id,
        serviceType: guideServiceType === 'PERSONAL' ? 'personal' : 'industrial',
        initialRfids: rfidScan.scanned_rfid_codes || [],
        isEditMode: true,
        guideToEdit: {
          id: rfidScan.guide_id,
          guide_number: rfidScan.guide?.guide_number || rfidScan.guide_number,
        },
      });
      return;
    }
    
    // Procesos con escaneo opcional: mostrar pregunta
    if (processesWithOptionalScan.includes(selectedProcessType)) {
      setGuideSelectionModalOpen(false);
      setSelectedRfidScan(rfidScan);
      setSelectedGuideForProcess({
        id: rfidScan.guide_id,
        guide_number: rfidScan.guide?.guide_number || rfidScan.guide_number || 'Sin número',
        rfidScanId: rfidScan.id,
        rfidScan: rfidScan,
      });
      
      Alert.alert(
        'Escaneo de Prendas',
        '¿Quiere escanear las prendas?',
        [
          {
            text: 'No',
            style: 'cancel',
            onPress: () => {
              // NO actualizar scan_type aquí, se hará al enviar el form de proceso
              // Guardar información para actualizar después
              const newScanType = getNewScanTypeFromProcess(selectedProcessType);
              setSelectedGuideForProcess({
                id: rfidScan.guide_id,
                guide_number: rfidScan.guide?.guide_number || rfidScan.guide_number || 'Sin número',
                rfidScanId: rfidScan.id,
                rfidScan: rfidScan,
                pendingScanTypeUpdate: newScanType, // Guardar el nuevo scan_type para actualizar después
              });
              setWashingProcessFormOpen(true);
            },
          },
          {
            text: 'Sí',
            onPress: () => {
              // Guardar estado para abrir form después del escaneo
              setSelectedGuideForProcess({
                id: rfidScan.guide_id,
                guide_number: rfidScan.guide?.guide_number || rfidScan.guide_number || 'Sin número',
                rfidScanId: rfidScan.id,
                rfidScan: rfidScan,
                waitingForScan: true, // Marcar que estamos esperando el escaneo
              });
              // Navegar al escáner
              // Obtener serviceType de la guía o usar el seleccionado
              const guideServiceTypeForOptional = rfidScan.guide?.service_type || (selectedServiceType === 'personal' ? 'PERSONAL' : 'INDUSTRIAL');
              onNavigate('ScanClothes', {
                mode: 'process',
                processType: selectedProcessType,
                guideId: rfidScan.guide_id,
                rfidScanId: rfidScan.id,
                serviceType: guideServiceTypeForOptional === 'PERSONAL' ? 'personal' : 'industrial',
                initialRfids: rfidScan.scanned_rfid_codes || [],
                isEditMode: true,
                guideToEdit: {
                  id: rfidScan.guide_id,
                  guide_number: rfidScan.guide?.guide_number || rfidScan.guide_number,
                },
              });
            },
          },
        ]
      );
      return;
    }
    
    // Proceso nuevo/desconocido: preguntar si quiere escanear (comportamiento por defecto)
    setGuideSelectionModalOpen(false);
    setSelectedRfidScan(rfidScan);
    setSelectedGuideForProcess({
      id: rfidScan.guide_id,
      guide_number: rfidScan.guide?.guide_number || rfidScan.guide_number || 'Sin número',
      rfidScanId: rfidScan.id,
      rfidScan: rfidScan,
    });
    
    Alert.alert(
      'Escaneo de Prendas',
      '¿Quiere escanear las prendas?',
      [
        {
          text: 'No',
          style: 'cancel',
          onPress: () => {
            const newScanType = getNewScanTypeFromProcess(selectedProcessType);
            setSelectedGuideForProcess({
              id: rfidScan.guide_id,
              guide_number: rfidScan.guide?.guide_number || rfidScan.guide_number || 'Sin número',
              rfidScanId: rfidScan.id,
              rfidScan: rfidScan,
              pendingScanTypeUpdate: newScanType,
            });
            setWashingProcessFormOpen(true);
          },
        },
        {
          text: 'Sí',
          onPress: () => {
            setSelectedGuideForProcess({
              id: rfidScan.guide_id,
              guide_number: rfidScan.guide?.guide_number || rfidScan.guide_number || 'Sin número',
              rfidScanId: rfidScan.id,
              rfidScan: rfidScan,
              waitingForScan: true,
            });
            const guideServiceTypeDefault = rfidScan.guide?.service_type || (selectedServiceType === 'personal' ? 'PERSONAL' : 'INDUSTRIAL');
            onNavigate('ScanClothes', {
              mode: 'process',
              processType: selectedProcessType,
              guideId: rfidScan.guide_id,
              rfidScanId: rfidScan.id,
              serviceType: guideServiceTypeDefault === 'PERSONAL' ? 'personal' : 'industrial',
              initialRfids: rfidScan.scanned_rfid_codes || [],
              isEditMode: true,
              guideToEdit: {
                id: rfidScan.guide_id,
                guide_number: rfidScan.guide?.guide_number || rfidScan.guide_number,
              },
            });
          },
        },
      ]
    );
  };


  // Manejar cuando se presiona una notificación
  const handleNotificationPress = (notification: AuthorizationRequest) => {
    // Navegar a la pantalla correspondiente con los parámetros de la notificación
    if (notification.entity_type === 'clients') {
      onNavigate('Clients', {
        openEntityId: notification.entity_id,
        authorizationId: notification.id,
        actionType: notification.action_type,
      });
    } else if (notification.entity_type === 'guides') {
      onNavigate('Guides', {
        openEntityId: notification.entity_id,
        authorizationId: notification.id,
        actionType: notification.action_type,
      });
    }
  };

  return (
    <Container safe padding="none">
      <HeaderBar
        showThemeToggle={false}
        onUserPress={() => setUserInfoModalOpen(true)}
        onNotificationsPress={shouldShowNotifications ? () => setNotificationsModalOpen(true) : undefined}
        notificationsCount={shouldShowNotifications ? activeNotifications.length : 0}
      />
      <View className="flex-1">{children}</View>
      <BottomNav 
        active={activeTab} 
        onNavigate={handleNavigate} 
        onOpenProcessTypeModal={() => setServiceTypeModalOpen(true)}
      />

      {/* Modal de Selección de Tipo de Servicio */}
      <ServiceTypeModal
        visible={serviceTypeModalOpen}
        onClose={() => setServiceTypeModalOpen(false)}
        onSelectService={handleServiceTypeSelect}
        title="Seleccionar Tipo de Servicio"
      />
      
      {/* Modal de Selección de Tipo de Proceso */}
      <ProcessTypeModal
        visible={processTypeModalOpen}
        onClose={() => setProcessTypeModalOpen(false)}
        onSelectProcess={handleProcessTypeSelect}
        serviceType={selectedServiceType}
      />

      {/* Modal de Selección de RFID Scans */}
      <GuideSelectionModal
        visible={guideSelectionModalOpen}
        onClose={() => setGuideSelectionModalOpen(false)}
        onSelectGuide={handleRfidScanSelect}
        processType={selectedProcessType}
        guides={finalRfidScans.map((scan: any) => {
          const processStatus = scan.scan_type;
          const { clientName, clientAcronym, clientObj } = getGuideClientMeta(scan);
          return ({
            id: scan.id,
            guide_number: scan.guide?.guide_number || scan.guide_number || 'Sin número',
            client_name: clientName,
            client_acronym: clientAcronym,
            client: clientObj,
            total_garments: scan.scanned_quantity || 0,
            status: processStatus,
            location: scan.location,
            created_at: scan.created_at,
          });
        })}
        serviceType={selectedServiceType}
        isLoading={isLoadingScans || isLoadingGuides}
      />

      {/* Modal de Form de Proceso (Lavado, Secado, Planchado, Doblado, etc.) */}
      {selectedGuideForProcess && (() => {
        // Obtener la sucursal de la guía (prioridad: guide.branch_office_id > rfidScan.branch_offices_id > branchOfficeId del usuario)
        const guideBranchOfficeId = selectedGuideForProcess.rfidScan?.guide?.branch_office_id 
          || selectedGuideForProcess.rfidScan?.branch_offices_id 
          || selectedGuideForProcess.guide?.branch_office_id
          || branchOfficeId;
        const guideBranch = sucursales.find(branch => branch.id === guideBranchOfficeId);
        const guideBranchOfficeName = guideBranch?.name || branchOfficeName;
        
        return (
          <WashingProcessForm
            visible={washingProcessFormOpen}
            guideId={selectedGuideForProcess.id}
            guideNumber={selectedGuideForProcess.guide_number}
            branchOfficeId={guideBranchOfficeId}
            branchOfficeName={guideBranchOfficeName}
          processType={selectedProcessType}
          rfidScanId={selectedGuideForProcess.rfidScanId}
          rfidScan={selectedGuideForProcess.rfidScan}
          pendingScanTypeUpdate={selectedGuideForProcess.pendingScanTypeUpdate}
          rfidScanUpdateData={selectedGuideForProcess.rfidScanUpdateData} // Datos del RFID scan actualizado desde ScanForm
          onSuccess={() => {
            setWashingProcessFormOpen(false);
            setGuideSelectionModalOpen(false);
            setSelectedGuideForProcess(null);
            setSelectedProcessType('');
          }}
          onCancel={() => {
            setWashingProcessFormOpen(false);
            setSelectedGuideForProcess(null);
            setGuideSelectionModalOpen(true);
          }}
          />
        );
      })()}

      <Modal
        visible={userInfoModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setUserInfoModalOpen(false)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="w-full bg-white rounded-3xl overflow-hidden shadow-2xl">
            <View className="bg-[#0b1f36] px-5 py-6">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-white/20 items-center justify-center mr-3">
                    <IonIcon name="person-outline" size={28} color="#ffffff" />
                  </View>
                  <View>
                    <Text className="text-white text-2xl font-bold">{displayName}</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setUserInfoModalOpen(false)}>
                  <IonIcon name="close" size={22} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </View>

            <View className="px-5 py-4 bg-gray-50">
              <View className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
                <View className="px-4 py-4">
                  <Text className="text-xs uppercase text-gray-500 mb-1">Correo</Text>
                  <Text className="text-base text-gray-900 font-semibold">{userEmail}</Text>
                </View>
                <View className="px-4 py-4">
                  <Text className="text-xs uppercase text-gray-500 mb-1">Rol</Text>
                  <Text className="text-base text-gray-900 font-semibold">{userRole}</Text>
                </View>
                <View className="px-4 py-4">
                  <Text className="text-xs uppercase text-gray-500 mb-1">Sucursal</Text>
                  <Text className="text-base text-gray-900 font-semibold">{branchOfficeName}</Text>
                </View>
              </View>

              {/* Botón de Cerrar Sesión */}
              <View className="mt-4">
                <Button
                  title="Cerrar Sesión"
                  onPress={() => {
                    setUserInfoModalOpen(false);
                    Alert.alert(
                      'Cerrar Sesión',
                      '¿Estás seguro de que deseas cerrar sesión?',
                      [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Cerrar Sesión', style: 'destructive', onPress: logout },
                      ]
                    );
                  }}
                  variant="danger"
                  icon={<IonIcon name="log-out-outline" size={18} color="white" />}
                  fullWidth
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Notificaciones (solo para no SuperAdmin) */}
      {shouldShowNotifications && (
        <NotificationsModal
          visible={notificationsModalOpen}
          onClose={() => setNotificationsModalOpen(false)}
          onNotificationPress={handleNotificationPress}
        />
      )}
    </Container>
  );
};


