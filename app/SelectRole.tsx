import Global from '@/constants/Global';
import axios from 'axios';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { ArrowRight, User, Users } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
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

// Expo 알림 핸들러 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function SelectRolePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<UserRole>(null);

  // 페이지 진입 시 푸시 토큰 발급 및 서버 저장
  useEffect(() => {
    (async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          await axios.post(`${Global.URL}/user/savePushToken`, {
            number: Global.NUMBER, // 로그인 후 사용자 번호
            token,
          });
          console.log('[INIT] 푸시 토큰 저장 완료:', token);
        }
      } catch (error) {
        console.error('[INIT] 푸시 토큰 발급/저장 실패:', error);
      }
    })();
  }, []);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (selectedRole) {
      try {
        console.log('선택한 역할:', selectedRole);
        Global.USER_ROLE = selectedRole;
        if (Global.USER_ROLE === 'user') {
          router.push(`/MapRouterPage`);
        } else if (Global.USER_ROLE === 'supporter') {
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
              const selectedIconColor =
                role.selectedColor === 'blue' ? '#2563eb' : '#16a34a';

              return (
                <TouchableOpacity
                  key={role.key}
                  onPress={() => handleRoleSelect(role.key)}
                  className={`border-2 rounded-lg p-6 mb-2 ${
                    isSelected
                      ? `border-${role.selectedColor}-500`
                      : 'border-gray-200 bg-white'
                  }`}
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center space-x-4">
                    {/* 아이콘 배경 */}
                    <View
                      style={{
                        height: 48,
                        width: 48,
                        borderRadius: 24,
                        backgroundColor: isSelected
                          ? role.selectedColor === 'blue'
                            ? '#dbeafe'
                            : '#dcfce7'
                          : '#f3f4f6',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: -12,
                        marginRight: 10,
                      }}
                    >
                      <Icon
                        size={24}
                        color={isSelected ? selectedIconColor : '#6b7280'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900">
                        {role.title}
                      </Text>
                      <Text className="text-sm text-gray-600 mt-1">
                        {role.description}
                      </Text>
                      <Text
                        className={`text-xs mt-1 text-${role.selectedColor}-600`}
                      >
                        {role.features}
                      </Text>
                    </View>
                    {isSelected && (
                      <ArrowRight size={20} color={selectedIconColor} />
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
              selectedRole ? 'bg-blue-600 active:bg-blue-700' : 'bg-gray-300'
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

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      Alert.alert('알림 권한 거부됨');
      return null;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('[PUSH] Expo Push Token:', token);
  } else {
    Alert.alert('푸시 알림은 실제 기기에서만 작동합니다.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
  }
  return token;
}
