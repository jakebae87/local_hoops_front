<template>
  <div class="popup-overlay">
    <div class="popup">
      <h3>마커 추가</h3>
      <input v-model="title" placeholder="제목 입력" />
      <textarea v-model="content" placeholder="내용 입력"></textarea>
      <input type="file" multiple @change="onFileChange" />
      <button @click="saveMarker">저장</button>
      <button @click="closePopup">취소</button>
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import apiClient from "@/api/axios";

export default {
  props: ["position"],
  emits: ["close", "save"],
  setup(props, { emit }) {
    const title = ref("");
    const content = ref("");
    const images = ref([]);

    // ✅ 이미지 업로드 처리
    const onFileChange = (event) => {
      images.value = Array.from(event.target.files);
    };

    // ✅ 마커 저장 요청
    const saveMarker = async () => {
      if (!title.value || images.value.length === 0) {
        alert("제목과 최소 1장의 이미지를 등록해야 합니다.");
        return;
      }

      const formData = new FormData();
      formData.append("title", title.value);
      formData.append("content", content.value);
      formData.append("latitude", props.position.getLat());
      formData.append("longitude", props.position.getLng());
      images.value.forEach((image, index) => {
        formData.append(`images[${index}]`, image);
      });

      try {
        await apiClient.post("/markers/request", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        alert("마커 등록 요청이 완료되었습니다. 관리자의 승인을 기다려 주세요.");
        emit("save");  // ✅ 등록 후 마커 목록 새로고침
        closePopup();
      } catch (error) {
        console.error("🚨 마커 저장 요청 실패:", error);
      }
    };

    const closePopup = () => {
      emit("close");
    };

    return { title, content, images, onFileChange, saveMarker, closePopup };
  },
};
</script>

<style>
.popup-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.popup {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}
</style>
