import React, { useState } from 'react';
import { View } from 'react-native';
import { Container } from '@/components/common';
import { HeaderBar } from './HeaderBar';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/auth/hooks/useAuth';
import { ProcessTypeModal } from '@/laundry/components/ProcessTypeModal';
import { GuideSelectionModal } from '@/laundry/components/GuideSelectionModal';
import { GuideStatusConfirmationModal } from '@/laundry/components/GuideStatusConfirmationModal';
import { ServiceTypeModal } from '@/laundry/components/ServiceTypeModal';
import { useGuides } from '@/laundry/hooks/guides';

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
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Mapear el tipo de proceso al estado de guía que debe mostrar
  const getTargetStatusByProcessType = (processType: string, serviceType: 'industrial' | 'personal'): string => {
    if (serviceType === 'personal') {
      const personalMapping: Record<string, string> = {
        'IN_PROCESS': 'SENT',           // EN PROCESO muestra guías ENVIADAS
        'WASHING': 'IN_PROCESS',        // LAVADO muestra guías EN PROCESO
        'DRYING': 'WASHING',            // SECADO muestra guías LAVADAS
        'IRONING': 'DRYING',            // PLANCHADO muestra guías SECAS
        'FOLDING': 'IRONING',           // DOBLADO muestra guías PLANCHADAS
        'PACKAGING': 'FOLDING',         // EMPAQUE muestra guías DOBLADAS
        'LOADING': 'PACKAGING',         // CARGA muestra guías EMPACADAS
        'DELIVERY': 'LOADING',          // ENTREGA muestra guías CARGADAS
      };
      return personalMapping[processType] || processType;
    } else {
      const industrialMapping: Record<string, string> = {
        'IN_PROCESS': 'COLLECTED',      // EN PROCESO muestra guías RECOLECTADAS
        'WASHING': 'IN_PROCESS',        // LAVADO muestra guías EN PROCESO
        'DRYING': 'WASHING',            // SECADO muestra guías LAVADAS
        'PACKAGING': 'DRYING',          // EMPAQUE muestra guías SECAS
        'LOADING': 'PACKAGING',         // CARGA muestra guías EMPACADAS
        'DELIVERY': 'LOADING',          // ENTREGA muestra guías CARGADAS
      };
      return industrialMapping[processType] || processType;
    }
  };
  
  // Obtener guías filtradas por servicio y estado
  const targetStatus = selectedProcessType ? getTargetStatusByProcessType(selectedProcessType, selectedServiceType) : undefined;
  const { guides: guidesForProcess, isLoading: isLoadingGuides } = useGuides({
    limit: 50,
    status: targetStatus,
    service_type: selectedServiceType === 'personal' ? 'PERSONAL' : 'INDUSTRIAL',
    enabled: guideSelectionModalOpen, // Solo cargar cuando el modal está abierto
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

  const handleGuideSelect = (guideId: string) => {
    setGuideSelectionModalOpen(false);
    
    // Para LAVADO, SECADO, PLANCHADO, DOBLADO y EMBARQUE, mostrar modal de confirmación
    if (selectedProcessType === 'WASHING' || selectedProcessType === 'DRYING' || selectedProcessType === 'IRONING' || selectedProcessType === 'FOLDING' || selectedProcessType === 'SHIPPING') {
      const selectedGuide = guidesForProcess.find(g => g.id === guideId);
      
      // Obtener el estado actual correcto según el mapeo
      const getCurrentStatus = () => {
        if (selectedServiceType === 'personal') {
          const personalMapping: Record<string, string> = {
            'WASHING': 'IN_PROCESS',
            'DRYING': 'WASHING',
            'IRONING': 'DRYING',
            'FOLDING': 'IRONING',
            'SHIPPING': 'PACKAGING',
          };
          return personalMapping[selectedProcessType] || selectedGuide?.status;
        } else {
          const industrialMapping: Record<string, string> = {
            'WASHING': 'IN_PROCESS',
            'DRYING': 'WASHING',
            'SHIPPING': 'PACKAGING',
          };
          return industrialMapping[selectedProcessType] || selectedGuide?.status;
        }
      };
      
      const currentStatus = getCurrentStatus();
      
      setSelectedGuideForConfirmation({ ...selectedGuide, id: guideId, status: currentStatus });
      setConfirmationModalOpen(true);
    } 
    // Para EMPAQUE, CARGA y ENTREGA, ir al escáner primero (con validación)
    else if (selectedProcessType === 'PACKAGING' || selectedProcessType === 'LOADING' || selectedProcessType === 'DELIVERY') {
      onNavigate('ScanClothes', { 
        mode: 'process', 
        guideId: guideId,
        processType: selectedProcessType,
        serviceType: selectedServiceType
      });
    }
    // Para otros procesos, ir directamente al escáner
    else {
      onNavigate('ScanClothes', { 
        mode: 'process', 
        guideId: guideId,
        processType: selectedProcessType,
        serviceType: selectedServiceType
      });
    }
  };

  const handleConfirmStatusChange = async () => {
    setIsUpdatingStatus(true);
    
    // TODO: Aquí se hará la llamada al backend para actualizar el estado
    // await updateGuideStatus(selectedGuideForConfirmation.id, newStatus);
    
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsUpdatingStatus(false);
    setConfirmationModalOpen(false);
    
    // Después de confirmar el cambio de estado, regresar al Dashboard
    onNavigate('Dashboard');
  };

  const getNewStatusFromProcess = (processType: string): string => {
    const statusMapping: Record<string, string> = {
      'WASHING': 'WASHING',
      'DRYING': 'DRYING',
      'IRONING': 'IRONING',
      'FOLDING': 'FOLDING',
      'PACKAGING': 'PACKAGING',
      'SHIPPING': 'SHIPPING',
      'LOADING': 'LOADING',
      'DELIVERY': 'DELIVERY',
    };
    return statusMapping[processType] || 'IN_PROCESS';
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

      {/* Modal de Selección de Guías */}
      <GuideSelectionModal
        visible={guideSelectionModalOpen}
        onClose={() => setGuideSelectionModalOpen(false)}
        onSelectGuide={handleGuideSelect}
        processType={selectedProcessType}
        guides={guidesForProcess.map(g => ({
          id: g.id,
          guide_number: g.guide_number,
          client_name: g.client_name || 'Cliente desconocido',
          status: g.status,
          created_at: g.created_at,
          total_garments: g.total_garments || 0,
        }))}
        serviceType={selectedServiceType}
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
        newStatus={getNewStatusFromProcess(selectedProcessType)}
        processType={selectedProcessType}
        isLoading={isUpdatingStatus}
      />
    </Container>
  );
};


