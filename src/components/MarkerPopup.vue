<template>
  <div class="popup-overlay">
    <div class="popup">
      <!-- ✅ 제목 -->
      <h3 class="popup-title">{{ title }}</h3>
      <input v-if="!isDetail" v-model="title" placeholder="제목 입력" class="popup-input" disabled />

      <!-- ✅ 이미지 미리보기 -->
      <div v-if="images.length" class="popup-images">
        <img v-for="(img, index) in images" :key="index" :src="getImagePath(img)" class="popup-img" />
      </div>

      <!-- ✅ 파일 업로드 (승인되지 않은 마커일 때만 가능) -->
      <input v-if="!isDetail" type="file" multiple @change="onFileChange" class="popup-file" />

      <!-- ✅ 승인된 마커에서만 댓글 입력 가능 -->
      <textarea v-if="isDetail" v-model="comment" placeholder="댓글을 입력하세요..." class="popup-comment"></textarea>

      <!-- ✅ 버튼 -->
      <div class="popup-buttons">
        <button @click="closePopup" class="btn">닫기</button>
        <button v-if="!isDetail" @click="saveMarker" class="btn btn-save">저장</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from "vue";
import apiClient from "@/api/axios";

export default {
  props: ["marker", "isDetail"], // ✅ 마커 정보 props로 전달받음
  emits: ["close", "save"],
  setup(props, { emit }) {
    const title = ref("");
    const images = ref([]);
    const comment = ref("");

    // ✅ 마커가 변경될 때 UI 업데이트
    watch(
      () => props.marker,
      () => {
        if (props.marker) {
          title.value = props.marker.title || "";

          // ✅ images가 문자열이면 배열로 변환
          if (typeof props.marker.images === "string") {
            images.value = props.marker.images.split(",");
          } else if (Array.isArray(props.marker.images)) {
            images.value = props.marker.images;
          } else {
            images.value = [];
          }

          console.log("✅ 이미지 데이터 변환 완료:", images.value);
        }
      },
      { immediate: true }
    );

    // ✅ 이미지 경로 변환 함수 (백엔드 업로드 디렉토리 경로 추가)
    const getImagePath = (img) => {
      return img.startsWith("/uploads/") ? `http://localhost:9000${img}` : img;
    };

    const onFileChange = (event) => {
      if (props.isDetail) return; // ✅ 승인된 마커에서는 파일 수정 불가

      const files = event.target.files;
      images.value = [];

      for (let i = 0; i < Math.min(files.length, 3); i++) {
        const file = files[i];
        images.value.push(file);

        const reader = new FileReader();
        reader.onload = (e) => {
          images.value.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
    };

    // ✅ 마커 저장 요청
    const saveMarker = async () => {
      if (!title.value || images.value.length === 0) {
        alert("제목과 최소 1장의 이미지를 등록해야 합니다.");
        return;
      }

      const formData = new FormData();
      formData.append("title", title.value);
      formData.append("latitude", props.marker.latitude);
      formData.append("longitude", props.marker.longitude);
      images.value.forEach((image) => {
        formData.append("images", image);
      });

      // ✅ FormData 디버깅
      console.log("📌 전송할 FormData:");
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}:`, pair[1]);
      }

      try {
        await apiClient.post("/markers/request", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("마커 등록 요청이 완료되었습니다. 관리자의 승인을 기다려 주세요.");
        emit("save");
        closePopup();
      } catch (error) {
        console.error("🚨 마커 저장 요청 실패:", error);
      }
    };

    const closePopup = () => {
      emit("close");
    };

    return { title, images, comment, onFileChange, saveMarker, closePopup, getImagePath };
  },
};
</script>

<style>
/* ✅ 팝업 배경 */
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

/* ✅ 팝업 본체 */
.popup {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 320px;
  max-width: 90%;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* ✅ 제목 */
.popup-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
}

/* ✅ 이미지 미리보기 */
.popup-images {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 15px;
}

.popup-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 5px;
}

/* ✅ 댓글 입력 */
.popup-comment {
  width: 100%;
  height: 80px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 5px;
  resize: none;
  margin-bottom: 15px;
}

/* ✅ 버튼 스타일 */
.popup-buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.btn {
  flex: 1;
  padding: 8px;
  margin: 0 5px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.btn-save {
  background: #4caf50;
  color: white;
}
</style>
