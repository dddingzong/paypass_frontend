import Global from '@/constants/Global';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import { Clock, MapPin } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

interface DetailLog {
  id: number;
  logId: number;
  number: string;
  fenceInTime: string;
  fenceOutTime: string | null;
  stationNumber: number;
  stationName: string;
  busNumberString?: string;
}

interface StationLocation {
  stationNumber: number;
  latitude: number;
  longitude: number;
}

interface UserLocation {
  latitude: number;
  longitude: number;
}

const DetailLogPage: React.FC = () => {
  const route = useRoute();
  const { logId } = route.params as { logId: number };

  const [detailLogs, setDetailLogs] = useState<DetailLog[]>([]);
  const [stationLocations, setStationLocations] = useState<StationLocation[]>([]);
  const [userPath, setUserPath] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resLogs = await axios.post(`${Global.URL}/detailLog/getDetailLogList`, { logId });
        const logs: DetailLog[] = resLogs.data;
        setDetailLogs(logs);

        const stationRes: StationLocation[] = [];
        for (const log of logs) {
          const res = await axios.post(`${Global.URL}/station/getStationLatLng`, {
            stationNumber: log.stationNumber,
          });
          const { latitude, longitude } = res.data;
          stationRes.push({
            stationNumber: log.stationNumber,
            latitude,
            longitude,
          });
        }
        setStationLocations(stationRes);

        // 사용자 위치 기반 이동 경로 조회
        const fenceInTime = logs[0]?.fenceInTime;
        const fenceOutTime = logs[logs.length - 1]?.fenceOutTime ?? logs[logs.length - 1]?.fenceInTime;

        const pathRes = await axios.post(`${Global.URL}/user/getUserLocationList`, {
          number: Global.NUMBER,
          fenceInTime: fenceInTime,
          fenceOutTime: fenceOutTime,
        });
        setUserPath(pathRes.data);

        console.log(pathRes.data);
        console.log(typeof pathRes.data[0].latitude); // 'number'여야 함


      } catch (e) {
        console.error('데이터 조회 실패:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [logId]);

  const formatTime = (time: string) => time.slice(0, 16).replace('T', ' ');

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : (
        <>
          {stationLocations.length > 0 && (
            <MapView
              style={{ height: 300 }}
              initialRegion={{
                latitude: stationLocations[0].latitude,
                longitude: stationLocations[0].longitude,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005,
              }}
            >
              {stationLocations.map((loc, idx) => (
                <Marker
                  key={idx}
                  coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                  image={require('@/assets/images/station_pin128.png')}
                />
              ))}
              {userPath.length > 1 && (
                <Polyline
                  coordinates={userPath.map(p => ({
                    latitude: Number(p.latitude),
                    longitude: Number(p.longitude),
                  }))}
                  strokeColor="#34D399"
                  strokeWidth={3}
                  zIndex={100}
                />
              )}
            </MapView>
          )}

          <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
            <View className="p-4">
              {detailLogs.length >= 2 && (
                <TouchableOpacity
                  onPress={() => setShowAll(!showAll)}
                  className="bg-white rounded-lg shadow p-4 mb-4"
                >
                  <Text className="text-gray-900 font-bold text-lg mb-2">이동 요약</Text>
                  <Text className="text-sm text-gray-700 mb-1">
                    출발: {detailLogs[0]?.stationName} ({formatTime(detailLogs[0].fenceInTime)})
                  </Text>
                  <Text className="text-sm text-gray-700 mb-1">
                    도착: {detailLogs[detailLogs.length - 1]?.stationName} (
                    {detailLogs[detailLogs.length - 1].fenceOutTime
                      ? formatTime(detailLogs[detailLogs.length - 1].fenceOutTime!): '이탈 정보 없음'})
                  </Text>
                  <Text className="text-sm text-blue-600 mt-2">
                    {showAll ? '접기 ▲' : '전체 보기 ▼'}
                  </Text>
                </TouchableOpacity>
              )}

              {showAll && detailLogs.map((item) => (
                <View key={item.id} className="bg-white rounded-lg shadow-sm mb-4 p-4">
                  <View className="flex-row items-center mb-2">
                    <MapPin size={20} color="#2563eb" />
                    <Text className="text-sm text-gray-800 ml-2">
                      정류장: {item.stationName}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Clock size={14} color="#6b7280" />
                    <Text className="text-sm text-gray-600 ml-1">
                      진입: {formatTime(item.fenceInTime)}
                    </Text>
                  </View>
                  {item.fenceOutTime && (
                    <View className="flex-row items-center mt-1">
                      <Clock size={14} color="#6b7280" />
                      <Text className="text-sm text-gray-600 ml-1">
                        이탈: {formatTime(item.fenceOutTime)}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>

          <View
            className="absolute bottom-5 left-4 right-4 flex-row justify-between items-center px-4 py-3 rounded-xl"
            style={{ backgroundColor: '#ffffffee', elevation: 10, zIndex: 10 }}
          >
            <Text className="text-base font-bold text-black">
              탑승 가능 버스: {detailLogs[0]?.busNumberString ?? '정보 없음'}
            </Text>
            <TouchableOpacity className="bg-red-600 px-4 py-2 rounded-lg">
              <Text className="text-white font-bold">문의하기</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

export default DetailLogPage;
