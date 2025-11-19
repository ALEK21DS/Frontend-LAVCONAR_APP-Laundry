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

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const isPrevDisabled = currentPage === 1;
  const isNextDisabled = currentPage === totalPages;

  return (
    <View className="border-t border-gray-200 bg-white px-4 py-2 mt-1">
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={handlePrev}
          disabled={isPrevDisabled}
          className={`flex-row items-center px-3 py-1.5 rounded-lg ${isPrevDisabled ? 'bg-gray-100' : ''}`}
          style={{ backgroundColor: isPrevDisabled ? undefined : '#0b1f36' }}
        >
          <IonIcon
            name="chevron-back"
            size={16}
            color={isPrevDisabled ? '#9CA3AF' : '#FFFFFF'}
          />
        </TouchableOpacity>

        <View className="flex-row items-center">
          <Text className="text-gray-600 text-sm font-medium">
            Página    {currentPage}  -  {totalPages}
          </Text>
          <Text className="text-gray-400 text-xs ml-2">
            ({total} total)
          </Text>
        </View>

        <TouchableOpacity
          onPress={handleNext}
          disabled={isNextDisabled}
          className={`flex-row items-center px-3 py-1.5 rounded-lg ${isNextDisabled ? 'bg-gray-100' : ''}`}
          style={{ backgroundColor: isNextDisabled ? undefined : '#0b1f36' }}
        >
          <IonIcon
            name="chevron-forward"
            size={16}
            color={isNextDisabled ? '#9CA3AF' : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};


