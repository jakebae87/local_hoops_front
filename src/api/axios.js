// src/api/axios.js
import axios from "axios";

const apiClient = axios.create({
  baseURL: "http://localhost:9000/api", // ✅ 백엔드 서버 주소
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiClient;
