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

export default function useCareGeofence() {
  const [careGeofences, setCareGeofences] = useState<CareGeofence[]>([]);

  useEffect(() => {
    const shouldFetch =
      (Global.USER_ROLE === 'user') ||
      (Global.USER_ROLE === 'supporter' && Global.TARGET_NUMBER);

    if (!shouldFetch) return;

    const number = Global.USER_ROLE === 'user' ? Global.NUMBER : Global.TARGET_NUMBER;

    const fetchGeofence = async () => {
      const response = await axios.post(`${Global.URL}/geofence/getCareGeofence`, { number },
        {
          validateStatus: (status) => status === 200 || status === 404,
        }
      );

      if (response.status === 404 || !response.data) {
        console.warn('지오펜스 없음 (404):', number);
        return;
      }

      const {homeLatitude,homeLongitude,centerLatitude,centerLongitude,} = response.data;

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

  return careGeofences;
}
