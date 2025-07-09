import useCareGeofence from '@/app/hooks/userCareGeofence';
import BottomNav from '@/app/src/components/BottomNav';
import Global from '@/constants/Global';
import axios from 'axios';
import * as Location from 'expo-location';
import { Locate, Navigation } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { customMapStyle } from '../styles/MapPageStyles';

const UserMapPage: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObjectCoords | null>(null);

  const careGeofences = useCareGeofence(currentLocation ?? undefined);

  // 지도 이동
  const moveToLocation = useCallback((coords: Location.LocationObjectCoords) => {
    mapRef.current?.animateToRegion({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  }, []);

  // 위치 권한 요청 및 현재 위치 설정
  const requestAndSetCurrentLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('오류', '위치 권한이 필요합니다.');
      return;
    }

    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentLocation(pos.coords);
      moveToLocation(pos.coords);
    } catch (err) {
      Alert.alert('오류', '위치를 가져올 수 없습니다.');
    }
  }, [moveToLocation]);

  // 위치 서버 전송
  const sendCurrentLocation = useCallback(async () => {
    if (!currentLocation) return;

    try {
      await axios.post(`${Global.URL}/user/saveUserLocation`, {
        number: Global.NUMBER,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('위치 전송 오류:', err);
    }
  }, [currentLocation]);

  // 초기 위치 설정
  useEffect(() => {
    requestAndSetCurrentLocation();
  }, [requestAndSetCurrentLocation]);

  // 위치 주기적 전송
  useEffect(() => {
    const intervalId = setInterval(sendCurrentLocation, 5000);
    return () => clearInterval(intervalId);
  }, [sendCurrentLocation]);

  // 내 위치 버튼
  const moveToMyLocation = useCallback(() => {
    if (currentLocation) {
      moveToLocation(currentLocation);
    }
  }, [currentLocation, moveToLocation]);

  if (!currentLocation) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-700 text-lg">위치 정보를 불러오는 중입니다.</Text>
      </SafeAreaView>
    );
  }

  const region = {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View className="bg-white shadow-lg p-6 items-center">
        <Text className="text-2xl font-bold text-gray-900 mb-1">내 위치</Text>
        <Text className="text-sm text-gray-500">사용자의 위치를 수집 중입니다.</Text>
      </View>

      <View className="flex-1 relative">
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={region}
          customMapStyle={customMapStyle}
        >
          {careGeofences.map((fence) => (
            <Circle
              key={fence.id}
              center={fence.center}
              radius={fence.radius}
              strokeColor={fence.strokeColor}
              fillColor={fence.fillColor}
            />
          ))}

          <Marker
            coordinate={region}
            title="내 위치"
            description="실시간 추적 중"
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={{ alignItems: 'center', width: 40 }}>
              <View className="p-3 rounded-full shadow-lg border-4 border-white bg-green-500">
                <Navigation size={10} color="white" />
              </View>
              <View className="mt-1 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                <Text className="text-xs font-medium text-green-600">내 위치</Text>
              </View>
            </View>
          </Marker>
        </MapView>

        <TouchableOpacity
          className="absolute bottom-20 right-4 bg-white p-4 rounded-full shadow-lg border border-gray-200"
          onPress={moveToMyLocation}
          style={{
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
          }}
        >
          <Locate size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <BottomNav current="MapPage" />
    </SafeAreaView>
  );
};

export default UserMapPage;
