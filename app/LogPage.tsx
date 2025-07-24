import BottomNav from '@/app/src/components/BottomNav';
import Global from '@/constants/Global';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import axios from 'axios';
import { Bell, Clock, MapPin } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { BackHandler, FlatList, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';

interface Notification {
  id: number;
  number: string;
  name: string;
  departureTime: string;
  arrivalTime: string;
  departureLocation: string;
  arrivalLocation: string;
}

type RootStackParamList = {
  MapRouterPage: undefined;
  LinkPage: undefined;
  LogPage: undefined;
  DetailLogPage: { logId: number }; // 추가
  MyPage: undefined;
  SelectRole: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList, 'LogPage'>;


const LogPage: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [requireSelection, setRequireSelection] = useState(false);

  useEffect(() => {
    console.log('현재 페이지 렌더링됨: LogPage');
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (Global.USER_ROLE === 'supporter' && !Global.TARGET_NUMBER) {
        setRequireSelection(true);
        return;
      }

      let numberToRequest = Global.USER_ROLE === 'supporter' ? Global.TARGET_NUMBER : Global.NUMBER;

      try {
        const response = await axios.post(`${Global.URL}/log/getLogList`, {
          number: numberToRequest,
        });
        setNotifications(response.data);
      } catch (error) {
        console.error('알림 불러오기 실패:', error);
      }
    };

    fetchNotifications();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        navigation.navigate('SelectRole' as never);
        return true;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [navigation])
  );

    const formatDateTime = (time: string) => {
    const date = new Date(time);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${month}월 ${day}일 ${hour}시 ${minute}분`;
  };

  const renderNotificationCard = ({ item }: { item: Notification }) => (
  <TouchableOpacity onPress={() => navigation.navigate('DetailLogPage', { logId: item.id })}>
    <View className="bg-white rounded-lg shadow-sm mb-4 p-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <View className="h-12 w-12 bg-blue-100 rounded-full items-center justify-center mr-3 mt-2">
                <MapPin size={20} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="font-medium text-gray-900">{item.name} 님의 이동 기록</Text>
                <View className="flex-row items-center mt-1">
                  <Clock size={12} color="#6b7280" />
                  <Text className="text-sm text-gray-500 ml-1">
                    출발: {formatDateTime(item.departureTime)}
                  </Text>
                </View>
                <View className="flex-row items-center mt-1">
                  <Clock size={12} color="#6b7280" />
                  <Text className="text-sm text-gray-500 ml-1">
                    도착: {formatDateTime(item.arrivalTime)}
                  </Text>
                </View>
              </View>
            </View>
            <Text className="text-sm text-gray-600 mt-2">
              {item.departureLocation}에서 {item.arrivalLocation}으로 이동하셨습니다.
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <View className="flex-1 p-4 pb-20">
        <View className="max-w-2xl mx-auto w-full">
          <Text className="text-2xl font-bold text-gray-900 mb-6">이동 기록</Text>

          {requireSelection ? (
            <View className="items-center justify-center py-12">
              <Text className="text-base text-gray-800">이용자를 선택해주세요.</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderNotificationCard}
              keyExtractor={(_, index) => index.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              ListEmptyComponent={
                <View className="items-center justify-center py-12">
                  <Bell size={48} color="#9ca3af" />
                  <Text className="text-gray-500 text-lg mt-4">기록이 없습니다</Text>
                </View>
              }
            />
          )}
        </View>
      </View>
      <BottomNav current="LogPage" />
    </SafeAreaView>
  );
};

export default LogPage;
