import LinkPage from '@/app/LinkPage';
import LogPage from '@/app/LogPage';
import MapPage from '@/app/MapPage';
import MyPage from '@/app/MyPage';
import SelectRole from '@/app/SelectRole';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SelectRole" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SelectRole" component={SelectRole} />
        <Stack.Screen name="MapPage" component={MapPage} />
        <Stack.Screen name="LogPage" component={LogPage} />
        <Stack.Screen name="MyPage" component={MyPage} />
        <Stack.Screen name="LinkPage" component={LinkPage} />
        {/* 필요한 페이지를 여기에 계속 등록 */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
