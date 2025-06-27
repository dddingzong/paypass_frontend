import Global from '@/constants/Global';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import * as Location from 'expo-location';
import {
  Bell,
  Locate,
  MapPin,
  Navigation,
  User,
  Users
} from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  SafeAreaView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { customMapStyle } from '../styles/MapPageStyles';

interface RealTimeLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
  speed?: number;
  heading?: number;
}

interface LocationTrackingState {
  isTracking: boolean;
  currentLocation: RealTimeLocation | null;
  locationHistory: RealTimeLocation[];
  error: string | null;
  isLoading: boolean;
}

interface UserLocation {
  lat: number;
  lng: number;
  name: string;
  status: string;
}

type UserRole = 'user' | 'supporter' | null;

interface MainPageProps {}

const MainPage: React.FC<MainPageProps> = () => {
  const navigation = useNavigation();

  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  const [userRole, setUserRole] = useState<UserRole>(null);

  const [locationState, setLocationState] = useState<LocationTrackingState>({
    isTracking: false,
    currentLocation: null,
    locationHistory: [],
    error: null,
    isLoading: false,
  });

  // 1. moveToLocation 먼저 정의
  const moveToLocation = useCallback((location: RealTimeLocation) => {
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }, 1000);
  }, []);

  // 2. startLocationTracking 정의, moveToLocation 의존
  const startLocationTracking = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationState(prev => ({
          ...prev,
          error: '위치 권한이 필요합니다.',
        }));
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
        },
        (newLocation) => {
          const realTimeLocation: RealTimeLocation = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            accuracy: newLocation.coords.accuracy || 0,
            timestamp: newLocation.timestamp,
            speed: newLocation.coords.speed || undefined,
            heading: newLocation.coords.heading || undefined,
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
      console.error('실시간 추적 실패:', error);
      setLocationState(prev => ({
        ...prev,
        error: '실시간 위치 추적 중 오류가 발생했습니다.',
      }));
    }
  }, [moveToLocation]);

  // 초기 위치 권한 요청 및 초기화, startLocationTracking, moveToLocation 의존
  useEffect(() => {
    const initializeLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== 'granted') {
          setLocationState(prev => ({
            ...prev,
            error: '위치 접근 권한이 필요합니다. 설정에서 권한을 허용해주세요.',
          }));
          return;
        }

        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const realTimeLocation: RealTimeLocation = {
          latitude: initialLocation.coords.latitude,
          longitude: initialLocation.coords.longitude,
          accuracy: initialLocation.coords.accuracy || 0,
          timestamp: initialLocation.timestamp,
          speed: initialLocation.coords.speed || undefined,
          heading: initialLocation.coords.heading || undefined,
        };

        setLocationState(prev => ({
          ...prev,
          currentLocation: realTimeLocation,
          locationHistory: [realTimeLocation],
          error: null,
        }));

        moveToLocation(realTimeLocation);
        await startLocationTracking();

      } catch (error) {
        console.error('위치 초기화 오류:', error);
        setLocationState(prev => ({
          ...prev,
          error: '위치 정보를 가져올 수 없습니다. GPS가 활성화되어 있는지 확인해주세요.',
        }));
      }
    };

    initializeLocation();
  }, [startLocationTracking, moveToLocation]);

  // 앱 상태 변화 감지 - 백그라운드 진입 시 위치 추적 중지
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'background' && locationState.isTracking) {
        stopLocationTracking();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [locationState.isTracking]);

  // 컴포넌트 언마운트 시 위치 추적 해제
  useEffect(() => {
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }
    };
  }, []);

  // 사용자 역할 초기 설정
  useEffect(() => {
    try {
      const role = Global.USER_ROLE;
      if (role === 'user' || role === 'supporter') {
        setUserRole(role);
      } else {
        setUserRole(null);
        console.warn('사용자 역할 오류 발생:', role);
      }
    } catch (error) {
      console.error('역할 가져오기 실패:', error);
    }
  }, []);

  useEffect(() => {
    const sendLocationToServer = async (location: RealTimeLocation) => {
      try {
        const httpResponse = await axios.post(`${Global.URL}/user/getUserLocation`, {
          number: Global.NUMBER,
          latitude: location.latitude,
          longitude: location.longitude,
        }, {
          headers: {
            'Content-Type': 'application/json',
          }
        });

        console.log('위치 전송 성공:', httpResponse.data, ', 전송 데이터: ', location);

      } catch (error) {
        console.error('서버 위치 전송 중 오류:', error);
      }
    };

    const intervalId = setInterval(() => {
      if (locationState.currentLocation) {
        sendLocationToServer(locationState.currentLocation);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [locationState.currentLocation]);

  // 위치 추적 중지 함수
  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    setLocationState(prev => ({
      ...prev,
      isTracking: false,
      isLoading: false,
    }));

    Alert.alert('추적 중지', '실시간 위치 추적이 중지되었습니다.');
  };

  // 내 위치로 지도 이동 (현재 위치 또는 새 위치 요청)
  const moveToMyLocation = async () => {
    if (locationState.currentLocation) {
      moveToLocation(locationState.currentLocation);
    } else {
      try {
        setLocationState(prev => ({ ...prev, isLoading: true }));

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const realTimeLocation: RealTimeLocation = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          accuracy: currentLocation.coords.accuracy || 0,
          timestamp: currentLocation.timestamp,
        };

        setLocationState(prev => ({
          ...prev,
          currentLocation: realTimeLocation,
          isLoading: false,
        }));

        moveToLocation(realTimeLocation);
      } catch (error) {
        console.error('현재 위치 가져오기 오류 발생:', error);
        setLocationState(prev => ({ ...prev, isLoading: false }));
        Alert.alert('오류', '현재 위치를 가져올 수 없습니다.');
      } 
    }
  };

  const navigateToScreen = (screenName: string): void => {
    navigation.navigate(screenName as never);
  };

  // 현재 표시할 위치 결정 (실시간 위치 우선)
  const getCurrentDisplayLocation = (): UserLocation | null => {
    if (locationState.currentLocation) {
      return {
        lat: locationState.currentLocation.latitude,
        lng: locationState.currentLocation.longitude,
        name: userRole === 'user' ? '내 위치' : '이용자 현재 위치',
        status: 'active',
      };
    }
    return null;
  };

  const userLocation = getCurrentDisplayLocation();

  if (!userLocation) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <Text className="text-gray-700 text-lg">위치 정보를 불러오는 중입니다. 잠시만 기다려 주세요</Text>
      </SafeAreaView>
    );
  }

  const region = {
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
  <SafeAreaView className="flex-1 bg-gray-50">
    <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

    {/* 상단 헤더 */}
    <View className="bg-white shadow-lg p-6">
      <View className="items-center">
        <Text className="text-2xl font-bold text-gray-900 mb-1">사용자 위치</Text>
        <Text className="text-sm text-gray-500">
          {locationState.isTracking
            ? userRole === 'user'
              ? '보호자에게 위치가 전송되고 있습니다.'
              : '보호자께서 선택하신 이용자의 위치를 표시 중입니다.'
            : 'GPS 미작동 중 '}
        </Text>
        {locationState.error && (
          <Text className="text-xs text-red-500 mt-1">{locationState.error}</Text>
        )}
      </View>
    </View>

    {/* 지도 영역 */}
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
        {/* 마커 */}
        <Marker
          coordinate={{
            latitude: userLocation.lat,
            longitude: userLocation.lng,
          }}
          title={userLocation.name}
          description={locationState.isTracking ? "실시간 추적 중" : "현재 위치"}
          anchor={{ x: 0.5, y: 1 }}
        >
          <View style={{ alignItems: 'center', width: 40 }}>
            <View className={`p-3 rounded-full shadow-lg border-4 border-white ${
              locationState.isTracking ? 'bg-green-500' : 'bg-blue-500'
            }`}>
              {userRole === 'supporter' ? (
                <User size={10} color="white" />
              ) : (
                <Navigation size={10} color="white" />
              )}
            </View>
            <View className="mt-1 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-200">
              <Text className={`text-xs font-medium ${
                locationState.isTracking ? 'text-green-600' : 'text-blue-600'
              }`}>
                {userLocation.name}
              </Text>
            </View>
          </View>
        </Marker>
      </MapView>

      {/* 내 위치 버튼 */}
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

    {/* 하단 네비게이션 */}
    <View className="bg-white border-t border-gray-100 px-4 py-2"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          }}
    >
      <View className="flex-row justify-center space-x-6">
        <TouchableOpacity className="items-center py-3 px-4">
          <View className="bg-blue-50 p-2 rounded-full">
            <MapPin size={24} color="#2563eb" />
          </View>
          <Text className="text-xs text-blue-600 mt-2 font-medium">지도</Text>
        </TouchableOpacity>

        {/* supporter만 보는 메뉴 */}
        {userRole === 'supporter' && (
          <TouchableOpacity
            className="items-center py-3 px-4"
            onPress={() => navigateToScreen('LinkPage')}
          >
            <View className="bg-gray-50 p-2 rounded-full">
              <Users size={24} color="#6b7280" />
            </View>
            <Text className="text-xs text-gray-600 mt-2">이용자</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          className="items-center py-3 px-4"
          onPress={() => navigateToScreen('LogPage')}
        >
          <View className="bg-gray-50 p-2 rounded-full">
            <Bell size={24} color="#6b7280" />
          </View>
          <Text className="text-xs text-gray-600 mt-2">기록</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="items-center py-3 px-4"
          onPress={() => navigateToScreen('MyPage')}
        >
          <View className="bg-gray-50 p-2 rounded-full">
            <User size={24} color="#6b7280" />
          </View>
          <Text className="text-xs text-gray-600 mt-2">마이페이지</Text>
        </TouchableOpacity>
      </View>
    </View>
  </SafeAreaView>
  );
};

export default MainPage;