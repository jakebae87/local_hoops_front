<template>
  <div>
    <div id="map" ref="mapContainer" class="map-container"></div>

    <!-- ✅ 장소 등록 요청 팝업 -->
    <MarkerPopup
      v-if="showPopup"
      :position="currentPosition"
      :marker="selectedMarker"
      :isDetail="isDetail"
      @close="closePopup"
      @save="fetchMarkers"
    />

    <!-- ✅ 관리자 요청 리스트 팝업 -->
    <div v-if="isAdmin && showRequestList" class="admin-request-popup">
      <h3>등록 요청 리스트</h3>
      <ul>
        <li v-for="request in markerRequests" :key="request.id" @click="fetchRequestDetail(request.id)">
          {{ request.title }} ({{ request.createdAt }})
        </li>
      </ul>
    </div>

    <!-- ✅ 관리자 승인/거부 상세 팝업 -->
    <div v-if="isAdmin && showRequestDetail" class="admin-detail-popup">
      <h3>요청 상세 정보</h3>
      <p>제목: {{ selectedRequest?.title }}</p>
      <p>내용: {{ selectedRequest?.content }}</p>
      <img v-if="selectedRequest?.image" :src="selectedRequest.image" />
      <button @click="approveMarker(selectedRequest?.id)">승인</button>
      <button @click="rejectMarker(selectedRequest?.id)">거부</button>
      <button @click="closeRequestDetail">닫기</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import MarkerPopup from "@/components/MarkerPopup.vue";
import apiClient from "@/api/axios";

export default {
  components: { MarkerPopup },
  setup() {
    const isAdmin = ref(localStorage.getItem("isAdmin") === "true");
    const showRequestList = ref(false);
    const showRequestDetail = ref(false);
    const showPopup = ref(false);
    const isDetail = ref(false);
    const selectedMarker = ref(null);
    const selectedRequest = ref(null);
    const currentPosition = ref(null);
    const markers = ref([]);
    const kakaoMarkers = ref([]);
    const map = ref(null);
    const markerRequests = ref([]); // 관리자 요청 리스트 추가

    // ✅ 지도 초기화
    const initMap = (center = { lat: 37.5665, lng: 126.9780 }) => {
      if (!window.kakao || !window.kakao.maps) {
        console.error("🚨 카카오맵 API가 로드되지 않았습니다.");
        return;
      }

      const container = document.getElementById("map");
      const options = { center: new window.kakao.maps.LatLng(center.lat, center.lng), level: 3 };
      map.value = new window.kakao.maps.Map(container, options);

      // ✅ 지도 클릭 시 팝업 열기
      window.kakao.maps.event.addListener(map.value, "click", (mouseEvent) => {
        console.log("📌 지도 클릭됨:", mouseEvent.latLng);
        currentPosition.value = mouseEvent.latLng;
        selectedMarker.value = null;
        isDetail.value = false;
        showPopup.value = true;
      });

      fetchMarkers();
    };

    // ✅ 승인된 마커 불러오기
    const fetchMarkers = async () => {
      try {
        const response = await apiClient.get("/markers/approve");
        markers.value = response.data;
        displayMarkers();
      } catch (error) {
        console.error("🚨 마커 불러오기 실패:", error);
      }
    };

    // ✅ 지도에 마커 표시
    const displayMarkers = () => {
      kakaoMarkers.value.forEach(marker => marker.setMap(null));
      kakaoMarkers.value = [];

      markers.value.forEach(markerData => {
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(markerData.latitude, markerData.longitude),
          map: map.value,
        });

        kakaoMarkers.value.push(marker);
        window.kakao.maps.event.addListener(marker, "click", () => {
          fetchMarkerDetail(markerData.id);
        });
      });
    };

    // ✅ 특정 마커 상세 조회
    const fetchMarkerDetail = async (id) => {
      try {
        const response = await apiClient.get(`/markers/${id}`);
        console.log("🟢 가져온 마커 데이터:", response.data);
        selectedMarker.value = response.data;
        isDetail.value = true;
        showPopup.value = true;
      } catch (error) {
        console.error("🚨 마커 상세 조회 실패:", error);
      }
    };

    // ✅ 요청 상세 정보 불러오기
    const fetchRequestDetail = async (id) => {
      try {
        const response = await apiClient.get(`/markers/requests/${id}`);
        selectedRequest.value = response.data;
        showRequestDetail.value = true;
      } catch (error) {
        console.error("🚨 요청 상세 조회 실패:", error);
      }
    };

    // ✅ 요청 승인
    const approveMarker = async (id) => {
      try {
        await apiClient.put(`/markers/approve/${id}`);
        alert("마커가 승인되었습니다.");
        fetchMarkers();
        showRequestDetail.value = false;
      } catch (error) {
        console.error("🚨 마커 승인 실패:", error);
      }
    };

    // ✅ 요청 거부
    const rejectMarker = async (id) => {
      try {
        await apiClient.delete(`/markers/${id}`);
        alert("마커가 거부되었습니다.");
        fetchMarkers();
        showRequestDetail.value = false;
      } catch (error) {
        console.error("🚨 마커 거부 실패:", error);
      }
    };

    // ✅ 팝업 닫기
    const closePopup = () => {
      showPopup.value = false;
      selectedMarker.value = null;
    };

    const closeRequestDetail = () => {
      showRequestDetail.value = false;
      selectedRequest.value = null;
    };

    // ✅ 관리자 요청 리스트 불러오기
    const fetchMarkerRequests = async () => {
      if (!isAdmin.value) return;
      try {
        const response = await apiClient.get("/markers/requests");
        markerRequests.value = response.data;
        showRequestList.value = true;
      } catch (error) {
        console.error("🚨 관리자 요청 리스트 불러오기 실패:", error);
      }
    };

    onMounted(() => {
      if (isAdmin.value) {
        fetchMarkerRequests();
      }
      if (!document.querySelector('script[src*="dapi.kakao.com"]')) {
        const script = document.createElement("script");
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_MAP_KEY&libraries=services`;
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        initMap();
      }
    });

    return {
      isAdmin, showRequestList, showRequestDetail, markers, fetchMarkers, displayMarkers, 
      selectedMarker, fetchMarkerDetail, closePopup, showPopup, isDetail,
      selectedRequest, fetchRequestDetail, approveMarker, rejectMarker, closeRequestDetail,
      currentPosition, markerRequests, fetchMarkerRequests
    };
  }
};
</script>

<style>
.map-container {
  width: 100%;
  height: 80vh;
}

.admin-request-popup, .admin-detail-popup {
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  padding: 10px;
  border-radius: 8px;
  z-index: 1000;
}
</style>
