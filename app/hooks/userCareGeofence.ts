import Global from '@/constants/Global';
import axios from 'axios';
import { useEffect, useState } from 'react';

export interface CareGeofence {
  id: string;
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number;
  strokeColor: string;
  fillColor: string;
  label?: string;
}

function getDistance(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const aVal =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
  return R * c;
}

export default function useCareGeofence(currentLocation?: { latitude: number; longitude: number }) {
  const [careGeofences, setCareGeofences] = useState<CareGeofence[]>([]);
  const [currentFence, setCurrentFence] = useState<string | null>(null);
  const [lastEntry, setLastEntry] = useState<{ name: string; time: Date } | null>(null);

  useEffect(() => {
    const shouldFetch =
      Global.USER_ROLE === 'user' ||
      (Global.USER_ROLE === 'supporter' && Global.TARGET_NUMBER);

    if (!shouldFetch) return;

    const number = Global.USER_ROLE === 'user' ? Global.NUMBER : Global.TARGET_NUMBER;

    const fetchGeofence = async () => {
      const response = await axios.post(`${Global.URL}/geofence/getCareGeofence`, { number }, {
        validateStatus: (status) => status === 200 || status === 404,
      });

      if (response.status === 404 || !response.data) {
        console.warn('지오펜스 없음 (404):', number);
        return;
      }

      const { homeLatitude, homeLongitude, centerLatitude, centerLongitude } = response.data;

      const newGeofences: CareGeofence[] = [
        {
          id: 'home',
          name: '집',
          center: { latitude: homeLatitude, longitude: homeLongitude },
          radius: 100,
          strokeColor: 'rgba(0, 122, 255, 0.5)',
          fillColor: 'rgba(0, 122, 255, 0.1)',
        },
        {
          id: 'center',
          name: '센터',
          center: { latitude: centerLatitude, longitude: centerLongitude },
          radius: 100,
          strokeColor: 'rgba(255, 122, 0, 0.5)',
          fillColor: 'rgba(255, 122, 0, 0.1)',
        },
      ];

      setCareGeofences(newGeofences);
    };

    fetchGeofence();
  }, []);

  useEffect(() => {
    if (!currentLocation || careGeofences.length === 0) return;

    const now = new Date();
    let isInside = false;

    for (const fence of careGeofences) {
      const dist = getDistance(currentLocation, fence.center);
      if (dist <= fence.radius) {
        isInside = true;

        if (!currentFence || currentFence !== fence.name) {
          const diffMinutes = lastEntry
            ? (now.getTime() - lastEntry.time.getTime()) / 1000 / 60
            : 0;

          if (lastEntry && diffMinutes <= 60 && currentFence) {
            axios
              .post(`${Global.URL}/geofence/careGeofence/algorithm`, {
                number: Global.NUMBER,
                history: [
                  { name: lastEntry.name, time: lastEntry.time.toISOString() },
                  { name: fence.name, time: now.toISOString() },
                ],
              })
              .then((res) => console.log('서버 응답:', res.data))
              .catch((err) => console.warn('지오펜스 이동 전송 실패:', err));
          }

          setCurrentFence(fence.name);
          setLastEntry({ name: fence.name, time: now });
        }

        break;
      }
    }

    if (!isInside) {
      setCurrentFence(null);
    }
  }, [currentLocation, careGeofences]);

  return careGeofences;
}
