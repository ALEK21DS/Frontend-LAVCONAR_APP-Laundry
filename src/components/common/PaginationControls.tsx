import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import IonIcon from 'react-native-vector-icons/Ionicons';

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  total,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <View className="border-t border-gray-200 bg-white px-4 py-2 mt-4">
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={`flex-row items-center px-3 py-1.5 rounded-lg ${currentPage === 1 ? 'bg-gray-100' : ''}`}
          style={{ backgroundColor: currentPage === 1 ? undefined : '#0b1f36' }}
        >
          <IonIcon 
            name="chevron-back" 
            size={16} 
            color={currentPage === 1 ? '#9CA3AF' : '#FFFFFF'} 
          />
        </TouchableOpacity>

        <View className="flex-row items-center">
          <Text className="text-gray-600 text-sm font-medium">
            Página {currentPage} de {totalPages}
          </Text>
          <Text className="text-gray-400 text-xs ml-2">
            ({total} total)
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={`flex-row items-center px-3 py-1.5 rounded-lg ${currentPage === totalPages ? 'bg-gray-100' : ''}`}
          style={{ backgroundColor: currentPage === totalPages ? undefined : '#0b1f36' }}
        >
          <IonIcon 
            name="chevron-forward" 
            size={16} 
            color={currentPage === totalPages ? '#9CA3AF' : '#FFFFFF'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

