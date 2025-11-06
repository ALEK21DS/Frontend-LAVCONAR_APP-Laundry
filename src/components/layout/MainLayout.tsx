import React, { useState, useMemo } from 'react';
import { View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Container } from '@/components/common';
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

interface MainLayoutProps {
  activeTab: 'Dashboard' | 'Clients' | 'ScanClothes' | 'Guides' | 'Processes' | 'Incidents';
  onNavigate: (route: MainLayoutProps['activeTab'], params?: any) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ activeTab, onNavigate, children }) => {
  const { logout } = useAuth();
  const { user } = useAuthStore();
  const { sucursales } = useBranchOffices();
  
  const branchOfficeId = user?.branch_office_id || user?.sucursalId || '';
  const currentBranch = sucursales.find(branch => branch.id === branchOfficeId);
  const branchOfficeName = currentBranch?.name || 'Sucursal no asignada';

  const [serviceTypeModalOpen, setServiceTypeModalOpen] = useState(false);
  const [processTypeModalOpen, setProcessTypeModalOpen] = useState(false);
  const [guideSelectionModalOpen, setGuideSelectionModalOpen] = useState(false);
  const [selectedProcessType, setSelectedProcessType] = useState<string>('');
  const [selectedServiceType, setSelectedServiceType] = useState<'industrial' | 'personal' | undefined>(undefined);
  const [selectedRfidScan, setSelectedRfidScan] = useState<any>(null);
  const [selectedGuideForProcess, setSelectedGuideForProcess] = useState<any>(null);
  const [washingProcessFormOpen, setWashingProcessFormOpen] = useState(false);

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

  // Procesos con escaneo opcional (preguntan si quieren escanear)
  const processesWithOptionalScan = ['WASHING', 'DRYING', 'IRONING', 'FOLDING'];
  
  // Procesos con escaneo obligatorio (abren escáner directamente)
  const processesWithRequiredScan = ['IN_PROCESS', 'PACKAGING', 'SHIPPING', 'LOADING', 'DELIVERED'];

  // Orden de procesos (de menor a mayor progreso)
  const getProcessOrder = (processType: string): number => {
    const order: Record<string, number> = {
      'COLLECTED': 1,
      'IN_PROCESS': 2,
      'WASHING': 3,
      'DRYING': 4,
      'IRONING': 5,
      'FOLDING': 6,
      'PACKAGING': 7,
      'SHIPPING': 7, // Mismo nivel que PACKAGING
      'LOADING': 8,
      'DELIVERED': 9,
    };
    return order[processType] || 0;
  };

  // Verificar si un proceso es anterior al actual (retroceso)
  const isProcessBackward = (currentScanType: string, newProcessType: string): boolean => {
    // Ahora scan_type es el mismo que el proceso (1:1 con el catálogo)
    const currentProcess = currentScanType; // Ya es el nombre del proceso
    const currentOrder = getProcessOrder(currentProcess);
    const newOrder = getProcessOrder(newProcessType);
    
    return newOrder < currentOrder;
  };
  
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
    limit: 50,
    guide_id: filteredGuideIds.length > 0 ? filteredGuideIds : [],
  });


  // Si no hay servicio seleccionado, no mostrar RFID scans
  const finalRfidScans = !targetServiceType ? [] : rfidScans;

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
    const rfidScan = finalRfidScans.find(scan => scan.id === rfidScanId);
    if (!rfidScan) return;
    
    // Verificar si el nuevo proceso es anterior al actual (retroceso)
    const currentScanType = rfidScan.scan_type || '';
    const isBackward = isProcessBackward(currentScanType, selectedProcessType);
    
    // Procesos con escaneo obligatorio: abrir escáner directamente
    if (processesWithRequiredScan.includes(selectedProcessType) && !isBackward) {
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
      onNavigate('ScanClothes', {
        mode: 'process',
        processType: selectedProcessType,
        guideId: rfidScan.guide_id,
        rfidScanId: rfidScan.id,
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
    if (processesWithOptionalScan.includes(selectedProcessType) && !isBackward) {
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
              onNavigate('ScanClothes', {
                mode: 'process',
                processType: selectedProcessType,
                guideId: rfidScan.guide_id,
                rfidScanId: rfidScan.id,
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
    
    // Si llegamos aquí, es un proceso que no requiere escaneo o hay retroceso
    if (isBackward) {
      // Mostrar advertencia de retroceso
      Alert.alert(
        'Advertencia',
        '¿Está seguro que desea retroceder el progreso de esta guía?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => {
              // Mantener el modal abierto
            },
          },
          {
            text: 'Continuar',
            onPress: () => {
              // Proceder directamente con el flujo del proceso seleccionado
              setGuideSelectionModalOpen(false);
              setSelectedRfidScan(rfidScan);
              
              // Verificar si el proceso requiere escaneo
              if (processesWithRequiredScan.includes(selectedProcessType)) {
                // Proceso con escaneo obligatorio: abrir escáner
                setSelectedGuideForProcess({
                  id: rfidScan.guide_id,
                  guide_number: rfidScan.guide?.guide_number || rfidScan.guide_number || 'Sin número',
                  rfidScanId: rfidScan.id,
                  rfidScan: rfidScan,
                  waitingForScan: true,
                });
                
                onNavigate('ScanClothes', {
                  mode: 'process',
                  processType: selectedProcessType,
                  guideId: rfidScan.guide_id,
                  rfidScanId: rfidScan.id,
                  initialRfids: rfidScan.scanned_rfid_codes || [],
                  isEditMode: true,
                  guideToEdit: {
                    id: rfidScan.guide_id,
                    guide_number: rfidScan.guide?.guide_number || rfidScan.guide_number,
                  },
                });
              } else if (processesWithOptionalScan.includes(selectedProcessType)) {
                // Proceso con escaneo opcional: preguntar
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
                        onNavigate('ScanClothes', {
                          mode: 'process',
                          processType: selectedProcessType,
                          guideId: rfidScan.guide_id,
                          rfidScanId: rfidScan.id,
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
              } else {
                // Proceso sin escaneo: abrir form directamente
                const newScanType = getNewScanTypeFromProcess(selectedProcessType);
                setSelectedGuideForProcess({
                  id: rfidScan.guide_id,
                  guide_number: rfidScan.guide?.guide_number || rfidScan.guide_number || 'Sin número',
                  rfidScanId: rfidScan.id,
                  rfidScan: rfidScan,
                  pendingScanTypeUpdate: newScanType,
                });
                setWashingProcessFormOpen(true);
              }
            },
          },
        ]
      );
    } else {
      // No hay retroceso y no es proceso con escaneo: abrir form directamente
      setGuideSelectionModalOpen(false);
      setSelectedRfidScan(rfidScan);
      
      const newScanType = getNewScanTypeFromProcess(selectedProcessType);
      setSelectedGuideForProcess({
        id: rfidScan.guide_id,
        guide_number: rfidScan.guide?.guide_number || rfidScan.guide_number || 'Sin número',
        rfidScanId: rfidScan.id,
        rfidScan: rfidScan,
        pendingScanTypeUpdate: newScanType,
      });
      setWashingProcessFormOpen(true);
    }
  };


  return (
    <Container safe padding="none">
      <HeaderBar showThemeToggle={false} onLogoutPress={logout} />
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
          // Ahora scan_type es el mismo que el proceso (1:1 con el catálogo)
          const processStatus = scan.scan_type;
          return ({
          id: scan.id,
          guide_number: scan.guide?.guide_number || scan.guide_number || 'Sin número',
          client_name: scan.guide?.client_name || scan.guide?.client?.name || 'Sin cliente',
          total_garments: scan.scanned_quantity || 0,
          status: processStatus,
          location: scan.location,
          created_at: scan.created_at,
        })})}
        serviceType={selectedServiceType}
        isLoading={isLoadingScans || isLoadingGuides}
      />

      {/* Modal de Form de Proceso (Lavado, Secado, Planchado, Doblado, etc.) */}
      {selectedGuideForProcess && (
        <WashingProcessForm
          visible={washingProcessFormOpen}
          guideId={selectedGuideForProcess.id}
          guideNumber={selectedGuideForProcess.guide_number}
          branchOfficeId={branchOfficeId}
          branchOfficeName={branchOfficeName}
          processType={selectedProcessType}
          rfidScanId={selectedGuideForProcess.rfidScanId}
          rfidScan={selectedGuideForProcess.rfidScan}
          pendingScanTypeUpdate={selectedGuideForProcess.pendingScanTypeUpdate}
          rfidScanUpdateData={selectedGuideForProcess.rfidScanUpdateData} // Datos del RFID scan actualizado desde ScanForm
          onSuccess={() => {
            setWashingProcessFormOpen(false);
            setSelectedGuideForProcess(null);
            setGuideSelectionModalOpen(true);
          }}
          onCancel={() => {
            setWashingProcessFormOpen(false);
            setSelectedGuideForProcess(null);
            setGuideSelectionModalOpen(true);
          }}
        />
      )}
    </Container>
  );
};


