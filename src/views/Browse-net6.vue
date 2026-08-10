<template>
  <SceneHeader />
  <Fab @handlepaly="handleFabClick" class="fab" />
  <div class="main">
    <div :class="['tree-box', { collapsed: isTreeCollapsed }]">
      <div :class="['tree-bar', { show: isTreeCollapsed }]" @click.stop="toggleTree">
        <SvgIcon class="btn-icon" name="sidebar-unsel" color="#666" height="16px" />
      </div>
      <el-scrollbar height="100%">
        <el-tree style="max-width: 600px" :data="tableData" :props="defaultProps" :default-expand-all="true" @node-click="handleNodeClick">
          <template #default="{ node, data }">
            <div class="file-item">
              <span :title="node.label" class="file-name">{{ node.label }}</span>
              <p v-if="node.id === 1">
                <SvgIcon class="btn-icon" name="sidebar-unsel" color="#666" height="16px" @click.stop="toggleTree" />
              </p>
              <span v-if="data.Size !== null" class="file-size">{{ formatSize(data.Size) }}</span>
            </div>
          </template>
        </el-tree>
      </el-scrollbar>
    </div>
    <div :class="['ctrl-box', { collapsed: isTreeCollapsed }]">
      <div class="gdfBox">
        <div id="myGdfMain"></div>
      </div>
    </div>
    <!-- 新增：全局遮罩层（移出ctrl-box） -->
    <div v-if="enableProgressBar && !isOver" class="global-loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">加载中...</div>
    </div>
  </div>
</template>

<script setup>
import SceneHeader from "@/components/SceneHeader.vue";
import { ref, onMounted } from "vue";
import axios from "axios";
import Fab from "@/components/Fab.vue";

const defaultProps = {
  children: "Children",
  label: "Name",
};

function handleFabClick() {
  isTreeCollapsed.value = !isTreeCollapsed.value;
}

let enableProgressBar = ref(window.webConfig.enableProgressBar);

// 格式化文件大小为 MB，保留两位小数
const formatSize = (bytes) => {
  if (bytes == null) return "";
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(2) + " MB";
};

const isTreeCollapsed = ref(false);

function toggleTree(event) {
  event.stopPropagation();
  isTreeCollapsed.value = !isTreeCollapsed.value;
}

function handleNodeClick(node, nodeData, event) {
  // 检查是否点击了收起按钮
  if (event && event.target) {
    if (event.target.matches(".btn-icon, .btn-icon *")) {
      return;
    }
  }
  if (!(node && node.Size)) {
    return;
  }
  init(node);
}
let isOver = ref(true);
let tableData = ref([]);
const gdfCtrl = ref(null);
// 文件基础路径
const fileUrl = ref(window.webConfig.fileUrl);
onMounted(async () => {
  await getGdfList();
  init();
});

function init(node) {
  let newCtrl;
  newCtrl = JSON.parse(JSON.stringify(gdfui.cache));
  newCtrl.elemId = "myGdfMain";
  newCtrl.apiUrl = window.webConfig.baseUrl;
  newCtrl.group = "default";
  newCtrl.isHtml = true;
  newCtrl.isLayerTree = true;
  newCtrl.isNavigator = true;
  newCtrl.isSelectRect = false;
  newCtrl.isSelectPolygon = false;
  newCtrl.isSendDF = true;
  newCtrl.isDrawLine = true;
  // newCtrl.isSaveFile = true;
  //初始化控件
  gdfui.mapCtrlList = [];
  newCtrl.ctrl = new gdfui.gdfPlanMapCtrlProxy(newCtrl, function () {
    gdfCtrl.value = newCtrl;
    if (node) {
      if (oldMap.value.graphicID && oldMap.value.pageID) {
        closeMap(function () {
          openFile(node);
        });
      } else {
        openFile(node);
      }
    }
  });
}

function closeMap(callback) {
  return (
    axios
      // .post(`${fileUrl.value}/api/doublefoxapp/${oldMap.value.port}/MapServices/close`, {
      .post(`${window.webConfig.baseUrl}/api/doublefoxapp/SystemServices/SetIsFreed`, {
        graphicID: oldMap.value.graphicID,
        pageID: oldMap.value.pageID,
      })
      .then((res) => {
        typeof callback === "function" && callback();
      })
      .catch((error) => {
        isOver.value = true;
        console.error("请求失败:", error);
      })
  );
}

