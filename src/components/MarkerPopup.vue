<template>
  <div class="popup-overlay">
    <div class="popup">
      <!-- ✅ 제목 -->
      <h3 class="popup-title">{{ title }}</h3>
      <input v-if="!isDetail" v-model="title" placeholder="설명을 입력해 주세요." class="popup-input" maxlength="30"/>

      <!-- ✅ 이미지 미리보기 (클릭하면 확대) -->
      <div v-if="images.length" class="popup-images">
        <img v-for="(img, index) in images" :key="index" :src="getImagePath(img)" class="popup-img" @click="openImageModal(index)" />
      </div>

      <!-- ✅ 파일 업로드 (승인되지 않은 마커일 때만 가능) -->
      <div class="file-upload-section" v-if="!isDetail">
        <p v-if="images.length === 0" class="file-upload-info">이미지 파일은 최대 3개</p>
        <input type="file" multiple @change="onFileChange" class="popup-file" />
      </div>

      <!-- ✅ 승인된 마커에서만 댓글 입력 가능 -->
      <textarea v-if="isDetail" v-model="comment" placeholder="댓글을 입력하세요..." class="popup-comment"></textarea>

      <!-- ✅ 버튼 -->
      <div class="popup-buttons">
        <button @click="closePopup" class="btn">닫기</button>
        <button v-if="!isDetail" @click="saveMarker" class="btn btn-save">저장</button>
      </div>
    </div>

    <!-- ✅ 이미지 확대 모달 -->
    <div v-if="modalImageIndex !== null" class="image-modal">
      <img :src="getImagePath(images[modalImageIndex])" class="modal-content" />
      <button class="close-button" @click="closeImageModal">✖</button>
    </div>
  </div>
</template>

<script>
import { ref, watch } from "vue";
import apiClient from "@/api/axios";

export default {
  props: ["marker", "isDetail", "position"], 
  emits: ["close", "save"],
  setup(props, { emit }) {
    const title = ref("");
    const images = ref([]);
    const comment = ref("");
    const modalImageIndex = ref(null);
    const loading = ref(false);

    watch(
      () => props.marker,
      (newMarker) => {
        if (newMarker) {
          title.value = newMarker.title || "";
          images.value = Array.isArray(newMarker.images) ? newMarker.images : (typeof newMarker.images === "string" ? newMarker.images.split(",") : []);
        }
      },
      { immediate: true }
    );

    const getImagePath = (img) => {
      if (!img) return "/default-image.png";
      return typeof img === "string"
        ? (img.startsWith("/uploads/") ? `http://localhost:9000${img}` : img)
        : (img instanceof File ? URL.createObjectURL(img) : "/default-image.png");
    };

    const onFileChange = (event) => {
      if (props.isDetail) return;
      
      const files = event.target.files;
      if (files.length > 3) {
        alert("최대 3개의 이미지만 업로드할 수 있습니다.");
        return;
      }

      images.value = Array.from(files).filter(file => {
        if (!file.type.startsWith("image/")) {
          alert("이미지 파일만 업로드 가능합니다.");
          return false;
        }
        return true;
      });
    };

    const openImageModal = (index) => {
      modalImageIndex.value = index;
    };

    const closeImageModal = () => {
      modalImageIndex.value = null;
    };

    const saveMarker = async () => {
  const { latitude, longitude } = props.position;

  if (!title.value || images.value.length === 0) {
    alert("제목과 최소 1장의 이미지를 등록해야 합니다.");
    return;
  }

  loading.value = true;

  try {
    // ✅ AI 서버에서 이미지 검증 (하나씩)
    for (const image of images.value) {
      const aiFormData = new FormData();
      aiFormData.append("file", image);

      const aiResponse = await apiClient.post("http://localhost:8000/detect/", aiFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("🚀 AI 응답:", aiResponse.data); // ✅ 응답 확인

      if (!aiResponse.data || !aiResponse.data.result) {
        console.error("🚨 AI 서버 응답 오류: 데이터가 null이거나 예상과 다름", aiResponse);
        alert("🚨 AI 서버 응답 오류: 올바른 응답을 받지 못했습니다.");
        loading.value = false;
        return;
      }

      if (aiResponse.data.result !== "valid") {
        alert("❌ 첨부된 이미지 중 농구 골대가 감지되지 않았습니다.");
        loading.value = false;
        return;
      }
    }

    // ✅ 검증 통과 후 마커 등록
    const formData = new FormData();
    formData.append("title", title.value);
    formData.append("latitude", latitude);
    formData.append("longitude", longitude);
    images.value.forEach(image => formData.append("files", image));

    const response = await apiClient.post("/markers/request", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    if (response.data.error) {
      alert(response.data.error);
    } else {
      alert(response.data.message);
      emit("save");
      closePopup();
    }
  } catch (error) {
    console.error("🚨 마커 저장 요청 실패:", error);
    alert("🚨 오류 발생: " + (error.response?.data?.message || "네트워크 오류"));
  } finally {
    loading.value = false;
  }
};



    const closePopup = () => {
      emit("close");
    };

    return { title, images, comment, onFileChange, saveMarker, closePopup, getImagePath, modalImageIndex, openImageModal, closeImageModal };
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
  width: 50%;
  height: 50%;
  max-width: 420px;
  max-height: 300px;
  text-align: left;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.file-upload-info {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

/* ✅ 설명 입력란란 */
.popup-input {
  font-size: 16px;
  padding: 5px;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 5px;
}

/* ✅ 설명 (승인된 마커) */
.popup-title {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 15px;
}

/* ✅ 이미지 미리보기 */
.popup-images {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.popup-img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 5px;
  cursor: pointer;
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

/* ✅ 이미지 확대 모달 */
.image-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 500px;
  height: 500px;
  border-radius: 10px;
  z-index: 10001;
}

.modal-content {
  max-width: 100%;
  max-height: 100%;
  border-radius: 10px;
}

/* ✅ 닫기 버튼 */
.close-button {
  position: absolute;
  top: 10px;
  right: 20px;
  font-size: 20px;
  cursor: pointer;
  color: white;
  background: none;
  border: none;
}
</style>
