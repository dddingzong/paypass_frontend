import usePaypassGeofenceEventSender from '@/app/hooks/paypassGeofenceEventSender';
import useCareGeofence from '@/app/hooks/userCareGeofence';
import BottomNav from '@/app/src/components/BottomNav';
import Global from '@/constants/Global';
import axios from 'axios';
import * as Location from 'expo-location';
import { Locate } from 'lucide-react-native';
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
    setTimeout(() => setToastMessage(null), 3000);
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

  // 1. 초기 MovingHistory 불러오기
  useEffect(() => {
    const fetchUserMovingHistory = async () => {
      try {
        const res = await axios.post(`${Global.URL}/geofence/getUserMovingHistory`, {
          number: Global.NUMBER,
        });
        setUserPath(res.data); // 초기 경로 로드
        console.log("유저 이동경로 초기 로딩:", res.data);
      } catch (err) {
        console.error('이동 경로 불러오기 실패:', err);
      }
    };
    fetchUserMovingHistory();
  }, []);

  // 2. 실시간 위치 추적 + Polyline 실시간 갱신 (1초마다)
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription;

    const startWatching = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 0,
        },
        (location) => {
          const { latitude, longitude } = location.coords;
          setCurrentLocation(location.coords);
          setUserPath((prevPath) => {
            const newPath = [...prevPath, { latitude, longitude }];
            return newPath.length > 300 ? newPath.slice(newPath.length - 300) : newPath;
          });
        }
      );
    };

    startWatching();
    return () => {
      if (locationSubscription) locationSubscription.remove();
    };
  }, []);

  // 3. 서버로 위치 전송 (5초마다)
  useEffect(() => {
    const sendLocation = async () => {
      if (!currentLocation) return;
      try {
        await axios.post(`${Global.URL}/user/saveUserLocation`, {
          number: Global.NUMBER,
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        });
        console.log("서버에 위치 전송:", currentLocation);
      } catch (err) {
        console.error('위치 전송 오류:', err);
      }
    };

    const intervalId = setInterval(sendLocation, 1000);
    return () => clearInterval(intervalId);
  }, [currentLocation]);

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

  const getCareGeofenceIcon = (id: string) => {
    if (id === 'home') return require('@/assets/images/home_icon64.png');
    if (id === 'center') return require('@/assets/images/center_icon64.png');
    return require('@/assets/images/station_pin64.png');
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
          showsPointsOfInterest={false}
          showsTraffic={false}
          onRegionChangeComplete={(region) => setVisibleRegion(region)}
        >
          {/* 실시간 사용자 위치 마커 */}
          <Marker
            coordinate={region}
            image={require('@/assets/images/my_location_icon128.png')}
            anchor={{ x: 0.5, y: 0.5 }}
          />

          {/* 사용자 이동 경로 Polyline */}
          {userPath.length > 1 && (
            <Polyline
              coordinates={userPath}
              strokeColor="#2563eb"
              strokeWidth={4}
            />
          )}

          {/* 지오펜스 + 아이콘 */}
          {careGeofences.map((fence) => (
            <React.Fragment key={`fence-${fence.id}`}>
              <Circle
                center={fence.center}
                radius={fence.radius}
                strokeColor={fence.strokeColor}
                fillColor={fence.fillColor}
              />
              <Marker
                coordinate={fence.center}
                anchor={{ x: 0.5, y: 0.5 }}
                image={getCareGeofenceIcon(fence.id)}
              />
            </React.Fragment>
          ))}

          {/* 주변 정류장 */}
          {paypassCenters.filter(isInVisibleRegion).map((station) => (
            <React.Fragment key={`station-${station.stationNumber}`}>
              <Circle
                center={{ latitude: station.latitude, longitude: station.longitude }}
                radius={20}
                strokeColor="rgba(59, 130, 246, 1)"
                fillColor="rgba(59, 130, 246, 0.2)"
              />
              <Marker
                coordinate={{ latitude: station.latitude, longitude: station.longitude }}
                anchor={{ x: 0.5, y: 0.5 }}
                image={require('@/assets/images/station_pin64.png')}
              />
            </React.Fragment>
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

      <BottomNav current="MapRouterPage" />
    </SafeAreaView>
  );
};

export default UserMapPage;
