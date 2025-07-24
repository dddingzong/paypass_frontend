import BottomNav from '@/app/src/components/BottomNav';
import Global from '@/constants/Global';
import axios from 'axios';
import { DollarSign, Wallet } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface WalletInfo {
  number: string;
  balance: number;       
  pendingAmount: number; 
}

interface UserPending {
  number: string;
  name: string;
  relation: string;
  pendingAmount: number;
}

const getNextSunday = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const daysUntilSunday = (7 - dayOfWeek) % 7 || 7;
  const nextSunday = new Date(today);
  nextSunday.setDate(today.getDate() + daysUntilSunday);
  return `${nextSunday.getFullYear()}-${(nextSunday.getMonth() + 1)
    .toString()
    .padStart(2, '0')}-${nextSunday.getDate().toString().padStart(2, '0')}`;
};

const WalletPage: React.FC = () => {
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [usersPending, setUsersPending] = useState<UserPending[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [modalType, setModalType] = useState<'charge' | 'withdraw' | null>(null);
  const [amount, setAmount] = useState<string>('');

  const fetchWalletInfo = async () => {
    try {
      const res = await axios.post(`${Global.URL}/wallet/getWalletInfo`, {
        number: Global.NUMBER,
      });
      setWalletInfo(res.data);
    } catch (err) {
      console.error('지갑 정보 불러오기 실패:', err);
    }
  };

  const fetchUsersPending = async () => {
    try {
      const res = await axios.post(`${Global.URL}/wallet/getUsersPendingList`, {
        number: Global.NUMBER,
      });
      console.log("서버 응답:", res.data); // 여기서 데이터 확인
      setUsersPending(res.data);
    } catch (err) {
      console.error('이용자 결제 예정 금액 불러오기 실패:', err);
    } 
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchWalletInfo();
      if (Global.USER_ROLE === 'supporter') {
        await fetchUsersPending();
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const handleConfirm = async () => {
    const numericAmount = parseInt(amount, 10);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('오류', '올바른 금액을 입력하세요.');
      return;
    }

    try {
      const url =
        modalType === 'charge'
          ? `${Global.URL}/wallet/charge`
          : `${Global.URL}/wallet/withdraw`;

      await axios.post(url, {
        number: Global.NUMBER,
        amount: numericAmount,
      });

      Alert.alert('완료', `${modalType === 'charge' ? '충전' : '출금'}이 완료되었습니다.`);
      setModalType(null);
      setAmount('');
      await fetchWalletInfo();
    } catch (err) {
      console.error(`${modalType === 'charge' ? '충전' : '출금'} 실패:`, err);
      Alert.alert('오류', `${modalType === 'charge' ? '충전' : '출금'} 중 오류가 발생했습니다.`);
    }
  };

  if (loading || !walletInfo) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="mt-2 text-gray-700">지갑 정보를 불러오는 중입니다...</Text>
      </SafeAreaView>
    );
  }

  // 총 결제 예정 금액 (자신 + 이용자들)
  const totalPendingAmount =
    walletInfo.pendingAmount + usersPending.reduce((sum, u) => sum + u.pendingAmount, 0);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* 보유 현금 */}
        <View className="bg-white rounded-lg shadow-sm p-5 mt-4 border border-gray-100">
          <View className="flex-row items-center mb-3">
            <Wallet size={20} color="#2563eb" />
            <Text className="ml-2 text-lg font-bold text-gray-800">보유 현금</Text>
          </View>
          {/* paypass_card.png 이미지 삽입 */}
          <View
            style={{
              padding: 14,
              backgroundColor: '#f3f4f6', // 연한 배경
              borderRadius: 12,
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <Image
              source={require('@/assets/images/paypass_card.png')}
              style={{ width: 400, height: 180 }}
            />
          </View>
          <Text className="text-2xl font-extrabold text-green-600 mb-4">
            {walletInfo.balance.toLocaleString()}원
          </Text>

          {/* 충전하기 & 빼기 버튼 */}
          <View className="flex-row">
            <TouchableOpacity
              className="flex-1 bg-gray-100 border border-gray-300 rounded-lg py-3 mr-2"
              onPress={() => setModalType('charge')}
            >
              <Text className="text-center text-gray-700 font-semibold">충전하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-gray-100 border border-gray-300 rounded-lg py-3"
              onPress={() => setModalType('withdraw')}
            >
              <Text className="text-center text-gray-700 font-semibold">빼기</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 결제 예정 금액 */}
        <View className="bg-white rounded-lg shadow-sm p-5 mt-4 border border-gray-100">
          <View className="flex-row items-center mb-1">
            <DollarSign size={20} color="#2563eb" />
            <Text className="ml-2 text-lg font-bold text-gray-800">총 결제 예정 금액</Text>
          </View>
          <Text className="text-sm text-gray-500 mb-2">
            결제 예정일: {getNextSunday()} (일요일)
          </Text>
          <Text className="text-xl font-semibold text-red-500">
            {totalPendingAmount.toLocaleString()}원
          </Text>
        </View>

        {/* supporter 전용: 이용자별 결제 예정 */}
        {Global.USER_ROLE === 'supporter' && (
          <View className="bg-white rounded-lg shadow-sm p-5 mt-4 border border-gray-100">
            <Text className="text-lg font-bold text-gray-800 mb-3">이용자 결제 예정 금액</Text>
            {usersPending.length > 0 ? (
              <>
                {usersPending.map((user, index) => (
                  <View
                    key={user.number}
                    className="py-3 border-b border-gray-100"
                  >
                    <View className="flex-row justify-between">
                      <Text className="text-gray-900 font-semibold">
                        {user.name} ({user.relation})
                      </Text>
                      <Text className="text-gray-800">
                        {user.pendingAmount.toLocaleString()}원
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            ) : (
              <Text className="text-gray-500">이용자 결제 예정 금액이 없습니다.</Text>
            )}
          </View>
        )}
      </ScrollView>

      {/* 금액 입력 모달 */}
      <Modal
        visible={modalType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setModalType(null)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-lg p-6 w-full">
            <Text className="text-lg font-bold mb-4">
              {modalType === 'charge' ? '충전 금액 입력' : '출금 금액 입력'}
            </Text>
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-3 text-center text-xl mb-4"
              placeholder="금액을 입력하세요"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
            <View className="flex-row">
              <TouchableOpacity
                className="flex-1 bg-gray-200 rounded-lg py-3 mr-2"
                onPress={() => setModalType(null)}
              >
                <Text className="text-center font-medium text-gray-700">취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-blue-600 rounded-lg py-3"
                onPress={handleConfirm}
              >
                <Text className="text-center font-medium text-white">확인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNav current="WalletPage" />
    </SafeAreaView>
  );
};

export default WalletPage;
