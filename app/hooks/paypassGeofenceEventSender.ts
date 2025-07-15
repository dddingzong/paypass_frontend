import Global from '@/constants/Global';
import { getDistance } from '@/utils/locationUtils';
import axios from 'axios';
import { useEffect, useRef } from 'react';

interface Station {
  stationNumber: number;
  name: string;
  latitude: number;
  longitude: number;
}

export default function usePaypassGeofenceEventSender(
  currentLocation?: { latitude: number; longitude: number },
  stations: Station[] = []
) {
  const prevInside = useRef<Set<number>>(new Set());
  const sentStationIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!currentLocation || stations.length === 0) return;

    const nowInside = new Set<number>();
    const entered: Station[] = [];
    const exited: Station[] = [];

    for (const station of stations) {
      const dist = getDistance(currentLocation, {
        latitude: Number(station.latitude),
        longitude: Number(station.longitude),
      });

      const isIn = dist <= 70;

      if (isIn) {
        nowInside.add(station.stationNumber);
        if (!prevInside.current.has(station.stationNumber)) {
          entered.push(station);
        }
      } else {
        if (prevInside.current.has(station.stationNumber)) {
          exited.push(station);
        }
      }
    }

    entered.forEach((station) => {
      if (sentStationIds.current.has(station.stationNumber)) return;

      axios
        .post(`${Global.URL}/geofence/UserfenceIn`, {
          number: Global.NUMBER,
          geofenceId: `station-${station.stationNumber}`,
          geofenceName: station.name,
        })
        .then(() => {
          sentStationIds.current.add(station.stationNumber);
          console.log(`[진입] ${station.name}`);
        })
        .catch((err) => {
          console.warn(`[진입 실패] ${station.name}`, err);
        });
    });

    exited.forEach((station) => {
      if (!sentStationIds.current.has(station.stationNumber)) return;

      axios
        .post(`${Global.URL}/geofence/UserfenceOut`, {
          number: Global.NUMBER,
          geofenceId: `station-${station.stationNumber}`,
          geofenceName: station.name,
        })
        .then(() => {
          sentStationIds.current.delete(station.stationNumber);
          console.log(`[이탈] ${station.name}`);
        })
        .catch((err) => {
          console.warn(`[이탈 실패] ${station.name}`, err);
        });
    });

    prevInside.current = nowInside;
  }, [currentLocation?.latitude, currentLocation?.longitude, stations]);
}
