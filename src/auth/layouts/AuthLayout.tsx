import React from 'react';
import { View, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Container } from '@/components/common';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <Container safe className="bg-[#0f1115]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled">
          <View
            className="px-4 rounded-lg border w-full self-center"
            style={{
              maxWidth: 620,
              backgroundColor: '#111216',
              borderColor: '#2b2f36',
              padding: 24,
            }}>
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
};
