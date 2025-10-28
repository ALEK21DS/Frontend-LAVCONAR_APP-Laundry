import React, { useState } from 'react';
import { View, Alert } from 'react-native';
import { Container } from '@/components/common';
import { HeaderBar } from './HeaderBar';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/auth/hooks/useAuth';
import { ProcessTypeModal } from '@/laundry/components/ProcessTypeModal';
import { GuideSelectionModal } from '@/laundry/components/GuideSelectionModal';
import { GuideStatusConfirmationModal } from '@/laundry/components/GuideStatusConfirmationModal';
import { ServiceTypeModal } from '@/laundry/components/ServiceTypeModal';
import { useUpdateRfidScan, useGetAllRfidScans } from '@/laundry/hooks/guides/rfid-scan';

interface MainLayoutProps {
  activeTab: 'Dashboard' | 'Clients' | 'ScanClothes' | 'Guides' | 'Processes';
  onNavigate: (route: MainLayoutProps['activeTab'], params?: any) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ activeTab, onNavigate, children }) => {
  const { logout } = useAuth();
  const [serviceTypeModalOpen, setServiceTypeModalOpen] = useState(false);
  const [processTypeModalOpen, setProcessTypeModalOpen] = useState(false);
  const [guideSelectionModalOpen, setGuideSelectionModalOpen] = useState(false);
  const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
  const [selectedProcessType, setSelectedProcessType] = useState<string>('');
  const [selectedServiceType, setSelectedServiceType] = useState<'industrial' | 'personal'>('industrial');
  const [selectedGuideForConfirmation, setSelectedGuideForConfirmation] = useState<any>(null);
  const [selectedRfidScan, setSelectedRfidScan] = useState<any>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const { updateRfidScanAsync } = useUpdateRfidScan();
  
  // Mapear el tipo de proceso al scan_type ANTERIOR (para filtrar guías)
  const getPreviousScanTypeForProcess = (processType: string): string => {
    const previousScanTypeMapping: Record<string, string> = {
      'RECEIVED': 'COLLECTION',           // Para "Entrega", buscar guías recién creadas (COLLECTION)
      'IN_PROCESS': 'COLLECTION',         // Para "Recepción en Almacén", buscar guías en COLLECTION
      'WASHING': 'WAREHOUSE_RECEPTION',   // Para "Pre-lavado", buscar guías en WAREHOUSE_RECEPTION
      'DRYING': 'PRE_WASH',               // Para "Post-lavado", buscar guías en PRE_WASH
      'PACKAGING': 'POST_WASH',           // Para "Post-secado", buscar guías en POST_WASH
      'SHIPPING': 'POST_WASH',            // Para "Embarque", buscar guías en POST_WASH
      'LOADING': 'POST_DRY',              // Para "Conteo Final", buscar guías en POST_DRY
      'DELIVERY': 'FINAL_COUNT',          // Para "Entrega", buscar guías en FINAL_COUNT
    };
    return previousScanTypeMapping[processType] || 'COLLECTION';
  };

  // Mapear el tipo de proceso al scan_type NUEVO (para actualizar)
  const getNewScanTypeFromProcess = (processType: string): string => {
    const scanTypeMapping: Record<string, string> = {
      'RECEIVED': 'COLLECTION',           // Entrega → Recibido
      'IN_PROCESS': 'WAREHOUSE_RECEPTION', // Recepción en Almacén → En Proceso
      'WASHING': 'PRE_WASH',              // Pre-lavado → Lavado
      'DRYING': 'POST_WASH',              // Post-lavado → Secado
      'PACKAGING': 'POST_DRY',            // Post-secado → Empaque
      'SHIPPING': 'POST_DRY',             // Post-secado → Embarque
      'LOADING': 'FINAL_COUNT',           // Conteo Final → Carga
      'DELIVERY': 'DELIVERY',             // Entrega → Entrega
    };
    return scanTypeMapping[processType] || 'COLLECTION';
  };
  
  // Obtener RFID scans filtrados por scan_type ANTERIOR
  const targetScanType = selectedProcessType ? getPreviousScanTypeForProcess(selectedProcessType) : undefined;
  const { rfidScans, isLoading: isLoadingScans, total } = useGetAllRfidScans({
    limit: 50,
    scan_type: targetScanType,
  });

  const handleNavigate = (route: MainLayoutProps['activeTab'], params?: any) => {
    onNavigate(route, params);
  };

  const handleServiceTypeSelect = (serviceType: 'industrial' | 'personal') => {
    setSelectedServiceType(serviceType);
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
    setGuideSelectionModalOpen(false);
    
    const rfidScan = rfidScans.find(scan => scan.id === rfidScanId);
    if (!rfidScan) return;
    
    // Guardar el RFID scan completo
    setSelectedRfidScan(rfidScan);
    
    // Obtener la información de la guía desde el RFID scan
    const guideId = rfidScan.guide_id;
    const guideNumber = rfidScan.guide_number;
    
    // Mostrar modal de confirmación de cambio de estado
    setSelectedGuideForConfirmation({
      id: guideId,
      guide_number: guideNumber || 'Sin número',
      status: rfidScan.scan_type || '',
    });
    setConfirmationModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    setIsUpdatingStatus(true);
    
    try {
      // Obtener el scan type NUEVO correspondiente al proceso seleccionado
      const newScanType = getNewScanTypeFromProcess(selectedProcessType);
      
      if (!selectedRfidScan) {
        throw new Error('No se encontró el escaneo RFID de la guía');
      }
      
      // Actualizar el scan_type del escaneo RFID
      // El backend sincronizará automáticamente el estado de la guía y las prendas
      await updateRfidScanAsync({
        id: selectedRfidScan.id,
        data: {
          guide_id: selectedRfidScan.guide_id,
          branch_offices_id: selectedRfidScan.branch_offices_id,
          scan_type: newScanType,
          scanned_quantity: selectedRfidScan.scanned_quantity,
          scanned_rfid_codes: selectedRfidScan.scanned_rfid_codes,
          unexpected_codes: selectedRfidScan.unexpected_codes,
          differences_detected: selectedRfidScan.differences_detected,
        }
      });
      
      // El hook useUpdateRfidScan ya invalida y recarga todas las listas automáticamente
      // Esperar un momento para que se complete la recarga
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsUpdatingStatus(false);
      setConfirmationModalOpen(false);
      
      // Volver a abrir el modal de selección de guías para ver los cambios
      setGuideSelectionModalOpen(true);
    } catch (error: any) {
      setIsUpdatingStatus(false);
      Alert.alert('Error', error.message || 'No se pudo actualizar el estado de la guía');
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
        guides={rfidScans.map((scan: any) => ({
          id: scan.id,
          guide_number: scan.guide_number || 'Sin número',
          client_name: scan.guide?.client_name || 'Sin cliente',
          total_garments: scan.scanned_quantity || 0,
          status: scan.scan_type,
          location: scan.location,
          created_at: scan.created_at,
        }))}
        serviceType={selectedServiceType}
        isLoading={isLoadingScans}
      />

      {/* Modal de Confirmación de Cambio de Estado */}
      <GuideStatusConfirmationModal
        visible={confirmationModalOpen}
        onClose={() => {
          setConfirmationModalOpen(false);
          setGuideSelectionModalOpen(true); // Volver al modal de selección
        }}
        onConfirm={handleConfirmStatusChange}
        guideNumber={selectedGuideForConfirmation?.guide_number || ''}
        currentStatus={selectedGuideForConfirmation?.status || ''}
        newStatus={getNewScanTypeFromProcess(selectedProcessType)}
        processType={selectedProcessType}
        isLoading={isUpdatingStatus}
      />
    </Container>
  );
};


