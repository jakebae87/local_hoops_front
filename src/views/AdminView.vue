<template>
  <div class="admin-container">
    <h1 class="admin-title">📌 관리자 페이지</h1>
    <button class="refresh-btn" @click="fetchMarkerRequests">🔄 등록 요청 목록 불러오기</button>

    <div class="grid-wrapper">
      <!-- ✅ 테이블 헤더 (항상 상단 고정) -->
      <div class="grid-header">
        <div>ID</div>
        <div>제목</div>
        <div>위도</div>
        <div>경도</div>
        <div>등록일</div>
        <div>승인</div>
        <div>거부</div>
      </div>

      <!-- ✅ 데이터 리스트 -->
      <div v-for="request in markerRequests" :key="request.id" class="grid-row">
        <div>{{ request.id }}</div>
        <div>{{ request.title }}</div>
        <div>{{ request.latitude }}</div>
        <div>{{ request.longitude }}</div>
        <div>{{ new Date(request.created_at).toLocaleDateString() }}</div>
        <div><button class="approve-btn" @click="approveMarker(request.id)">✅ 승인</button></div>
        <div><button class="reject-btn" @click="rejectMarker(request.id)">❌ 거부</button></div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import apiClient from "@/api/axios";

export default {
  setup() {
    const markerRequests = ref([]);

    // ✅ 등록 요청 목록 불러오기
    const fetchMarkerRequests = async () => {
      try {
        const response = await apiClient.get("/markers/requests");
        markerRequests.value = response.data;
      } catch (error) {
        console.error("🚨 등록 요청 목록 불러오기 실패:", error);
      }
    };

    // ✅ 마커 승인
    const approveMarker = async (id) => {
      try {
        await apiClient.post(`/markers/approve/${id}`);
        alert("마커가 승인되었습니다.");
        fetchMarkerRequests();
      } catch (error) {
        console.error("🚨 마커 승인 실패:", error);
      }
    };

    // ✅ 마커 거부
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

<style>
/* ✅ 관리자 페이지 컨테이너 */
.admin-container {
  width: 90%;
  margin: 20px auto;
  text-align: center;
}

/* ✅ 제목 스타일 */
.admin-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
}

/* ✅ 새로고침 버튼 */
.refresh-btn {
  padding: 10px;
  background: #007bff;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 5px;
  font-size: 16px;
  margin-bottom: 15px;
}

.refresh-btn:hover {
  background: #0056b3;
}

/* ✅ 테이블 전체 감싸는 박스 */
.grid-wrapper {
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  background: #f9f9f9;
  border-radius: 5px;
  overflow: hidden;
}

/* ✅ 헤더 스타일 (고정) */
.grid-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #007bff;
  color: white;
  font-weight: bold;
  padding: 10px;
  border-bottom: 2px solid #0056b3;
}

/* ✅ 개별 행 스타일 */
.grid-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  padding: 8px;
  border-bottom: 1px solid #ddd;
  align-items: center;
  background: white;
}

/* ✅ 버튼 스타일 */
.approve-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 5px;
}

.approve-btn:hover {
  background: #218838;
}

.reject-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 5px;
}

.reject-btn:hover {
  background: #c82333;
}

/* ✅ 반응형 */
@media (max-width: 768px) {
  .grid-header, .grid-row {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
