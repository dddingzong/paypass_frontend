import usePaypassGeofenceEventSender from '@/app/hooks/paypassGeofenceEventSender';
import useCareGeofence from '@/app/hooks/userCareGeofence';
import BottomNav from '@/app/src/components/BottomNav';
import Global from '@/constants/Global';
import axios from 'axios';
import * as Location from 'expo-location';
import { Locate, Navigation } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, SafeAreaView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Circle, Marker, Polyline, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { customMapStyle } from '../styles/MapPageStyles';

interface Station {
  stationNumber: number;
  name: string;
  latitude: number;
  longitude: number;
}

interface LatLng {
  latitude: number;
  longitude: number;
}

const UserMapPage: React.FC = () => {
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [visibleRegion, setVisibleRegion] = useState<Region | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [userPath, setUserPath] = useState<LatLng[]>([]);

  const paypassCenters = useMemo(() => Global.PAYPASS_CENTERS as Station[], []);
  const safeLocation = useMemo(() => {
    if (currentLocation) return { latitude: currentLocation.latitude, longitude: currentLocation.longitude };
    return undefined;
  }, [currentLocation]);

  const handleFenceIn = useCallback((stationName: string) => {
    setToastMessage(`${stationName} 정류장에 진입했습니다.`);
    setTimeout(() => setToastMessage(null), 1000);
  }, []);

  const careGeofences = useCareGeofence(safeLocation);
  usePaypassGeofenceEventSender(safeLocation, paypassCenters, visibleRegion, handleFenceIn);

  const moveToLocation = useCallback((coords: Location.LocationObjectCoords) => {
    mapRef.current?.animateToRegion({
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  }, []);

  const initializeLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('오류', '위치 권한이 필요합니다.');
      return;
    }

    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setCurrentLocation(pos.coords);
      moveToLocation(pos.coords);
    } catch {
      Alert.alert('오류', '위치를 가져올 수 없습니다.');
    }
  }, [moveToLocation]);

  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  // 실시간 위치 서버 전송
  useEffect(() => {
    const sendLocation = async () => {
      if (!currentLocation) return;
      try {
        await axios.post(`${Global.URL}/user/saveUserLocation`, {
          number: Global.NUMBER,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
      } catch (err) {
        console.error('위치 전송 오류:', err);
      }
    };

    const intervalId = setInterval(sendLocation, 5000);
    return () => clearInterval(intervalId);
  }, [currentLocation]);

  // 사용자 이동 경로 요청 및 저장
  useEffect(() => {
    const fetchUserMovingHistory = async () => {
      try {
        const res = await axios.post(`${Global.URL}/geofence/getUserMovingHistory`, {
          number: Global.NUMBER,
        });
        setUserPath(res.data); // [{ latitude, longitude }, ...]
      } catch (err) {
        console.error('이동 경로 불러오기 실패:', err);
      }
    };

    fetchUserMovingHistory();
  }, []);

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

  const isInVisibleRegion = (station: Station) => {
    if (!visibleRegion) return false;
    const latMin = visibleRegion.latitude - visibleRegion.latitudeDelta / 2;
    const latMax = visibleRegion.latitude + visibleRegion.latitudeDelta / 2;
    const lngMin = visibleRegion.longitude - visibleRegion.longitudeDelta / 2;
    const lngMax = visibleRegion.longitude + visibleRegion.longitudeDelta / 2;

    return (
      station.latitude >= latMin && station.latitude <= latMax &&
      station.longitude >= lngMin && station.longitude <= lngMax
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {toastMessage && (
        <View className="absolute bottom-28 left-4 right-4 bg-green-500 rounded-xl px-4 py-2 items-center z-50">
          <Text className="text-white font-semibold">{toastMessage}</Text>
        </View>
      )}

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
          onRegionChangeComplete={(region) => setVisibleRegion(region)}
        >
          {/* 실시간 사용자 위치 마커 */}
          <Marker coordinate={region}>
            <View style={{ alignItems: 'center', width: 40 }}>
              <View className="p-3 rounded-full shadow-lg border-4 border-white bg-green-500">
                <Navigation size={10} color="white" />
              </View>
              <View className="mt-1 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                <Text className="text-xs font-medium text-green-600">내 위치</Text>
              </View>
            </View>
          </Marker>

          {/* 사용자 이동 경로 Polyline */}
          {userPath.length > 1 && (
            <Polyline
              coordinates={userPath}
              strokeColor="#2563eb"
              strokeWidth={4}
            />
          )}

          {/* 지오펜스 */}
          {careGeofences.map((fence) => (
            <Circle
              key={fence.id}
              center={fence.center}
              radius={fence.radius}
              strokeColor={fence.strokeColor}
              fillColor={fence.fillColor}
            />
          ))}

          {/* 주변 정류장 */}
          {paypassCenters.filter(isInVisibleRegion).map((station) => (
            <Circle
              key={station.stationNumber}
              center={{ latitude: station.latitude, longitude: station.longitude }}
              radius={30}
              strokeColor="rgba(59, 130, 246, 1)"
              fillColor="rgba(59, 130, 246, 0.2)"
            />
          ))}
        </MapView>

        {/* 현재 위치로 이동 버튼 */}
        <TouchableOpacity
          className="absolute bottom-20 right-4 bg-white p-4 rounded-full shadow-lg border border-gray-200"
          onPress={moveToMyLocation}
        >
          <Locate size={24} color="#2563eb" />
        </TouchableOpacity>
      </View>

      <BottomNav current="MapPage" />
    </SafeAreaView>
  );
};

export default UserMapPage;
