import Global from '@/constants/Global';
import { useNavigation } from '@react-navigation/native'; // 페이지간 이동 담당
import axios from 'axios';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface LoginPageProps {}

const LoginPage: React.FC<LoginPageProps> = () => {
  const navigation = useNavigation();
  const [number, setNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await axios.post(`${Global.URL}/login/signIn`, {
        number,
        password,
      });
      Global.NUMBER = number;
      navigation.navigate('SelectRole' as never);
    } catch (error: any) {
      const message = error.response?.data?.message || '로그인 실패, react-native 오류.';
      Alert.alert('로그인 실패', message);
      console.error('로그인 실패 : ', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert('비밀번호 찾기', '추후 추가될 서비스 입니다.');
  };

  const handleSignup = () => {
    navigation.navigate('Signup' as never);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 20}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full max-w-sm bg-white rounded-lg shadow-lg p-6 mx-auto">
            <View className="items-center mb-8">
              <Image
                source={require('../assets/images/icon_sample2.png')}
                className="w-20 h-20"
                resizeMode="contain"
              />
              <Text className="text-2xl font-bold text-teal-800 mt-4 mb-2">로그인</Text>
              <Text className="text-gray-600 text-center">
                계정 정보를 입력하여 로그인하세요
              </Text>
            </View>

            <View className="space-y-4">
              <View className="space-y-2">
                <Text className="text-sm font-medium text-gray-700">전화번호</Text>
                <TextInput
                  className="w-full px-3 py-3 border border-gray-300 rounded-md bg-white text-gray-900"
                  placeholder="숫자만 입력해주세요"
                  value={number}
                  onChangeText={setNumber}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="phone-pad"
                />
              </View>

              <View className="space-y-2">
                <Text className="text-sm font-medium text-gray-700">비밀번호</Text>
                <TextInput
                  className="w-full px-3 py-3 border border-gray-300 rounded-md bg-white text-gray-900"
                  placeholder="비밀번호를 입력해주세요"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View className="flex-row justify-end mt-2 mb-4">
                <TouchableOpacity onPress={handleForgotPassword}>
                  <Text className="text-xs text-teal-600">비밀번호 찾기</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                className={`w-full py-3 rounded-md items-center justify-center ${
                  isLoading ? 'bg-teal-400' : 'bg-teal-600'
                }`}
                onPress={handleLogin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-medium ml-2">로그인 중...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-medium">로그인</Text>
                )}
              </TouchableOpacity>
            </View>

            <View className="mt-6 items-center">
              <Text className="text-sm text-gray-600">
                계정이 없으신가요?{' '}
                <Text className="text-teal-600" onPress={handleSignup}>
                  회원가입
                </Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

export default LoginPage;
