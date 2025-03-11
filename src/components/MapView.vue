<template>
  <div>
    <div id="map" ref="mapContainer" class="map-container"></div>

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

    // ✅ 1. 지도 초기화 (사용자 위치 또는 기본 위치)
    const initMap = (latitude, longitude) => {
      if (!window.kakao || !window.kakao.maps) {
        console.error("🚨 카카오맵 API가 로드되지 않았습니다.");
        return;
      }

      const container = document.getElementById("map");
      const options = {
        center: new window.kakao.maps.LatLng(latitude, longitude),
        level: 3,
      };
      map.value = new window.kakao.maps.Map(container, options);

      fetchMarkers(); // ✅ 기존 마커 불러오기

      // ✅ 지도 클릭 시 팝업 열기
      window.kakao.maps.event.addListener(map.value, "click", (mouseEvent) => {
        currentPosition.value = mouseEvent.latLng;
        selectedMarker.value = null;
        isDetail.value = false;
        showPopup.value = true;
      });
    };

    // ✅ 2. 사용자 위치 가져오기
    const getUserLocation = () => {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log("📌 위치 확인 성공:", position.coords);
            initMap(position.coords.latitude, position.coords.longitude);
          },
          (error) => {
            console.warn("🚨 위치 접근 거부 또는 오류 발생:", error);
            initMap(37.5665, 126.9780); // ✅ 기본 위치(서울) 사용
          }
        );
      } else {
        console.error("🚨 Geolocation이 지원되지 않는 브라우저입니다.");
        initMap(37.5665, 126.9780);
      }
    };

    // ✅ 3. 마커 불러오기
    const fetchMarkers = async () => {
      try {
        const response = await apiClient.get("/markers");
        console.log("📥 서버에서 불러온 마커 데이터:", response.data);

        markers.value = response.data.map((marker) => ({
          id: marker.id,
          latitude: parseFloat(marker.latitude),
          longitude: parseFloat(marker.longitude),
          title: marker.title,
          content: marker.content,
          images: marker.images || null,
        }));

        displayMarkers();
      } catch (error) {
        console.error("🚨 마커 불러오기 실패:", error);
      }
    };

    // ✅ 4. 마커 표시
    const displayMarkers = () => {
      kakaoMarkers.value.forEach((marker) => marker.setMap(null));
      kakaoMarkers.value = [];

      markers.value.forEach((markerData) => {
        const marker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(markerData.latitude, markerData.longitude),
          map: map.value,
        });

        window.kakao.maps.event.addListener(marker, "click", () => {
          console.log("🟢 클릭된 마커 정보:", markerData);
          fetchMarkerDetail(markerData.id);
        });

        kakaoMarkers.value.push(marker);
      });
    };

    // ✅ 5. 특정 마커 상세 조회
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

    // ✅ 6. 마커 저장 (서버로 전송)
    const saveMarker = async (markerData) => {
      try {
        console.log("📤 서버로 전송할 데이터:", markerData);

        const response = await apiClient.post("/markers", markerData, {
          headers: { "Content-Type": "application/json" },
        });

        if (!response.data || response.data.length === 0) {
          console.error("❌ 저장된 마커 데이터가 비어 있음:", response);
          return;
        }

        console.log("✅ 전체 마커 데이터 (서버 응답):", response.data);

        markers.value = response.data; // ✅ 전체 마커 리스트 업데이트
        displayMarkers();
        closePopup();
      } catch (error) {
        console.error("🚨 마커 저장 실패:", error.response ? error.response.data : error.message);
      }
    };

    // ✅ 7. 특정 마커 삭제
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

    // ✅ 8. 팝업 닫기
    const closePopup = () => {
      showPopup.value = false;
      selectedMarker.value = null;
    };

    // ✅ 9. 페이지 마운트 시 사용자 위치 요청
    onMounted(() => {
      if (!document.querySelector('script[src*="dapi.kakao.com"]')) {
        const script = document.createElement("script");
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=YOUR_KAKAO_MAP_KEY&libraries=services`;
        script.onload = getUserLocation;
        document.head.appendChild(script);
      } else {
        getUserLocation();
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
