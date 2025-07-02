import BottomNav from '@/app/src/components/BottomNav';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as Location from 'expo-location';
import {
  Locate,
  Navigation,
  User
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  BackHandler,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import Global from '@/constants/Global';
import { customMapStyle } from '../styles/MapPageStyles';

// Interface
interface RealTimeLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
}

interface LocationTrackingState {
  isTracking: boolean;
  currentLocation: RealTimeLocation | null;
  locationHistory: RealTimeLocation[];
  error: string | null;
  isLoading: boolean;
}

type UserRole = 'user' | 'supporter' | null;

//  Custom Hook: 재사용 함수
const useLocationTracking = (moveToLocation: (location: RealTimeLocation) => void) => {
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const [locationState, setLocationState] = useState<LocationTrackingState>({
    isTracking: false,
    currentLocation: null,
    locationHistory: [],
    error: null,
    isLoading: false,
  });

  const startTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationState(prev => ({ ...prev, error: '위치 권한이 필요합니다.' }));
        return;
      }

      locationSubscription.current?.remove();

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
        },
        (newLocation) => {
          const realTimeLocation: RealTimeLocation = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            timestamp: newLocation.timestamp,
          };

          setLocationState(prev => ({
            ...prev,
            currentLocation: realTimeLocation,
            locationHistory: [...prev.locationHistory.slice(-19), realTimeLocation],
            isTracking: true,
          }));

          moveToLocation(realTimeLocation);
        }
      );

      locationSubscription.current = subscription;
    } catch (error) {
      console.error('위치 추적 오류:', error);
      setLocationState(prev => ({
        ...prev,
        error: '실시간 위치 추적 중 오류가 발생했습니다.',
      }));
    }
  }, [moveToLocation]);

  const stopTracking = useCallback(() => {
    locationSubscription.current?.remove();
    locationSubscription.current = null;
    setLocationState(prev => ({ ...prev, isTracking: false, isLoading: false }));
    Alert.alert('추적 중지', '실시간 위치 추적이 중지되었습니다.');
  }, []);

  const initializeLocation = useCallback(async () => {
    try {
      setLocationState(prev => ({ ...prev, isLoading: true }));

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationState(prev => ({
          ...prev,
          error: '위치 접근 권한이 필요합니다.',
          isLoading: false,
        }));
        return;
      }

      const initial = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const location: RealTimeLocation = {
        latitude: initial.coords.latitude,
        longitude: initial.coords.longitude,
        timestamp: initial.timestamp,
      };

      setLocationState(prev => ({
        ...prev,
        currentLocation: location,
        locationHistory: [location],
        error: null,
        isLoading: false,
      }));

      moveToLocation(location);
      await startTracking();
    } catch (error) {
      console.error('초기 위치 오류:', error);
      setLocationState(prev => ({
        ...prev,
        error: 'GPS가 활성화되어 있는지 확인해주세요.',
        isLoading: false,
      }));
    }
  }, [moveToLocation, startTracking]);

  useEffect(() => {
    const handleAppStateChange = (state: string) => {
      if (state === 'background' && locationState.isTracking) {
        stopTracking();
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [locationState.isTracking, stopTracking]);

  useEffect(() => {
    return () => {
      locationSubscription.current?.remove();
      locationSubscription.current = null;
    };
  }, []);

  return { locationState, startTracking, stopTracking, initializeLocation };
};

// MapPage 
const MapPage: React.FC = () => {
  const navigation = useNavigation();
  const mapRef = useRef<MapView>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);

  useEffect(() => {
    console.log('현재 페이지 렌더링됨: MapPage');
  }, []);

  const moveToLocation = useCallback((location: RealTimeLocation) => {
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000); // 1초
  }, []);

  const { locationState, initializeLocation } = useLocationTracking(moveToLocation);

  useEffect(() => {
    initializeLocation();
  }, [initializeLocation]);

  useEffect(() => {
    const role = Global.USER_ROLE;
    setUserRole(role === 'user' || role === 'supporter' ? role : null);
  }, []);

  useEffect(() => {
    const sendLocation = async () => {
      if (!locationState.currentLocation) return;

      try {
        await axios.post(`${Global.URL}/user/getUserLocation`, {
          number: Global.NUMBER,
          latitude: locationState.currentLocation.latitude,
          longitude: locationState.currentLocation.longitude,
        }, {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (err) {
        console.error('위치 전송 오류:', err);
      }
    };

    const intervalId = setInterval(sendLocation, 5000);
    return () => clearInterval(intervalId);
  }, [locationState.currentLocation]);

  const moveToMyLocation = useCallback(async () => {
    if (locationState.currentLocation) {
      moveToLocation(locationState.currentLocation);
    } else {
      try {
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        const location: RealTimeLocation = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timestamp: pos.timestamp,
        };
        moveToLocation(location);
      } catch (err) {
        console.error('현재 위치 오류:', err);
        Alert.alert('오류', '현재 위치를 가져올 수 없습니다.');
      }
    }
  }, [locationState.currentLocation, moveToLocation]);

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

  if (!locationState.currentLocation) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-700 text-lg">위치 정보를 불러오는 중입니다.</Text>
      </SafeAreaView>
    );
  }

  const region = {
    latitude: locationState.currentLocation.latitude,
    longitude: locationState.currentLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 상단 정보 영역 */}
      <View className="bg-white shadow-lg p-6 items-center">
        <Text className="text-2xl font-bold text-gray-900 mb-1">사용자 위치</Text>
        <Text className="text-sm text-gray-500">
          {locationState.isTracking
            ? userRole === 'user'
              ? '사용자의 위치를 수집 중입니다.'
              : '이용자의 위치를 표시 중입니다.'
            : 'GPS 미작동 중'}
        </Text>
        {locationState.error && (
          <Text className="text-xs text-red-500 mt-1">{locationState.error}</Text>
        )}
      </View>

      {/* 지도 */}
      <View className="flex-1 relative">
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          initialRegion={region}
          customMapStyle={customMapStyle}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
          toolbarEnabled={false}
        >
          <Marker
            coordinate={region}
            title={userRole === 'user' ? '내 위치' : '이용자 위치'}
            description={locationState.isTracking ? '실시간 추적 중' : '현재 위치'}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={{ alignItems: 'center', width: 40 }}>
              <View className={`p-3 rounded-full shadow-lg border-4 border-white ${
                locationState.isTracking ? 'bg-green-500' : 'bg-blue-500'
              }`}>
                {userRole === 'supporter'
                  ? <User size={10} color="white" />
                  : <Navigation size={10} color="white" />}
              </View>
              <View className="mt-1 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
                <Text className={`text-xs font-medium ${
                  locationState.isTracking ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {userRole === 'user' ? '내 위치' : '이용자 위치'}
                </Text>
              </View>
            </View>
          </Marker>
        </MapView>

        {/* 내 위치 이동 버튼 */}
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

export default MapPage;
