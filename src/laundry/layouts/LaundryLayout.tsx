import React from 'react';
import { View, ScrollView } from 'react-native';
import { Container } from '@/components/common';

interface LaundryLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
}

export const LaundryLayout: React.FC<LaundryLayoutProps> = ({ children, scrollable = true }) => {
  if (scrollable) {
    return (
      <Container safe>
        <ScrollView className="flex-1">{children}</ScrollView>
      </Container>
    );
  }

  return (
    <Container safe>
      <View className="flex-1">{children}</View>
    </Container>
  );
};
