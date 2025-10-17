import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, TouchableOpacity, Text, Animated, Pressable } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';

type TabItem = {
  key: 'Dashboard' | 'Clients' | 'ScanClothes' | 'Guides' | 'Processes';
  label: string;
  icon: string;
};

interface BottomNavProps {
  active: TabItem['key'];
  onNavigate: (route: TabItem['key'], params?: any) => void;
}

const TABS: TabItem[] = [
  { key: 'Dashboard', label: 'Inicio', icon: 'home-outline' },
  { key: 'Clients', label: 'Clientes', icon: 'people-outline' },
  { key: 'ScanClothes', label: 'Escanear', icon: 'scan-outline' },
  { key: 'Guides', label: 'Guías', icon: 'document-text-outline' },
  { key: 'Processes', label: 'Procesos', icon: 'sync-outline' },
];

export const BottomNav: React.FC<BottomNavProps> = ({ active, onNavigate }) => {
  const [showGuidesMenu, setShowGuidesMenu] = useState(false);
  const [radialOpen, setRadialOpen] = useState(false);
  const animLeft = useRef(new Animated.Value(0)).current;
  const animTop = useRef(new Animated.Value(0)).current;
  const animRight = useRef(new Animated.Value(0)).current;
  const guidesOpen = useState(false)[0];
  const [guidesRadialOpen, setGuidesRadialOpen] = useState(false);
  const guidesAnimUp = useRef(new Animated.Value(0)).current;
  const guidesAnimDiag = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const to1 = Animated.timing(animLeft, { toValue: radialOpen ? 1 : 0, duration: 160, useNativeDriver: true });
    const to2 = Animated.timing(animTop, { toValue: radialOpen ? 1 : 0, duration: 160, useNativeDriver: true });
    const to3 = Animated.timing(animRight, { toValue: radialOpen ? 1 : 0, duration: 160, useNativeDriver: true });
    if (radialOpen) {
      // Abrir de izquierda a derecha
      Animated.stagger(70, [to1, to2, to3]).start();
    } else {
      // Cerrar de derecha a izquierda
      Animated.stagger(40, [to3, to2, to1]).start();
    }
  }, [radialOpen, animLeft, animTop, animRight]);

  useEffect(() => {
    const up = Animated.timing(guidesAnimUp, { toValue: guidesRadialOpen ? 1 : 0, duration: 150, useNativeDriver: true });
    const diag = Animated.timing(guidesAnimDiag, { toValue: guidesRadialOpen ? 1 : 0, duration: 150, useNativeDriver: true });
    if (guidesRadialOpen) {
      // Abrir de abajo hacia arriba (primero Guías, luego Prendas)
      Animated.stagger(60, [up, diag]).start();
    } else {
      // Cerrar de arriba hacia abajo (primero Prendas, luego Guías)
      Animated.stagger(40, [diag, up]).start();
    }
  }, [guidesRadialOpen, guidesAnimUp, guidesAnimDiag]);

  const radialItems = useMemo(() => ([
    { key: 'garment', icon: 'shirt-outline', label: 'Prenda', onPress: () => onNavigate('ScanClothes' as any) },
    { key: 'guide', icon: 'document-text-outline', label: 'Guía', onPress: () => onNavigate('ScanClothes' as any) },
    { key: 'process', icon: 'construct-outline', label: 'Proceso', onPress: () => onNavigate('ScanClothes' as any) },
  ]), [onNavigate]);

  return (
    <View className="flex-row items-center justify-between px-2 pt-2 pb-6 bg-white border-t border-gray-200">
      {TABS.map((tab, idx) => {
        const isCenter = tab.key === 'ScanClothes';
        const isActive = active === tab.key;
        if (isCenter) {
          return (
            <View key={tab.key} className="items-center justify-center" style={{ zIndex: 60 }}>
              {/* Overlay pantalla completa para cerrar y bloquear tabs/detrás */}
              {radialOpen && (
                <Pressable
                  // cubrir toda la pantalla por encima de la barra
                  style={{ position: 'absolute', left: -400, right: -400, bottom: 0, top: -900, zIndex: 45 }}
                  onPress={() => setRadialOpen(false)}
                />
              )}

              {/* Radial submenu con contenedores de color */}
              <>
                {/* Arriba (Prenda)  */}
                <Animated.View style={{ position: 'absolute', top: -115, transform: [{ scale: animTop }], opacity: animTop, zIndex: 50 }} pointerEvents={radialOpen ? 'auto' : 'none'}>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => { setRadialOpen(false); /* @ts-ignore */ onNavigate('ScanClothes' as any, { mode: 'garment' }); }}>
                    <View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: '#10B981', elevation: 10 }} className="items-center justify-center">
                      <IonIcon name="shirt-outline" size={22} color="#ffffff" />
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                {/* Izquierda (Guía)  */}
                <Animated.View style={{ position: 'absolute', top: -70, left: -75, transform: [{ scale: animLeft }], opacity: animLeft, zIndex: 50 }} pointerEvents={radialOpen ? 'auto' : 'none'}>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => { setRadialOpen(false); /* @ts-ignore */ onNavigate('ScanClothes' as any, { mode: 'guide' }); }}>
                    <View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: '#F59E0B', elevation: 10 }} className="items-center justify-center">
                      <IonIcon name="document-text-outline" size={20} color="#ffffff" />
                    </View>
                  </TouchableOpacity>
                </Animated.View>

                {/* Derecha (Proceso - morado) */}
                <Animated.View style={{ position: 'absolute', top: -70, right: -75, transform: [{ scale: animRight }], opacity: animRight, zIndex: 50 }} pointerEvents={radialOpen ? 'auto' : 'none'}>
                  <TouchableOpacity activeOpacity={0.85} onPress={() => { setRadialOpen(false); /* @ts-ignore */ onNavigate('ScanClothes' as any, { mode: 'process' }); }}>
                    <View style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: '#7c3aed', elevation: 10 }} className="items-center justify-center">
                      <IonIcon name="construct-outline" size={20} color="#ffffff" />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              </>

              {/* Botón central */}
              <TouchableOpacity
                className="-mt-8 w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: '#1f4eed', elevation: 12, zIndex: 60 }}
                onPress={() => setRadialOpen(prev => !prev)}
                activeOpacity={0.85}
              >
                <IonIcon name={tab.icon} size={24} color="#ffffff" />
              </TouchableOpacity>
            </View>
          );
        }
        const isGuides = tab.key === 'Guides';
        if (isGuides) {
          return (
            <View key={tab.key} className="flex-1 items-center" style={{ position: 'relative' }}>
              {/* Overlay para cerrar */}
              {guidesRadialOpen && (
                <View
                  style={{ position: 'absolute', left: -400, right: -400, bottom: 40, top: -600, zIndex: 30 }}
                  // @ts-ignore responder props
                  onStartShouldSetResponder={() => true}
                  onResponderRelease={() => setGuidesRadialOpen(false)}
                />
              )}

              {/* Botón Guides principal */}
              <TouchableOpacity
                className="items-center"
                activeOpacity={0.8}
                onPress={() => setGuidesRadialOpen(prev => !prev)}
                style={{ zIndex: 40 }}
              >
                <IonIcon name={tab.icon} size={22} color={active === 'Guides' ? '#1f4eed' : '#6B7280'} />
                <Text className={`text-xs mt-1 ${active === 'Guides' ? 'text-[#1f4eed]' : 'text-gray-500'}`}>{tab.label}</Text>
              </TouchableOpacity>

              {/* Submenú vertical: arriba = Guías, arriba de esa = Prendas */}
              <>
                <Animated.View style={{ position: 'absolute', bottom: 10, transform: [{ translateY: guidesAnimUp.interpolate({ inputRange: [0,1], outputRange: [0,-48] }) }, { scale: guidesAnimUp }], opacity: guidesAnimUp, zIndex: 50 }} pointerEvents={guidesRadialOpen ? 'auto' : 'none'}>
                  <TouchableOpacity
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#F59E0B', elevation: 10 }}
                    onPress={() => { setGuidesRadialOpen(false); onNavigate('Guides'); }}
                    activeOpacity={0.9}
                  >
                    <IonIcon name="document-text-outline" size={18} color="#ffffff" />
                  </TouchableOpacity>
                </Animated.View>

                <Animated.View style={{ position: 'absolute', bottom: 15, transform: [{ translateY: guidesAnimDiag.interpolate({ inputRange: [0,1], outputRange: [0,-96] }) }, { scale: guidesAnimDiag }], opacity: guidesAnimDiag, zIndex: 50 }} pointerEvents={guidesRadialOpen ? 'auto' : 'none'}>
                  <TouchableOpacity
                    className="w-12 h-12 rounded-full items-center justify-center"
                    style={{ backgroundColor: '#10B981', elevation: 10 }}
                    onPress={() => { setGuidesRadialOpen(false); onNavigate('Garments' as any); }}
                    activeOpacity={0.9}
                  >
                    <IonIcon name="shirt-outline" size={18} color="#ffffff" />
                  </TouchableOpacity>
                </Animated.View>
              </>
            </View>
          );
        }

        return (
          <TouchableOpacity
            key={tab.key}
            className="flex-1 items-center"
            onPress={() => { if (!radialOpen && !guidesRadialOpen) onNavigate(tab.key); }}
            activeOpacity={0.8}
          >
            <IonIcon name={tab.icon} size={22} color={isActive ? '#1f4eed' : '#6B7280'} />
            <Text className={`text-xs mt-1 ${isActive ? 'text-[#1f4eed]' : 'text-gray-500'}`}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}

    </View>
  );
};


