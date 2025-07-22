const Global = {
  URL: 'http://192.168.45.111:8080',
  NUMBER: "",
  TARGET_NUMBER: "",
  USER_ROLE: "",
  PAYPASS_CENTERS: [],

  // type: 요양원, 복지센터, 주야간보호센터
  CARE_CENTERS: [
    {
      id: 1,
      name: "노원노동복지센터",
      centerStreetAddress: "서울 노원구 상계동 650",
      type: "복지센터",
      centerAddress: "01674",
    },
    {
      id: 2,
      name: "행복나눔노인복지센터",
      centerStreetAddress: "서울 노원구 하계1동 256",
      type: "복지센터",
      centerAddress: "01748",
    },
    {
      id: 3,
      name: "다담 노인 복지센터",
      centerStreetAddress: "서울 노원구 하계동 256",
      type: "복지센터",
      centerAddress: "01748",
    },
    {
      id: 4,
      name: "동천일리하우스",
      centerStreetAddress: "서울 노원구 하계동 288-1",
      type: "요양원",
      centerAddress: "01747",
    },
    {
      id: 5,
      name: "나눔과사랑노인방문요양센터",
      centerStreetAddress: "서울 노원구 하계1동 251",
      type: "요양원",
      centerAddress: "01791",
    },
    {
      id: 6,
      name: "나무그늘재가복지센터",
      centerStreetAddress: "서울 노원구 중계동 502-1",
      type: "요양원",
      centerAddress: "01777",
    },
    {
      id: 7,
      name: "모두케어 주야간보호센터",
      centerStreetAddress: "경기 구리시 사노동 339-3",
      type: "주야간보호센터",
      centerAddress: "11905",
    },
    {
      id: 8,
      name: "예담주야간보호센터",
      centerStreetAddress: "서울 동대문구 장안동 295-1",
      type: "주야간보호센터",
      centerAddress: "02530",
    },
  ],
};

export default Global;
