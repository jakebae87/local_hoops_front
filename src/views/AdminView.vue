<template>
    <div>
      <h1>관리자 페이지</h1>
      <button @click="fetchMarkerRequests">등록 요청 목록 불러오기</button>
      <ul>
        <li v-for="request in markerRequests" :key="request.id">
          {{ request.title }}
          <button @click="approveMarker(request.id)">승인</button>
          <button @click="rejectMarker(request.id)">거부</button>
        </li>
      </ul>
    </div>
  </template>
  
  <script>
  import { ref, onMounted } from "vue";
  import apiClient from "@/api/axios";
  
  export default {
    setup() {
      const markerRequests = ref([]);
  
      const fetchMarkerRequests = async () => {
        try {
          const response = await apiClient.get("/markers/requests");
          markerRequests.value = response.data;
        } catch (error) {
          console.error("🚨 등록 요청 목록 불러오기 실패:", error);
        }
      };
  
      const approveMarker = async (id) => {
        try {
          await apiClient.put(`/markers/approve/${id}`);
          alert("마커가 승인되었습니다.");
          fetchMarkerRequests();
        } catch (error) {
          console.error("🚨 마커 승인 실패:", error);
        }
      };
  
      const rejectMarker = async (id) => {
        try {
          await apiClient.delete(`/markers/reject/${id}`);
          alert("마커가 거부되었습니다.");
          fetchMarkerRequests();
        } catch (error) {
          console.error("🚨 마커 거부 실패:", error);
        }
      };
  
      onMounted(() => {
        fetchMarkerRequests();
      });
  
      return { markerRequests, fetchMarkerRequests, approveMarker, rejectMarker };
    },
  };
  </script>
  