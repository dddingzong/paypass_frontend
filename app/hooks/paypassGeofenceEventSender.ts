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

interface VisibleRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export default function usePaypassGeofenceEventSender(
  currentLocation?: { latitude: number; longitude: number },
  stations: Station[] = [],
  visibleRegion?: VisibleRegion
) {
  const prevInside = useRef<Set<number>>(new Set());
  const sentStationIds = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!currentLocation || stations.length === 0) return;

    const nowInside = new Set<number>();
    const entered: Station[] = [];
    const exited: Station[] = [];

    const isInVisibleRegion = (station: Station) => {
      if (!visibleRegion) return true;
      const latMin = visibleRegion.latitude - visibleRegion.latitudeDelta / 2;
      const latMax = visibleRegion.latitude + visibleRegion.latitudeDelta / 2;
      const lngMin = visibleRegion.longitude - visibleRegion.longitudeDelta / 2;
      const lngMax = visibleRegion.longitude + visibleRegion.longitudeDelta / 2;

      return (
        station.latitude >= latMin && station.latitude <= latMax &&
        station.longitude >= lngMin && station.longitude <= lngMax
      );
    };

    for (const station of stations) {
      if (!isInVisibleRegion(station)) continue;

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
          satationNumber: `station-${station.stationNumber}`,
          name: station.name,
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
          stationNumber: `station-${station.stationNumber}`,
          name: station.name,
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
  }, [currentLocation?.latitude, currentLocation?.longitude, stations, visibleRegion]);
}
