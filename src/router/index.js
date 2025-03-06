import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue"; // ✅ 파일명 변경

const routes = [
  { path: "/", name: "HomeView", component: HomeView }, // ✅ 이름 변경
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
