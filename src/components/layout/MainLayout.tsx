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

  const handleNavigate = (route: MainLayoutProps['activeTab'], params?: any) => {
    onNavigate(route, params);
  };

  const handleServiceTypeSelect = (serviceType: 'industrial' | 'personal') => {
    setSelectedServiceType(serviceType);
    setServiceTypeModalOpen(false);
    setProcessTypeModalOpen(true);
    console.log('Tipo de servicio seleccionado:', serviceType);
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
      const selectedGuide = getGuidesByProcessType(selectedProcessType).find(g => g.id === guideId);
      
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
      console.log('🔍 Debug - currentStatus:', currentStatus, 'selectedProcessType:', selectedProcessType, 'selectedServiceType:', selectedServiceType);
      
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

  // Datos demo de guías (esto vendría del backend)
  const getGuidesByProcessType = (processType: string) => {
    const demoGuides = [
      { id: 'g-001', guide_number: 'G-0001', client_name: 'Cliente A', status: 'RECEIVED', created_at: '2024-01-15', total_garments: 15 },
      { id: 'g-002', guide_number: 'G-0002', client_name: 'Cliente B', status: 'IN_PROCESS', created_at: '2024-01-14', total_garments: 8 },
      { id: 'g-003', guide_number: 'G-0003', client_name: 'Cliente C', status: 'WASHING', created_at: '2024-01-13', total_garments: 12 },
      { id: 'g-004', guide_number: 'G-0004', client_name: 'Cliente D', status: 'DRYING', created_at: '2024-01-12', total_garments: 20 },
      { id: 'g-005', guide_number: 'G-0005', client_name: 'Cliente E', status: 'IRONING', created_at: '2024-01-11', total_garments: 6 },
      { id: 'g-006', guide_number: 'G-0006', client_name: 'Cliente F', status: 'FOLDING', created_at: '2024-01-10', total_garments: 10 },
      { id: 'g-007', guide_number: 'G-0007', client_name: 'Cliente G', status: 'PACKAGING', created_at: '2024-01-09', total_garments: 12 },
      { id: 'g-008', guide_number: 'G-0008', client_name: 'Cliente H', status: 'SHIPPING', created_at: '2024-01-08', total_garments: 14 },
      { id: 'g-009', guide_number: 'G-0009', client_name: 'Cliente I', status: 'LOADING', created_at: '2024-01-07', total_garments: 18 },
    ];

    // Mapear el tipo de proceso al estado de guía que debe mostrar
    // Diferente mapeo según el tipo de servicio
    const getStatusMapping = () => {
      console.log('🔍 Debug - selectedServiceType:', selectedServiceType, 'processType:', processType);
      if (selectedServiceType === 'personal') {
        // Para servicio personal: incluye PLANCHADO y DOBLADO
        return {
          'IN_PROCESS': 'RECEIVED',      // EN PROCESO muestra guías RECIBIDAS
          'WASHING': 'IN_PROCESS',       // LAVADO muestra guías EN PROCESO
          'DRYING': 'WASHING',           // SECADO muestra guías LAVADAS
          'IRONING': 'DRYING',           // PLANCHADO muestra guías SECAS
          'FOLDING': 'IRONING',          // DOBLADO muestra guías PLANCHADAS
          'PACKAGING': 'FOLDING',        // EMPAQUE muestra guías DOBLADAS
          'SHIPPING': 'PACKAGING',       // EMBARQUE muestra guías EMPACADAS
          'LOADING': 'SHIPPING',         // CARGA muestra guías EMBARCADAS
          'DELIVERY': 'LOADING',         // ENTREGA muestra guías CARGADAS
        };
      } else {
        // Para servicio industrial: sin PLANCHADO y DOBLADO
        return {
          'IN_PROCESS': 'RECEIVED',      // EN PROCESO muestra guías RECIBIDAS
          'WASHING': 'IN_PROCESS',       // LAVADO muestra guías EN PROCESO
          'DRYING': 'WASHING',           // SECADO muestra guías LAVADAS
          'PACKAGING': 'DRYING',         // EMPAQUE muestra guías SECAS
          'SHIPPING': 'PACKAGING',       // EMBARQUE muestra guías EMPACADAS
          'LOADING': 'SHIPPING',         // CARGA muestra guías EMBARCADAS
          'DELIVERY': 'LOADING',         // ENTREGA muestra guías CARGADAS
        };
      }
    };

    const statusMapping = getStatusMapping();
    const targetStatus = statusMapping[processType] || processType;
    console.log('🎯 Debug - targetStatus:', targetStatus, 'filtered guides:', demoGuides.filter(guide => guide.status === targetStatus).length);
    return demoGuides.filter(guide => guide.status === targetStatus);
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
        guides={getGuidesByProcessType(selectedProcessType)}
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


