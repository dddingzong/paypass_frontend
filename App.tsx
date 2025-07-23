import index from '@/app/index';
import LinkPage from '@/app/LinkPage';
import LogPage from '@/app/LogPage';
import MapRouterPage from '@/app/MapRouterPage';
import MyPage from '@/app/MyPage';
import SelectRole from '@/app/SelectRole';
import WalletPage from '@/app/WalletPage';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { initializeApp } from 'firebase/app';
import React from 'react';

const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};

// ✅ 앱 시작 시 Firebase 초기화
initializeApp(firebaseConfig);

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SelectRole" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" component={index} />
        <Stack.Screen name="SelectRole" component={SelectRole} />
        <Stack.Screen name="MapRouterPage" component={MapRouterPage} />
        <Stack.Screen name="LogPage" component={LogPage} />
        <Stack.Screen name="MyPage" component={MyPage} />
        <Stack.Screen name="LinkPage" component={LinkPage} />
        <Stack.Screen name="WalletPage" component={WalletPage} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
