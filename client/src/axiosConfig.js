// axiosConfig.js
import axios from 'axios';

// 建立一個 axios 實例
const instance = axios.create({
  baseURL: '/',  
// 其他預設設定...
});

// 攔截回應，若收到 401 錯誤則提示用戶並導向登入頁
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      window.alert("登入已過期，請重新登入");
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default instance;
