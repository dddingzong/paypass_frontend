import Global from '@/constants/Global';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Bell, MapPin, User, Users } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';

type RootStackParamList = {
  MapPage: undefined;
  LogPage: undefined;
  MyPage: undefined;
  LinkPage: undefined;
  SelectRole: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

type ScreenName = keyof RootStackParamList;

interface BottomNavProps {
  current: ScreenName;
}

const BottomNav: React.FC<BottomNavProps> = ({ current }) => {
  const navigation = useNavigation<NavigationProp>();

  const userTabs: { screen: ScreenName; icon: React.FC<any>; label: string }[] = [
    { screen: 'MapPage', icon: MapPin, label: '지도' },
    { screen: 'LogPage', icon: Bell, label: '기록' },
    { screen: 'MyPage', icon: User, label: '마이페이지' },
  ];

  const supporterTabs: { screen: ScreenName; icon: React.FC<any>; label: string }[] = [
    { screen: 'MapPage', icon: MapPin, label: '지도' },
    { screen: 'LinkPage', icon: Users, label: '이용자' },
    { screen: 'LogPage', icon: Bell, label: '기록' },
    { screen: 'MyPage', icon: User, label: '마이페이지' },
  ];

  const tabs = Global.USER_ROLE === 'supporter' ? supporterTabs : userTabs;

  return (
    <View className="bg-white border-t border-gray-200 p-4 pb-8">
      <View className="flex-row justify-center space-x-8">
        {tabs.map(({ screen, icon: Icon, label }) => (
          <TouchableOpacity
            key={screen}
            onPress={() => {
              if (screen !== current) {
                navigation.replace(screen);
              }
            }}
            className="items-center py-2 px-4"
          >
            <Icon size={24} color={current === screen ? '#2563EB' : '#6B7280'} />
            <Text className={`text-xs mt-1 ${current === screen ? 'text-blue-600' : 'text-gray-600'}`}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export default BottomNav;
