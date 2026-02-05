export interface WeatherAdvice {
  status: string;
  advice: string;
  color: string;
  icon: string;
}

export const getWeatherAdvice = (temp: number, humidity: number, condition?: string): WeatherAdvice => {
  // Quy tắc dựa trên chỉ số THI (Temperature Humidity Index) cho gia cầm
  
  // Kiểm tra điều kiện thời tiết đặc biệt
  if (condition) {
    const cond = condition.toLowerCase();
    if (cond.includes('rain') || cond.includes('drizzle') || cond.includes('mưa')) {
      return {
        status: "CẢNH BÁO MƯA ƯỚT",
        advice: "Tránh để nền chuồng ẩm ướt. Kiểm tra mái che và chắn gió lùa để tránh bệnh hô hấp.",
        color: "#1976d2",
        icon: "weather-rainy"
      };
    }
    if (cond.includes('storm') || cond.includes('thunderstorm') || cond.includes('bão')) {
      return {
        status: "NGUY HIỂM GIÔNG BÃO",
        advice: "Gia cố chuồng trại, kiểm tra hệ thống điện và dự phòng thức ăn, nước sạch.",
        color: "#6a1b9a",
        icon: "weather-lightning-rainy"
      };
    }
  }

  if (temp > 32) {
    return {
      status: "NGUY CƠ SỐC NHIỆT",
      advice: "Bà con cần bật quạt, phun sương và bổ sung điện giải Vitamin C vào nước uống ngay.",
      color: "#d32f2f", // Red
      icon: "alert-octagon"
    };
  }
  
  if (temp < 15) {
    return {
      status: "CẢNH BÁO GIÓ LẠNH",
      advice: "Cần che chắn chuồng kín gió, bổ sung đèn sưởi và tăng thêm lớp trấu đệm lót.",
      color: "#1976d2", // Blue
      icon: "snowflake"
    };
  }
  
  if (humidity > 85) {
    return {
      status: "NGUY CƠ NẤM MỐC",
      advice: "Độ ẩm quá cao, dễ sinh nấm phổi và cầu trùng. Hãy đảo trấu và dùng men rắc chuồng.",
      color: "#f57c00", // Orange
      icon: "water-percent"
    };
  }
  
  return {
    status: "MÔI TRƯỜNG TỐT",
    advice: "Thời tiết lý tưởng. Đàn gà đang phát triển tốt trong điều kiện này.",
    color: "#2e7d32", // Green
    icon: "check-decagram"
  };
};
