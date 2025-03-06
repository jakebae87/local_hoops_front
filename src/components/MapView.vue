<template>
  <div>
    <div id="map" ref="mapContainer" class="map-container"></div> <!-- ✅ class 추가 -->

    <!-- ✅ 마커 팝업 (신규 추가 & 상세 조회) -->
    <MarkerPopup
      v-if="showPopup"
      :position="currentPosition"
      :marker="selectedMarker"
      :isDetail="isDetail"
      @close="closePopup"
      @save="saveMarker"
      @delete="deleteMarker"
    />
  </div>
</template>

<script>
import { ref, onMounted } from "vue";
import MarkerPopup from "@/components/MarkerPopup.vue";
import apiClient from "@/api/axios"; // ✅ Axios 불러오기

export default {
  components: { MarkerPopup },
  setup() {
    const map = ref(null);
    const showPopup = ref(false);
    const isDetail = ref(false);
    const currentPosition = ref(null);
    const selectedMarker = ref(null);
    const markers = ref([]); 
    const kakaoMarkers = ref([]); 

    // ✅ 1. DB에서 마커 불러오기
    const fetchMarkers = async () => {
      try {
        const response = await apiClient.get("/markers");
        console.log("📥 서버에서 불러온 마커 데이터:", response.data);

        // ✅ 마커 데이터 업데이트 (Vue 반응형)
        markers.value = response.data.map(marker => ({
          id: marker.id,
          latitude: parseFloat(marker.latitude),
          longitude: parseFloat(marker.longitude),
          title: marker.title,
          content: marker.content,
          images: marker.images || null,
        }));

        displayMarkers(); // 마커 표시
      } catch (error) {
        console.error("🚨 마커 불러오기 실패:", error);
      }
    };

    // ✅ 2. 지도 초기화
    const initMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        console.error("🚨 카카오맵 API가 로드되지 않았습니다.");
        return;
      }

      const container = document.getElementById("map");
      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심 좌표
        level: 3,
      };
      map.value = new window.kakao.maps.Map(container, options);

      // ✅ 지도 클릭 시 팝업 열기
      window.kakao.maps.event.addListener(map.value, "click", (mouseEvent) => {
        currentPosition.value = mouseEvent.latLng;
        selectedMarker.value = null;
        isDetail.value = false;
        showPopup.value = true;
      });

      fetchMarkers(); // 기존 마커 불러오기
    };

    // ✅ 3. 지도에서 기존 마커 삭제 후 다시 표시
    const displayMarkers = () => {
      kakaoMarkers.value.forEach(marker => marker.setMap(null));
      kakaoMarkers.value = [];

      markers.value.forEach((markerData) => {
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(markerData.latitude, markerData.longitude),
          map: map.value,
        });

        window.kakao.maps.event.addListener(marker, "click", () => {
          console.log("🟢 클릭된 마커 정보:", markerData); // ✅ 마커 정보 콘솔 출력
          fetchMarkerDetail(markerData.id);
        });

        kakaoMarkers.value.push(marker); // ✅ 지도에 추가된 마커 저장
      });
    };

    // ✅ 4. 특정 마커 상세 조회
    const fetchMarkerDetail = async (id) => {
      try {
        const response = await apiClient.get(`/markers/${id}`);
        console.log("📌 마커 상세 정보:", response.data);

        selectedMarker.value = response.data;
        isDetail.value = true;
        showPopup.value = true;
      } catch (error) {
        console.error("🚨 마커 상세 조회 실패:", error);
      }
    };

    // ✅ 4. 마커 저장 (서버로 전송)
    const saveMarker = async (markerData) => {
      try {
        console.log("📤 서버로 전송할 데이터:", markerData); // ✅ 데이터 확인

        const response = await apiClient.post("/markers", markerData, {
          headers: { "Content-Type": "application/json" },
        });

        
        if (!response.data || response.data.length === 0) {
            console.error("❌ 저장된 마커 데이터가 비어 있음:", response);
            return;
        }

        console.log("✅ 전체 마커 데이터 (서버 응답):", response.data);

        markers.value = response.data; // ✅ 전체 마커 리스트 업데이트

        displayMarkers(); // ✅ 저장 후 마커 다시 표시
        closePopup();
      } catch (error) {
        console.error("🚨 마커 저장 실패:", error.response ? error.response.data : error.message);
      }
    };

    // ✅ 5. 특정 마커 삭제
    const deleteMarker = async (id) => {
      try {
        await apiClient.delete(`/markers/${id}`);
        console.log("🗑️ 마커 삭제 완료:", id);

        await fetchMarkers(); // ✅ 추가됨: 삭제 후 최신 데이터 반영
        closePopup();
      } catch (error) {
        console.error("🚨 마커 삭제 실패:", error);
      }
    };

    // ✅ 5. 팝업 닫기
    const closePopup = () => {
      showPopup.value = false;
      selectedMarker.value = null;
    };

    onMounted(() => {
      if (!document.querySelector('script[src*="dapi.kakao.com"]')) {
        const script = document.createElement("script");
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_MAP_KEY&libraries=services`;
        script.onload = initMap;
        document.head.appendChild(script);
      } else {
        initMap();
      }
    });

    return { showPopup, currentPosition, saveMarker, selectedMarker, isDetail, deleteMarker, closePopup };
  },
};
</script>

<style>
#map {
  width: 100%;
  height: 600px;
}
</style>
