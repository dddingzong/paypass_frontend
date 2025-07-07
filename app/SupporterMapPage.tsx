// SupporterMapPage.tsx
import BottomNav from '@/app/src/components/BottomNav';
import Global from '@/constants/Global';
import axios from 'axios';
import { Locate, User } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { customMapStyle } from '../styles/MapPageStyles';

interface RealTimeLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

const SupporterMapPage: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const [targetLocation, setTargetLocation] = useState<RealTimeLocation | null>(null);

  const fetchTargetLocation = useCallback(async () => {
    try {
      const response = await axios.post(`${Global.URL}/user/getRecentUserLocation`, {
        number: Global.TARGET_NUMBER,
      });
      const { latitude, longitude } = response.data;
      const location: RealTimeLocation = {
        latitude,
        longitude,
        timestamp: Date.now(),
      };
      setTargetLocation(location);
      moveToLocation(location);
    } catch (err) {
      console.error('상대 위치 요청 실패:', err);
      Alert.alert('오류', '상대 위치를 불러올 수 없습니다.');
    }
  }, []);

  const moveToLocation = useCallback((location: RealTimeLocation) => {
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  }, []);

  useEffect(() => {
    fetchTargetLocation();
    const intervalId = setInterval(fetchTargetLocation, 5000);
    return () => clearInterval(intervalId);
  }, [fetchTargetLocation]);

  const moveToTarget = useCallback(() => {
    if (targetLocation) {
      moveToLocation(targetLocation);
    } else {
      fetchTargetLocation();
    }
  }, [targetLocation, moveToLocation, fetchTargetLocation]);

  if (!targetLocation) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-700 text-lg">상대 위치를 불러오는 중입니다.</Text>
      </SafeAreaView>
    );
  }

  const region = {
    latitude: targetLocation.latitude,
    longitude: targetLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View className="bg-white shadow-lg p-6 items-center">
        <Text className="text-2xl font-bold text-gray-900 mb-1">이용자 위치</Text>
        <Text className="text-sm text-gray-500">이용자의 위치를 표시 중입니다.</Text>
      </View>

      <View className="flex-1 relative">
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={region}
          customMapStyle={customMapStyle}
        >
          <Marker
            coordinate={region}
            title="이용자 위치"
            description="최근 위치"
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={{ alignItems: 'center', width: 40 }}>
              <View className="p-3 rounded-full shadow-lg border-4 border-white bg-blue-500">
                <User size={10} color="white" />
              </View>
              <View className="mt-1 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                <Text className="text-xs font-medium text-blue-600">이용자 위치</Text>
              </View>
            </View>
          </Marker>
        </MapView>

        <TouchableOpacity
          className="absolute bottom-20 right-4 bg-white p-4 rounded-full shadow-lg border border-gray-200"
          onPress={moveToTarget}
          style={{ elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 }}
        >
          <Locate size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <BottomNav current="MapPage" />
    </SafeAreaView>
  );
};

export default SupporterMapPage;
