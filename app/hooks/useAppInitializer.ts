
import Global from '@/constants/Global';
import axios from 'axios';
import { useEffect } from 'react';

export default function useAppInitializer() {
  useEffect(() => {
    const fetchStationList = async () => {
      try {
        const response = await axios.get(`${Global.URL}/station/getStationList`);
        Global.PAYPASS_CENTERS = response.data;
        console.log('[INIT] 정류장 목록 불러옴:', Global.PAYPASS_CENTERS.length, '개의 정류장');
      } catch (error) {
        console.error('[INIT] 정류장 목록 불러오기 실패:', error);
      }
    };

    fetchStationList();
  }, []);
}
