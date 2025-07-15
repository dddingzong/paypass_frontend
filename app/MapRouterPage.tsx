// MapRouterPage.tsx
import Global from '@/constants/Global';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

// Stack param 정의
type RootStackParamList = {
  SelectRole: undefined;
  MapPage: undefined;
  UserMapPage: undefined;
  SupporterMapPage: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

const MapRouterPage = () => {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const role = Global.USER_ROLE;
    if (role === 'user') {
      navigation.replace('UserMapPage');
    } else if (role === 'supporter' && Global.TARGET_NUMBER) {
      navigation.replace('SupporterMapPage');
    } else {
      navigation.replace('SelectRole');
    }
  }, [navigation]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 10 }}>지도를 불러오는 중입니다...</Text>
    </View>
  );
};

export default MapRouterPage;
