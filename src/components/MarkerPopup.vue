<template>
  <div class="popup-overlay">
    <div class="popup">
      <div class="popup-content">
        <h3>{{ isDetail ? "마커 상세 정보" : "마커 추가" }}</h3>

        <!-- 제목 -->
        <input v-model="title" placeholder="제목 입력" :disabled="isDetail" />

        <!-- 내용 -->
        <textarea v-model="content" placeholder="내용 입력" :disabled="isDetail"></textarea>

        <!-- 이미지 미리보기 -->
        <div class="preview">
          <img v-if="previewImages.length" :src="previewImages[0]" />
        </div>

        <!-- 상세 조회 시 삭제 버튼 추가 -->
        <div class="buttons">
          <button @click="closePopup">닫기</button>
          <button v-if="!isDetail" @click="saveMarker">저장</button>
          <button v-if="isDetail" class="delete-btn" @click="deleteMarker">삭제</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, watch } from "vue";

export default {
  props: ["position", "marker", "isDetail"],
  emits: ["close", "save", "delete"],
  setup(props, { emit }) {
    const title = ref("");
    const content = ref("");
    const previewImages = ref([]);

    // ✅ 마커 클릭 시 기존 데이터 불러오기
    watch(
      () => props.marker,
      (newMarker) => {
        if (newMarker) {
          title.value = newMarker.title || "";
          content.value = newMarker.content || "";
          previewImages.value = newMarker.images ? [newMarker.images] : [];
        } else {
          title.value = "";
          content.value = "";
          previewImages.value = [];
        }
      },
      { immediate: true }
    );

    const closePopup = () => emit("close");

    const saveMarker = () => {
      if (!props.position) return;

      const markerData = {
        latitude: props.position.getLat(),
        longitude: props.position.getLng(),
        title: title.value.trim() || "제목 없음",
        content: content.value.trim() || "내용 없음",
        images: previewImages.value[0] || null,
      };

      console.log("📤 저장할 마커 데이터:", markerData);
      emit("save", markerData);
    };

    const deleteMarker = () => {
      if (!props.marker || !props.marker.id) return;
      console.log("🗑️ 삭제할 마커 ID:", props.marker.id);
      emit("delete", props.marker.id);
    };

    return { title, content, previewImages, closePopup, saveMarker, deleteMarker };
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
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.popup {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  width: 320px;
  max-width: 90%;
}

input,
textarea {
  width: 100%;
  padding: 8px;
  font-size: 14px;
}

.buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.delete-btn {
  background-color: red;
  color: white;
}
</style>
