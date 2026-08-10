import { createRouter, createWebHistory, createWebHashHistory } from "vue-router";
import { loadGdfui } from "@/utils/gdfuiLoader";
import { ElMessage } from "element-plus";

const routes = [
  { path: "/", name: "双狐数据图形云服务", component: () => import("../views/Home.vue") },
  { path: "/Browse", name: "在线浏览", component: () => import("../views/Browse.vue") },
  { path: "/Plan", name: "平面图", component: () => import("../views/plan.vue") },
  { path: "/Well", name: "单井数据图", component: () => import("../views/Well.vue") },
  { path: "/3D", name: "3D场景", component: () => import("../views/3D.vue") },
  { path: "/MultiWell", name: "多井数据图", component: () => import("../views/MultiWell.vue") },
  { path: "/GraphSuit", name: "三维钻井轨迹图", component: () => import("../views/WellGraphSuit.vue") },
  { path: "/WorkArea", name: "工区场景", component: () => import("../views/WorkArea.vue") },
  { path: "/WorkArea3D", name: "3D工区场景", component: () => import("../views/WorkArea3D.vue") },
  { path: "/Seismic", name: "地震剖面场景", component: () => import("../views/Seismic.vue") },
  // { path: "/WellPlatform", name: "井平台编辑", component: () => import("../views/WellPlatform.vue") },
  { path: "/Isoline", name: "等值线网格化", component: () => import("../views/Isoline.vue") },
  { path: "/Survey", name: "测网", component: () => import("../views/Survey.vue") },
  { path: "/CombImgCommt", name: "合并图外注释", component: () => import("../views/CombImgCommt.vue") },
  { path: "/Seismics", name: "地震剖面", component: () => import("../views/Seismics.vue") },
  { path: "/Format", name: "格式转换", component: () => import("../views/Format.vue") },
  { path: "/Data", name: "数据查询", component: () => import("../views/Data.vue") },
  { path: "/Ctrl-Data", name: "空间数据查询", component: () => import("../views/Ctrl-Data.vue") },
  { path: "/test", name: "测试页", component: () => import("../views/test.vue") },
  { path: "/gistest", name: "测试页2", component: () => import("../views/gistest.vue") },
];
const router = createRouter({
  base: window.webConfig.routerBase,
  history: createWebHistory(window.webConfig.routerBase),
  // 无法修改服务器配置时使用 hash 模式
  routes,
});

// 需要加载 gdfui.js 的页面路径
const needGdfuiPages = [
  "/Browse",
  "/Plan",
  "/Well",
  "/3D",
  "/MultiWell",
  "/GraphSuit",
  "/WorkArea",
  "/WorkArea3D",
  "/Seismic",
  "/Isoline",
  "/Survey",
  "/CombImgCommt",
  "/Seismics",
  "/Format",
  "/Ctrl-Data",
  "/test",
  "/gistest",
];

router.beforeEach(async (to, from) => {
  document.title = to.name;
  
  // 检查是否需要加载 gdfui.js
  if (needGdfuiPages.includes(to.path)) {
    try {
      // 加载 gdfui.js
      await loadGdfui();
    } catch (error) {
      ElMessage.error("加载 gdfui.js 失败，请刷新页面重试");
      return false;
    }
  }
});

export default router;
