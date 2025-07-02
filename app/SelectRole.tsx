import Global from '@/constants/Global';
import { useRouter } from 'expo-router';
import { ArrowRight, User, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type UserRole = 'user' | 'supporter' | null;

const roles = [
  {
    key: 'user' as UserRole,
    title: '이용자',
    description: '서비스를 직접 이용하는 노인 이용자',
    features: '• 내 위치 확인 • 활동 로그 • 마이페이지',
    icon: User,
    selectedColor: 'blue',
  },
  {
    key: 'supporter' as UserRole,
    title: '보호자',
    description: '이용자를 돌보는 가족 또는 보호자',
    features: '• 지도 검색 • 이용자 관리 • 알림 • 로그',
    icon: Users,
    selectedColor: 'green',
  },
];

export default function SelectRolePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (selectedRole) {
      try {
        console.log('선택한 역할:', selectedRole);
        Global.USER_ROLE = selectedRole;
        if (Global.USER_ROLE === 'user') {
          router.push(`/MapPage`);
        } 
        if (Global.USER_ROLE === 'supporter') {
          router.push(`/LinkPage`);
        }
      } catch (error) {
        console.error('역할 선택 중 오류:', error);
        Alert.alert('오류', '역할 선택 중 문제가 발생했습니다.');
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center px-4">
        {/* 메인 카드 */}
        <View className="bg-white rounded-lg shadow-sm p-6 mx-4">
          {/* 헤더 */}
          <View className="text-center mb-6">
            <Text className="text-2xl font-bold text-gray-900 text-center mb-2">
              환영합니다!
            </Text>
            <Text className="text-lg text-gray-600 text-center leading-6">
              서비스 이용을 위해 역할을 선택해주세요.
            </Text>
          </View>

          {/* 역할 선택 카드들 */}
          <View className="space-y-4 mb-6">
            {roles.map(role => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.key;
              return (
                <TouchableOpacity
                  key={role.key}
                  onPress={() => handleRoleSelect(role.key)}
                  className={`border-2 rounded-lg p-6 mb-2 ${
                    isSelected
                      ? `border-${role.selectedColor}-500 bg-${role.selectedColor}-50`
                      : 'border-gray-200 bg-white'
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center space-x-4">
                    <View
                      className={`h-12 w-12 rounded-full items-center justify-center ${
                        isSelected ? `bg-${role.selectedColor}-100` : 'bg-gray-100'
                      }`}
                    >
                      <Icon
                        size={24}
                        color={isSelected ? (role.selectedColor === 'blue' ? '#2563eb' : '#16a34a') : '#6b7280'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900">
                        {role.title}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {role.description}
                      </Text>
                      <Text className={`text-xs mt-1 text-${role.selectedColor}-600`}>
                        {role.features}
                      </Text>
                    </View>
                    {isSelected && (
                      <ArrowRight
                        size={20}
                        color={role.selectedColor === 'blue' ? '#2563eb' : '#16a34a'}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 계속하기 버튼 */}
          <TouchableOpacity
            onPress={handleContinue}
            disabled={!selectedRole}
            className={`py-4 rounded-lg ${
              selectedRole
                ? 'bg-blue-600 active:bg-blue-700'
                : 'bg-gray-300'
            }`}
            activeOpacity={selectedRole ? 0.8 : 1}
          >
            <Text
              className={`text-center text-lg font-medium ${
                selectedRole ? 'text-white' : 'text-gray-500'
              }`}
            >
              {selectedRole === 'user'
                ? '이용자로 시작하기'
                : selectedRole === 'supporter'
                ? '보호자로 시작하기'
                : '시작하기'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}