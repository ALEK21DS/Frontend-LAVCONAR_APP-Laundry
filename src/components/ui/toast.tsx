import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';

type ToastProps = {
  visible: boolean;
  message: string;
  onHide?: () => void;
  variant?: 'error' | 'success' | 'info';
  durationMs?: number;
};

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  onHide,
  variant = 'info',
  durationMs = 2500,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-24)).current;
  const translateX = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, useNativeDriver: true }),
      ]).start(() => {
        const timer = setTimeout(() => {
          Animated.parallel([
            Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
            Animated.timing(translateY, { toValue: -24, duration: 220, useNativeDriver: true }),
            Animated.timing(translateX, { toValue: 24, duration: 220, useNativeDriver: true }),
          ]).start(() => onHide && onHide());
        }, durationMs);
        return () => clearTimeout(timer);
      });
    }
  }, [visible]);

  if (!visible) return null;

  const colorByVariant = {
    error: { bg: 'bg-red-500/90', text: 'text-white', border: 'border-red-400/80' },
    success: { bg: 'bg-emerald-500/90', text: 'text-white', border: 'border-emerald-400/80' },
    info: { bg: 'bg-blue-500/90', text: 'text-white', border: 'border-blue-400/80' },
  }[variant];

  return (
    <View className="absolute top-4 right-4 z-50">
      <Animated.View
        style={{ opacity, transform: [{ translateY }, { translateX }] }}
        className={`px-5 py-4 rounded-xl ${colorByVariant.bg} border ${colorByVariant.border} shadow-xl shadow-black/40 min-w-[220px] max-w-[85%] items-center justify-center`}
      >
        <Text className={`text-sm font-medium ${colorByVariant.text} text-center leading-5`}>{message}</Text>
      </Animated.View>
    </View>
  );
};


