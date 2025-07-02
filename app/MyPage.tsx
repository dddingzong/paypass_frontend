import BottomNav from '@/app/src/components/BottomNav';
import Global from '@/constants/Global';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import {
  ChevronRight,
  LogOut,
  Settings,
  Shield,
  User
} from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Modal,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

// 타입 정의
interface UserData {
  name: string;
  number: string;
  homeStreetAddress: string;
  homeStreetAddressDetail: string;
  centerStreetAddress: string;
  linkCode: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const MyPage: React.FC = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState<UserData>();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordData, setPasswordData] = useState<PasswordData>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
  console.log('현재 페이지 렌더링됨: MyPage');
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.post(`${Global.URL}/myPage/getInformation`,{
          number: Global.NUMBER
        });
        const data = response.data;

        setUserData({
          name: data.name,
          number: data.number,
          homeStreetAddress: data.homeStreetAddress,
          homeStreetAddressDetail: data.homeStreetAddressDetail,
          centerStreetAddress: data.centerStreetAddress,
          linkCode: data.linkCode,
        });

      } catch (error) {
        console.error('사용자 정보 불러오기 실패:', error);
        Alert.alert('오류', '사용자 정보를 불러올 수 없습니다.');
      }
    };

    fetchUserData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('SelectRole' as never);
        return true;  // 기본 뒤로가기 동작 차단
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [navigation])
  );

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('오류', '새 비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      // 실제 구현에서는 서버 API 호출
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setIsPasswordModalOpen(false);

      // api 요청
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });

      Alert.alert('성공', '비밀번호가 변경되었습니다.');
    } catch (error) {
      console.error('비밀번호 변경 실패:', error);
      Alert.alert('오류', '비밀번호 변경에 실패했습니다.');
    }
  };

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
        { text: '취소', style: 'cancel' },
        {
          text: '로그아웃',
          onPress: async () => {
            try {
                Global.NUMBER = "";
                Global.TARGET_NUMBER = "";
                Global.USER_ROLE = "";
          
              navigation.navigate('index' as never);
            } catch (error) {
              console.error('로그아웃 실패:', error);
            }
          },
        },
      ]
    );
  };

  const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
    <View className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>{children}</View>
  );

  const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View className="p-3 border-b border-gray-100">{children}</View>
  );

  const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View className="p-4">{children}</View>
  );

  const Button: React.FC<{
    onPress: () => void;
    children: React.ReactNode;
    variant?: 'default' | 'outline' | 'ghost';
    className?: string;
    disabled?: boolean;
  }> = ({ onPress, children, variant = 'default', className = "", disabled = false }) => {
    const baseClass = "rounded-md px-4 py-2 flex-row items-center justify-center";
    const variantClass = {
      default: "bg-blue-600",
      outline: "border border-gray-300 bg-white",
      ghost: "bg-transparent",
    }[variant];

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        className={`${baseClass} ${variantClass} ${className} ${disabled ? 'opacity-50' : ''}`}
      >
        {children}
      </TouchableOpacity>
    );
  };

  if (!userData) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <Text>사용자 정보를 불러오는 중입니다...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        <View className="w-full px-4 space-y-6 pb-24">
          <Text className="text-2xl font-bold text-gray-900 ml-3">마이페이지</Text>

          <Card className="mb-3">
            <CardHeader>
              <View className="flex-row items-center">
                <User size={20} color="#6B7280" />
                <Text className="ml-2 text-lg font-semibold">프로필 정보</Text>
              </View>
            </CardHeader>
            <CardContent>
              <View className="flex-row items-center space-x-4 mb-4">
                <View className="h-16 w-16 bg-blue-100 rounded-full items-center justify-center">
                  <User size={32} color="#2563EB" />
                </View>
                <View className="flex-1">
                  <Text className="text-xl font-semibold">{userData.name}</Text>
                  <View className="mt-1">
                    <View className="border border-gray-300 rounded-full px-2 py-1">
                      <Text className="text-xs text-gray-600">{Global.USER_ROLE === 'supporter' ? '보호자' : '이용자'}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="space-y-4">
                <View>
                  <Text className="text-sm font-bold text-gray-700 mb-1">이름</Text>
                  <Text className="text-sm font-medium">{userData.name}</Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">전화번호</Text>
                  <Text className="text-sm font-medium">{userData.number}</Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-gray-700 mb-1">주소</Text>
                  <Text className="text-sm font-medium">{userData.homeStreetAddress}</Text>
                  <Text className="text-sm text-gray-600">{userData.homeStreetAddressDetail}</Text>
                </View>

                {Global.USER_ROLE === 'user' && (
                  <View className="mt-4">
                    <Text className="text-sm font-medium text-gray-700 mb-1">센터 주소</Text>
                    <Text className="text-sm font-medium">{userData.centerStreetAddress}</Text>
                    <Text className="text-sm font-medium text-gray-700 mt-3 mb-1">링크 코드</Text>
                    <Text className="text-sm font-medium">{userData.linkCode}</Text>
                  </View>
                )}
              </View>
            </CardContent>
          </Card>

          <Card className="mb-3">
            <CardHeader>
              <View className="flex-row items-center">
                <Settings size={20} color="#6B7280" />
                <Text className="ml-2 text-lg font-semibold">계정 설정</Text>
              </View>
            </CardHeader>
            <CardContent>
              <View className="space-y-3">
                <TouchableOpacity onPress={() => setIsPasswordModalOpen(true)} className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center">
                    <Shield size={16} color="#6B7280" />
                    <Text className="ml-3 font-medium">비밀번호 변경</Text>
                  </View>
                  <ChevronRight size={16} color="#6B7280" />
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center">
                    <User size={16} color="#6B7280" />
                    <Text className="ml-3 font-medium">개인정보 처리방침</Text>
                  </View>
                  <ChevronRight size={16} color="#6B7280" />
                </TouchableOpacity>

                <TouchableOpacity className="flex-row items-center justify-between py-2">
                  <View className="flex-row items-center">
                    <Settings size={16} color="#6B7280" />
                    <Text className="ml-3 font-medium">서비스 이용약관</Text>
                  </View>
                  <ChevronRight size={16} color="#6B7280" />
                </TouchableOpacity>

                <View className="h-px bg-gray-200 my-2" />

                <TouchableOpacity onPress={handleLogout} className="flex-row items-center py-2">
                  <LogOut size={16} color="#DC2626" />
                  <Text className="ml-3 font-medium text-red-600">로그아웃</Text>
                </TouchableOpacity>
              </View>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <View className="items-center">
                <Text className="text-sm text-gray-500">페이패스 v1.0.0</Text>
              </View>
            </CardContent>
          </Card>
        </View>
      </ScrollView>

      {/* 비밀번호 변경 모달 */}
      <Modal
        visible={isPasswordModalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPasswordModalOpen(false)}
      >
        <View className="flex-1 bg-black/50 justify-center p-4">
          <View className="bg-white rounded-lg p-6">
            <Text className="text-lg font-semibold mb-4">비밀번호 변경</Text>
            <View className="space-y-4">
              <TextInput
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                secureTextEntry
                placeholder="현재 비밀번호"
                className="border border-gray-300 rounded-md px-3 py-2"
              />
              <TextInput
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                secureTextEntry
                placeholder="새 비밀번호"
                className="border border-gray-300 rounded-md px-3 py-2"
              />
              <TextInput
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                secureTextEntry
                placeholder="새 비밀번호 확인"
                className="border border-gray-300 rounded-md px-3 py-2"
              />
              <View className="flex-row space-x-2 mt-6">
                <Button onPress={() => setIsPasswordModalOpen(false)} variant="outline" className="flex-1">
                  <Text className="text-gray-700">취소</Text>
                </Button>
                <Button onPress={handlePasswordChange} className="flex-1">
                  <Text className="text-white">변경</Text>
                </Button>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* 하단 네비게이션 */}
      <BottomNav current="MyPage" />
    </SafeAreaView>
  );
};

export default MyPage;