const oldMap = ref({});
function openFile(node) {
  try {
    isOver.value = false;
    let extension = node.Name.split(".");
    gdfCtrl.value.ctrl.file.openFile(`${fileUrl.value}/UploadedFiles/${node.Path}`, `.${extension[extension.length - 1]}`, 1, function (obj) {
      console.log(gdfCtrl.value.ctrl);
      if (gdfCtrl.value.ctrl.mapCtrl.isMobile) {
        gdfCtrl.value.ctrl.mainCanvas.viewFitCenter();
      }
      gdfCtrl.value.ctrl.file.setMapName(node.Name);
      let configParam = gdfCtrl.value.ctrl.mapCtrl.configParam;
      oldMap.value = {
        graphicID: configParam.graphicID,
        pageID: configParam.pageID,
        port: configParam.keyPort,
      };
      isOver.value = true;
    });
  } catch (error) {
    isOver.value = true;
  }
}

// 获取图件列表
function getGdfList(page, limit) {
  return axios
    .post(`${window.webConfig.baseUrl}/api/doublefoxapp/graphicservices/allfilelist`)
    .then((res) => {
      var obj = res.data.Data;
      if (res.data.Succeeded) {
        tableData.value = obj;
        typeof callback === "function" && callback(obj);
      } else {
        console.error(res.data.errors);
      }
    })
    .catch((error) => {
      console.error("请求失败:", error);
    });
}
</script>

<style lang="scss" scoped>
.global-loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  /* 必须高于所有其他元素的z-index */

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .loading-text {
    margin-top: 10px;
    color: #333;
    font-size: 14px;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

:deep(.el-tree-node__children .el-tree-node__content) {
  padding-left: 13px !important;
}

:deep(.el-tree-node__content) {
  height: 36px;
  transition:
    background-color 0.1s,
    color 0.1s;
}

:deep(.el-tree-node__content) {
  background-color: #f0f2f5;
  font-size: 15px;
  font-weight: 500;
}

:deep(.el-tree-node__children .el-tree-node__content) {
  background-color: #fff;
  font-size: 13px;
  font-weight: 500;
}

:deep(.el-tree-node__children .el-tree-node__content:hover) {
  background-color: #f0f0f0;
}

:deep(.is-current:has(> .el-tree-node__children) .el-tree-node__content) {
  background-color: #e6f2ff;
}

:deep(.is-current .el-tree-node__children .el-tree-node__content) {
  background-color: #fff;
}

.main {
  display: flex;

  .sidebar-btn {
    position: absolute;
    z-index: 9999;
    left: calc(20vw - 25px);
  }
}

.tree-box {
  width: 20vw;
  height: calc(100vh - 71px);
  transition: none !important;
  transition:
    width 0.3s ease,
    transform 0.3s ease;

  .tree-bar {
    transition:
      width 0.3s ease,
      transform 0.3s ease;
    position: absolute;
    left: 0;
    height: 100%;
    display: none;
    background-color: #f0f2f5;
  }

  .tree-bar.show {
    height: calc(100vh - 72px);
    width: 30px;
    display: block;
    z-index: 999999;
    transition: 0.3;
    padding: 7px;

    &:hover {
      cursor: pointer;
      background-color: #e5e8ed;
    }
  }

  // overflow-x: hidden;
  .tree-title {
    padding: 12px 16px;
    background: #f0f2f5;
    font-size: 14px;
    font-weight: 600;
    color: #444;
    border-bottom: 1px solid #e0e0e0;
  }

  .file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 18vw;
    user-select: none;

    .file-name {
      width: calc(100% - 70px);
      color: #333; // 默认文字颜色
      // flex: 1 1 auto;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      min-width: 0;
    }

    .file-size {
      margin-right: 15px;
      color: #999; // 更浅的颜色
      font-size: 0.8em;
      // flex-shrink: 0;
    }

    p {
      .btn-icon {
        margin-right: 15px;
      }
    }
  }
}

.tree-box.collapsed {
  width: 30px;
  border-right: none;
  padding: 0;
  margin: 0;
}

.ctrl-box {
  width: 80vw;
  height: calc(100vh - 71px);
}

.ctrl-box.collapsed {
  width: calc(100vw - 30px);
}

.gdfBox {
  height: 100%;
  width: 100%;
}

.fab {
  display: none;
}

@media screen and (min-width: 300px) and (max-width: 900px) {
  .tree-box {
    position: absolute;
    left: calc(30px - 100vw);
    z-index: 9999;
    border-right: 2px solid #d3d3d6;
    width: calc(100vw - 30px);

    .el-scrollbar {
      border-right: 1px solid #d3d3d6;
    }

    .tree-bar {
      display: none;
    }

    .tree-bar.show {
      display: none;
    }
  }
  .file-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 84vw !important;
    user-select: none;
  }

  .tree-box.collapsed {
    position: absolute;
    left: 0;
    z-index: 2002;
    width: calc(100vw - 30px);
    border-right: 1px solid #8f8f8f;
    transition: 0.5s;
  }

  .ctrl-box {
    width: 100vw;
  }

  .ctrl-box.collapsed {
    width: 100vw;
  }

  .fab {
    display: block;
  }
}
</style>
