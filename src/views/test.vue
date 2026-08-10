<template>
  <div class="app-container">
    <!-- 侧边栏 -->
    <aside class="sidebar" :style="{ width: sidebarWidth + 'px' }">
      <!-- 1. 数据层级导航 -->
      <div class="sidebar-nav">
        <div class="panel-header">数据层级导航</div>
        <div class="nav-scroll">
          <el-tree :props="treeProps" node-key="id" lazy :load="loadNode" highlight-current @node-click="onNodeClick" class="nav-tree">
            <template #default="{ node, data }">
              <span class="tree-node-label">
                <el-icon v-if="data.children"><FolderOpened /></el-icon>
                <el-icon v-else><Document /></el-icon>
                {{ node.label }}
              </span>
            </template>
            <template #loading>
              <el-icon class="is-loading"><Loading /></el-icon>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 2. 属性筛选 -->
      <div class="sidebar-filter" v-if="selectedCat">
        <div class="panel-header">属性筛选: {{ selectedCat }}</div>
        <div class="filter-form">
          <el-form label-position="top" size="small">
            <!-- <el-form-item v-if="selectedCat === '等值线' || selectedCat === '断层线'" label="Z轴范围 (Value)">
              <el-space>
                <el-input-number v-model="queryParams.zMin" placeholder="Min" :controls="false" style="width: 90px" />
                <span style="color: #999">—</span>
                <el-input-number v-model="queryParams.zMax" placeholder="Max" :controls="false" style="width: 90px" />
              </el-space>
            </el-form-item> -->

            <!-- <el-form-item v-if="polygonCoordinates.length <= 0"> -->
            <!-- <el-button :type="isPolygonPicking ? 'warning' : 'default'" style="width: 100%" @click="togglePolygonPick">
                {{ isPolygonPicking ? "取消选择" : "多边形框选" }}
              </el-button> -->
            <!-- <el-button :type="isRectanglePicking ? 'warning' : 'default'" style="width: 48%" @click="toggleRectanglePick">
                {{ isRectanglePicking ? "取消选择" : "矩形框选" }}
              </el-button> -->
            <!-- </el-form-item> -->

            <!-- 多边形坐标列表 -->
            <div v-if="polygonCoordinates.length > 0" class="polygon-coordinates-section">
              <div class="section-header">
                <span class="section-title">多边形坐标 ({{ polygonCoordinates.length }})</span>
                <el-button type="danger" size="small" plain @click="clearPolygonCoordinates"> 删除 </el-button>
              </div>
              <div class="coordinates-list">
                <div v-for="(coord, index) in polygonCoordinates" :key="index" class="coordinate-item">
                  <span class="coordinate-index">{{ index + 1 }}</span>
                  <span class="coordinate-value">{{ coord.x.toFixed(6) }}, {{ coord.y.toFixed(6) }}</span>
                  <el-button type="text" size="small" class="delete-btn" @click="removeCoordinate(index)">
                    <!-- <el-icon><Delete /></el-icon> -->
                  </el-button>
                </div>
              </div>
            </div>

            <el-button type="primary" style="width: 100%" :loading="loading" @click="handleQuery">
              {{ loading ? "查询中..." : "执行数据库检索" }}
            </el-button>
          </el-form>
        </div>
      </div>

      <!-- 3. 查询结果 -->
      <div class="sidebar-results">
        <div class="panel-header results-header">
          <span>元素数量 ({{ filteredResults.length }})</span>
        </div>
        <div class="search-bar" v-if="results.length > 0">
          <!-- <el-input v-model="searchInput" placeholder="搜索名称或属性..." clearable size="small" style="flex: 1" @keyup.enter="doSearch" @clear="doSearch">
            <template #append>
              <el-button :icon="Search" @click="doSearch" />
            </template>
          </el-input> -->
          <el-button style="width: 100%" type="primary" size="small" :icon="Plus" :disabled="results.length === 0" @click="confirmAdd">添加</el-button>
        </div>
        <!-- <div class="list-container">
          <el-table
            v-if="results.length > 0"
            height="100%"
            :data="filteredResults"
            size="small"
            highlight-current-row
            @row-dblclick="focusElement"
            @selection-change="selectedRows = $event"
            style="width: 100%"
          >
            <el-table-column type="selection" width="40" fixed />
            <el-table-column prop="Name" label="名称" />
            <el-table-column label="类型" width="120">
              <template #default="{ row }">
                {{ row.PointType || row.LineType || "-" }}
              </template>
            </el-table-column>
            <el-table-column prop="LayerName" label="图层" width="180" />
            <el-table-column prop="CreatedAt" label="创建时间" width="150" />
          </el-table>
          <el-empty v-else :description="loading ? '正在从空间数据库读取...' : '请在上方选择分类并查询'" :image-size="60" />
        </div> -->
      </div>
    </aside>

    <!-- 拖拽条 -->
    <div class="resizer" @mousedown="startResize"></div>
    <!-- 虚拟分割线 -->
    <div class="virtual-resizer" v-if="isResizing" :style="{ left: tempWidth + 'px' }"></div>

    <!-- 右侧预览区 -->
    <div class="viewer-container">
      <!-- 工具栏 -->
      <div class="viewer-toolbar">
        <div class="toolbar-actions">
          <el-button size="small" type="primary" @click="addBoundary"> 添加边界 </el-button>
          <el-button size="small" @click="clearCanvas"> 清空画布 </el-button>
        </div>
      </div>

      <!-- 预览区域 -->
      <main class="main-viewer" :style="{ width: 'calc(100vw - 5px - ' + sidebarWidth + 'px)' }">
        <div id="myGdfMain"></div>
      </main>
    </div>
    <!-- 添加对话框 -->
    <!-- <el-dialog v-model="dialogVisible" title="添加选中数据" width="600px" draggable align-center>
      <div style="max-height: 360px; overflow-y: auto">
        <el-table :data="selectedRows" size="small" border>
          <el-table-column prop="Name" label="名称" />
          <el-table-column label="类型" width="120">
            <template #default="{ row }">
              {{ row.PointType || row.LineType || "-" }}
            </template>
          </el-table-column>
          <el-table-column prop="LayerName" label="图层" width="180" />
          <el-table-column prop="CreatedAt" label="创建时间" width="150" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAdd">确认添加</el-button>
      </template>
    </el-dialog> -->
  </div>
  <!-- 范围过滤弹窗 -->
  <el-dialog v-model="geojsonFilterDialogVisible" title="边界范围" width="500px">
    <div class="filter-dialog-content">
      <h3>请输入四点坐标</h3>
      <div class="points-container">
        <div class="point-item" v-for="(point, index) in filterPoints" :key="index">
          <div class="point-label">点 {{ index + 1 }}:</div>
          <el-input v-model="point.x" placeholder="X坐标" style="width: 150px; margin-right: 10px" />
          <el-input v-model="point.y" placeholder="Y坐标" style="width: 150px" />
        </div>
      </div>
    </div>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="geojsonFilterDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmGeojsonFilter">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from "vue";
import { Plus, Search, Delete, ArrowDown } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";
// 存储点数据和线数据
const pointsData = ref([]);
const linesData = ref([]);
const polygonEle = ref(null);

// 图形控件相关变量
const fileUrl = ref(window.webConfig.fileUrl);
const notifyUrl = ref(window.webConfig.baseUrl);
const gdfCtrl = ref(null);
let gdf = gdfui;
// 初始化图形控件
function init() {
  let myCtrl;
  myCtrl = JSON.parse(JSON.stringify(gdf.cache));
  myCtrl.elemId = "myGdfMain";
  myCtrl.apiUrl = window.webConfig.baseUrl;
  myCtrl.group = "default";
  myCtrl.isHtml = true;
  myCtrl.isNavigator = false; // 是否显示导航
  myCtrl.isLayerTree = true; // 是否显示层位树
  myCtrl.isSendDF = true;
  // myCtrl.isGeoUpload = true;
  // myCtrl.isDrawPlane = true;
  myCtrl.ctrl = new gdf.gdfPlanMapCtrlProxy(myCtrl, function () {
    gdfCtrl.value = myCtrl;
    // 创建空图
    gdfCtrl.value.ctrl.file.createMap(function (obj) {
    // gdfCtrl.value.ctrl.file.mergeFile(fileUrl.value + "/map/井位模板2.dml", ".dml", 1, "", function (obj) {
    gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04); //重新更新控件
    gdfCtrl.value.ctrl.setProjection("CGCS2000 Gauss 6,-1,0,2,1 0,2 0,0");
    });
    // gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04); //重新更新控件
    // });
    gdfCtrl.value.ctrl.oncanvasdrawplaneend = function (data) {
      if (polygonEle.value) {
        deletePolygon(polygonEle.value);
      }
      polygonCoordinates.value = data.event.getCoor();
      console.log(polygonCoordinates.value);
      polygonEle.value = data.event;
      isPolygonPicking.value = false;
      var toolbar = gdfCtrl.value.ctrl.mapCtrl.toolbar;
      toolbar.setDrawPlane(false);
    };
  });
}

// 删除多边形
function deletePolygon(ele) {
  gdfCtrl.value.ctrl.mapCtrl.mainCanvas.lineMap.remove(ele.__index);
  gdfCtrl.value.ctrl.viewRefresh(0x01); //重新更新控件
}

// 组件挂载
onMounted(async () => {
  init();
});

// --- 数据获取 --- ---
// 获取工区列表
function getSurveyList() {
  return axios.get(`/api/doublefoxapp/serverproxy/geodataservice/survey/getoptions`, {}).then((res) => {
    return res.data.Data;
  });
}

// 获取点类型
function getPointType() {
  return axios.get(`/api/doublefoxapp/serverproxy/geodataservice/dict/pointtype`, {}).then((res) => {
    return res.data.Data;
  });
}
// 获取线类型
function getLinesType() {
  return axios.get(`/api/doublefoxapp/serverproxy/geodataservice/dict/linetype`, {}).then((res) => {
    return res.data.Data;
  });
}

// 查询点数据
function getPointsData(SurveyId, PointType) {
  let coors = polygonCoordinates.value.map((item) => [item.x, item.y]);
  let PolygonGeoJson = {
    type: "Polygon",
    coordinates: [coors],
  };
  if (coors.length == 0 || !coors) {
    PolygonGeoJson = null;
  }
  coors.push(coors[0]);
  return axios.post(`/api/doublefoxapp/serverproxy/geodataservice/point/query`, { SurveyId, PointType, PolygonGeoJson }).then((res) => {
    return res.data;
  });
}

// 查询线数据
function getLinesData(SurveyId, LineType) {
  console.log(polygonCoordinates.value);
  let coors = polygonCoordinates.value.map((item) => [item.x, item.y]);
  let PolygonGeoJson = {
    type: "Polygon",
    coordinates: [coors],
  };
  if (coors.length == 0 || !coors) {
    PolygonGeoJson = null;
  }
  coors.push(coors[0]);
  return axios.post(`/api/doublefoxapp/serverproxy/geodataservice/line/query`, { SurveyId, LineType, PolygonGeoJson }).then((res) => {
    return res.data;
  });
}

const sidebarWidth = ref(400);
const loading = ref(false);
const selectedCat = ref(null);
const activeElementId = ref(null);
const isPolygonPicking = ref(false);
const isRectanglePicking = ref(false);
const polygonCoordinates = ref([]);
const searchInput = ref("");
const searchKeyword = ref("");
const selectedRows = ref([]);
const dialogVisible = ref(false);

const treeProps = { label: "name", children: "children", isLeaf: "leaf" };

const workspaceTree = ref([]);

// 加载工区列表
async function loadSurveyList() {
  try {
    const surveyList = await getSurveyList();
    workspaceTree.value = surveyList.map((survey) => ({
      id: survey.SurveyId,
      name: survey.SurveyName,
      children: [
        {
          id: `${survey.SurveyId}_point`,
          name: "点数据",
          surveyId: survey.SurveyId,
          type: "point",
          children: [],
          loading: false,
          loaded: false,
        },
        {
          id: `${survey.SurveyId}_line`,
          name: "线数据",
          surveyId: survey.SurveyId,
          type: "line",
          children: [],
          loading: false,
          loaded: false,
        },
      ],
    }));
  } catch (error) {
    console.error("Failed to load survey list:", error);
  }
}

// 懒加载节点数据
async function loadNode(node, resolve) {
  console.log("Loading node:", node);
  if (node.level === 0) {
    await loadSurveyList();
    resolve(workspaceTree.value);
    return;
  }

  const data = node.data;
  if (data.type === "point" && !data.loaded) {
    // 加载点类型数据
    try {
      data.loading = true;
      const pointTypes = await getPointType();
      const children = pointTypes.map((type) => ({
        id: `${data.surveyId}_point_${type.Code}`,
        name: type.Name,
        surveyId: data.surveyId,
        type: "pointType",
        code: type.Code,
        description: type.Description,
        leaf: true,
      }));
      data.loading = false;
      resolve(children);
    } catch (error) {
      console.error("Failed to load point types:", error);
      data.loading = false;
      resolve([]);
    }
  } else if (data.type === "line" && !data.loaded) {
    // 加载线类型数据
    try {
      data.loading = true;
      const lineTypes = await getLinesType();
      const children = lineTypes.map((type) => ({
        id: `${data.surveyId}_line_${type.Code}`,
        name: type.Name,
        surveyId: data.surveyId,
        type: "lineType",
        code: type.Code,
        description: type.Description,
        leaf: true,
      }));
      data.loading = false;
      resolve(children);
    } catch (error) {
      console.error("Failed to load line types:", error);
      data.loading = false;
      resolve([]);
    }
  } else {
    // 其他节点，直接解析
    resolve(data.children || []);
  }
}

const queryParams = reactive({ zMin: 90, zMax: 100, bbox: null });
const results = ref([]);
const selectedNode = ref(null);

const filteredResults = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase();
  if (!kw) return results.value;
  return results.value.filter(
    (r) =>
      r.Name.toLowerCase().includes(kw) ||
      r.PointType.toLowerCase().includes(kw) ||
      (r.Description && r.Description.toLowerCase().includes(kw)) ||
      (r.LayerName && r.LayerName.toLowerCase().includes(kw)),
  );
});

const onNodeClick = (data) => {
  if (!data.children) {
    selectedCat.value = data.name;
    results.value = [];
    searchInput.value = "";
    searchKeyword.value = "";
    selectedNode.value = data;
  }
};

const doSearch = () => {
  searchKeyword.value = searchInput.value;
};

const confirmAdd = () => {
  var data = selectedNode.value;
  if (data.type === "pointType") {
    addPoints(selectedRows.value);
  } else if (data.type === "lineType") {
    addLines1(selectedRows.value);
  }
  // dialogVisible.value = false;
};

const addPoints = (data) => {
  // console.log(data);
  let configParam = gdfCtrl.value.ctrl.mapCtrl.configParam;

  axios
    .post(`${notifyUrl.value}/api/doublefoxapp/${configParam.keyPort}/DataMapServices/AddWellPointsGeo`, {
      // 添加井位点元素
      GraphicID: configParam.graphicID,
      PageID: configParam.pageID,
      LayerName: "Layer:\\point",
    })
    .then((res) => {
      // 转换投影CGCS2000
      gdfCtrl.value.ctrl.changeToProjection("CGCS2000 Gauss 6,-1,0,2,1 1,1 0,0");
      gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04); //重新更新控件
      gdfCtrl.value.ctrl.mainCanvas.viewFitCenter();
    })
    .catch((error) => {
      console.error("请求失败:", error);
    });
};

const addLines = (data) => {
  var objLines = [
    {
      LineName: "平台1-1A-上排",
      dataList: [
        {
          x: 18505577.11,
          y: 3237757.11,
        },
        {
          x: 18505458,
          y: 3238063.75,
        },
      ],
    },
  ];
  objLines = [];
  data.forEach((item) => {
    objLines.push({
      LineName: item.Name,
      dataList: parseLineString(item.Geom),
    });
  });
  let configParam = gdfCtrl.value.ctrl.mapCtrl.configParam;
  axios
    .post(`${notifyUrl.value}/api/doublefoxapp/${configParam.keyPort}/DataMapServices/AddLinesGeo`, {
      GraphicID: configParam.graphicID,
      PageID: configParam.pageID,
      DataFileModel: [
        {
          iType: 2,
          LayerName: "Layer:\\line",
          DataFileObj: [{ DataFileObj: objLines }],
        },
      ],
    })
    .then((res) => {
      // 转换投影CGCS2000
      gdfCtrl.value.ctrl.changeToProjection("CGCS2000 Gauss 6,-1,0,2,1 1,1 0,0");
      //gdfCtrl.value.ctrl.layer.activation("Layer:\\line", function () {
      gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04); //重新更新控件
      gdfCtrl.value.ctrl.mainCanvas.viewFitCenter();
      // });
    })
    .catch((error) => {
      console.error("请求失败:", error);
    });
};

const addLines1 = (param) => {
  if (coordinatesData.value) {
    param = {
      PolygonGeoJson: {
        type: "Polygon",
        // coordinates: JSON.stringify([coordinatesData.value])
        coordinates: [coordinatesData.value],
      },
    };
  } else {
    // ElMessage.warning("请添加边界");
    // return;
  }
  let configParam = gdfCtrl.value.ctrl.mapCtrl.configParam;
  axios
    .post(`${notifyUrl.value}/api/doublefoxapp/${configParam.keyPort}/DataMapServices/AddLinesGeo1`, {
      GraphicID: configParam.graphicID,
      PageID: configParam.pageID,
      LayerName: "Layer:\\line",
      ...param,
    })
    .then((res) => {
      // 转换投影CGCS2000
      gdfCtrl.value.ctrl.changeToProjection("CGCS2000 Gauss 6,-1,0,2,1 1,1 0,0");
      //gdfCtrl.value.ctrl.layer.activation("Layer:\\line", function () {
      gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04); //重新更新控件
      gdfCtrl.value.ctrl.mainCanvas.viewFitCenter();
      // });
    })
    .catch((error) => {
      console.error("请求失败:", error);
    });
};

/**
 * 将WKT LINESTRING字符串转换为[{x: 经度, y: 纬度}]格式
 * @param {string} wktLineString - LINESTRING坐标字符串
 * @returns {Array<{x: number, y: number}>} 坐标对象数组
 */
function parseLineString(wktLineString) {
  // 1. 清理字符串：移除LINESTRING(...)、空格、异常坐标段
  const cleanStr = wktLineString
    .replace(/LINESTRING\(/i, "") // 去掉前缀
    .replace(/\)/g, "") // 去掉后缀括号
    .replace(/\s+/g, " ") // 多空格转单空格
    .replace(/107,107/g, ""); // 修复你字符串中的错误段"107,107"

  // 2. 按逗号分割每个坐标点
  const pointStrs = cleanStr.split(",");

  // 3. 逐个解析坐标并转为{x,y}对象
  const coordinates = pointStrs
    .map((str) => {
      const [x, y] = str.trim().split(" ");
      return {
        x: parseFloat(x), // 经度
        y: parseFloat(y), // 纬度
      };
    })
    .filter((point) => !isNaN(point.x) && !isNaN(point.y)); // 过滤无效点

  return coordinates;
}

const handleQuery = () => {
  if (!selectedNode.value) {
    ElMessage.warning("请先选择一个数据类型");
    return;
  }

  loading.value = true;
  var data = selectedNode.value;

  try {
    if (data.type === "pointType") {
      getPointsData(data.surveyId, data.code)
        .then((res) => {
          if (res && res.Data) {
            results.value = res.Data;
          } else {
            results.value = [];
            ElMessage.info("未查询到数据");
          }
          loading.value = false;
        })
        .catch((error) => {
          console.error("查询点数据失败:", error);
          ElMessage.error("查询失败，请稍后重试");
          loading.value = false;
        });
    } else if (data.type === "lineType") {
      // gdfCtrl.value.ctrl.setProjection("CGCS2000 Gauss 6,-1,0,2,1 1,1 0,0");
      // gdfCtrl.value.ctrl.changeToProjection("CGCS2000 Gauss 6,-1,0,2,1 0,2 0,0", function () {
      getLinesData(data.surveyId, data.code)
        .then((res) => {
          if (res && res.Data) {
            results.value = res.Data;
          } else {
            results.value = [];
            ElMessage.info("未查询到数据");
          }
          loading.value = false;
        })
        .catch((error) => {
          console.error("查询线数据失败:", error);
          ElMessage.error("查询失败，请稍后重试");
          loading.value = false;
        });
      // });
    }
  } catch (error) {
    console.error("查询失败:", error);
    ElMessage.error("查询失败，请稍后重试");
    loading.value = false;
  }
};

const focusElement = (row) => {
  if (!row) return;
  activeElementId.value = row.Id;
};

const togglePolygonPick = () => {
  if (isRectanglePicking.value) {
    isRectanglePicking.value = false;
  }
  var toolbar = gdfCtrl.value.ctrl.mapCtrl.toolbar;
  toolbar.setDrawPlane(true);
  isPolygonPicking.value = !isPolygonPicking.value;
};

const toggleRectanglePick = () => {
  if (isPolygonPicking.value) {
    isPolygonPicking.value = false;
  }
  isRectanglePicking.value = !isRectanglePicking.value;
};

// 清空多边形坐标
const clearPolygonCoordinates = () => {
  deletePolygon(polygonEle.value);
  polygonCoordinates.value = [];
  polygonEle.value = null;
};

// 删除单个坐标
const removeCoordinate = (index) => {
  polygonCoordinates.value.splice(index, 1);
};

// 清空画布
const clearCanvas = () => {
  gdfCtrl.value.ctrl.file.createMap(function (obj) {
    gdfCtrl.value.ctrl.setProjection("CGCS2000 Gauss 6,-1,0,2,1 0,2 0,0");
    gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04); //重新更新控件
  });
};

// 范围过滤弹窗相关变量
const filterPoints = ref([
  // { x: "21641816", y: "26103820" },
  // { x: "21641816", y: "26128085" },
  // { x: "21618408", y: "26128085" },
  // { x: "21618408", y: "26103820" },
  { x: "120.6", y: "235.4" },
  { x: "120.6", y: "235.6" },
  { x: "120.8", y: "235.6" },
  { x: "120.8", y: "235.4" },
]);
const geojsonFilterDialogVisible = ref(false);
// 添加边界
const addBoundary = () => {
  geojsonFilterDialogVisible.value = true;
  var objLines = [
    {
      LineName: "边界",
      dataList: [
        {
          x: 1202151,
          y: 373545,
        },
        {
          x: 1312324,
          y: 373604,
        },
        {
          x: 1310339,
          y: 230926,
        },
        {
          x: 1204338,
          y: 230915,
        },
        {
          x: 1202151,
          y: 373545,
        },
      ],
    },
    {
      LineName: "印度洋工区",
      dataList: [
        {
          x: 823300,
          y: 212300,
        },
        {
          x: 983253,
          y: 212324,
        },
        {
          x: 983445,
          y: 2720,
        },
        {
          x: 822638,
          y: 2719,
        },
        {
          x: 823300,
          y: 212300,
        },
      ],
    },
    {
      LineName: "南海工区",
      dataList: [
        {
          x: 1063512,
          y: 230201,
        },
        {
          x: 1191848,
          y: 230308,
        },
        {
          x: 1193552,
          y: 40337,
        },
        {
          x: 1065537,
          y: 40325,
        },
        {
          x: 1063512,
          y: 230201,
        },
      ],
    },
  ];
  // gdfCtrl.ctrl.plane.addLinesObj(2, objLines, "Layer:\\工区", function (obj) {
  //   gdfCtrl.ctrl.viewRefresh(0x01 | 0x02 | 0x04); //重新更新控件
  // });
};
const coordinatesData = ref(null);
const confirmGeojsonFilter = () => {
  // 验证所有坐标是否都已输入
  const allPointsFilled = filterPoints.value.every((point) => point.x && point.y);
  if (!allPointsFilled) {
    ElMessage.warning("请填写所有四点坐标");
    return;
  }

  // 构建多边形GeoJSON
  const coordinates = filterPoints.value.map((point) => [parseFloat(point.x), parseFloat(point.y)]);
  // 闭合多边形，添加第一个点到末尾
  coordinates.push([parseFloat(filterPoints.value[0].x), parseFloat(filterPoints.value[0].y)]);
  coordinatesData.value = coordinates;
  let list = coordinates.map((item) => ({
    x: item[0],
    y: item[1],
  }));
  var objLines = [
    {
      LineName: "边界",
      dataList: list,
    },
  ];
  gdfCtrl.value.ctrl.plane.addLinesObj(2, objLines, "Layer:\\边界", function (obj) {
    gdfCtrl.value.ctrl.mainCanvas.viewFitCenter(function () {});
    gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04); //重新更新控件
  });
  // 关闭弹窗
  geojsonFilterDialogVisible.value = false;
};

// 重置视图
const resetView = () => {
  if (gdfCtrl.value && gdfCtrl.value.ctrl) {
    // 调用图形控件的重置视图方法
    // gdfCtrl.value.ctrl.resetView();
    ElMessage.success("视图已重置");
  } else {
    ElMessage.warning("图形控件未初始化");
  }
};

// 放大
const zoomIn = () => {
  if (gdfCtrl.value && gdfCtrl.value.ctrl) {
    // 调用图形控件的放大方法
    // gdfCtrl.value.ctrl.zoomIn();
    ElMessage.success("已放大");
  } else {
    ElMessage.warning("图形控件未初始化");
  }
};

// 缩小
const zoomOut = () => {
  if (gdfCtrl.value && gdfCtrl.value.ctrl) {
    // 调用图形控件的缩小方法
    // gdfCtrl.value.ctrl.zoomOut();
    ElMessage.success("已缩小");
  } else {
    ElMessage.warning("图形控件未初始化");
  }
};

const isResizing = ref(false);
const startWidth = ref(0);
const tempWidth = ref(0);

const startResize = (e) => {
  isResizing.value = true;
  startWidth.value = sidebarWidth.value;
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
  document.body.style.cursor = "col-resize";
  e.preventDefault();
};
const onMouseMove = (e) => {
  if (e.clientX > 280 && e.clientX < window.innerWidth * 0.6) {
    tempWidth.value = e.clientX;
  }
};
const onMouseUp = () => {
  if (tempWidth.value > 0) {
    sidebarWidth.value = tempWidth.value;
    tempWidth.value = 0;
  }
  isResizing.value = false;
  window.removeEventListener("mousemove", onMouseMove);
  window.removeEventListener("mouseup", onMouseUp);
  document.body.style.cursor = "default";
};
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #f4f7f9;
}

.sidebar {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #dcdfe6;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  z-index: 10;
  min-width: 0;
  height: 100vh;
}

.panel-header {
  padding: 6px 15px;
  background: #dde3ea;
  font-size: 12px;
  font-weight: 600;
  color: #1a2233;
  border-bottom: 1px solid #c5cdd8;
  border-top: 1px solid #c5cdd8;
  flex-shrink: 0;
}

.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sidebar-nav {
  flex: 0 0 80%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.nav-scroll {
  flex: 1;
  overflow-y: auto;
}

.nav-tree {
  padding: 8px;
}

.tree-node-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
}

.sidebar-filter {
  flex-shrink: 0;
  border-top: 1px solid #ebeef5;
}

.filter-form {
  padding: 12px 15px;
}

.sidebar-results {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-top: 1px solid #ebeef5;
}

.search-bar {
  padding: 8px 10px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
  display: flex;
  gap: 6px;
  align-items: center;
}

.list-container {
  flex: 1;
  overflow-y: auto;
}

.resizer {
  width: 5px;
  cursor: col-resize;
  background: transparent;
  transition: background 0.2s;
  flex-shrink: 0;
}
.resizer:hover {
  background: #409eff;
}

.virtual-resizer {
  position: fixed;
  top: 0;
  height: 100vh;
  width: 2px;
  background: #409eff;
  z-index: 9999;
  pointer-events: none;
}

/* 多边形坐标列表样式 */
.polygon-coordinates-section {
  margin-bottom: 12px;
  background: #f5f7fa;
  border-radius: 6px;
  overflow: hidden;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #e8eaed;
  border-bottom: 1px solid #dcdfe6;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  color: #303133;
}

.coordinates-list {
  max-height: 100px;
  overflow-y: auto;
  padding: 4px;
}

.coordinate-item {
  display: flex;
  align-items: center;
  padding: 2px 8px;
  margin-bottom: 2px;
  background: #fff;
  border-radius: 4px;
  transition: all 0.2s;
}

.coordinate-item:hover {
  background: #ecf5ff;
}

.coordinate-item:last-child {
  margin-bottom: 0;
}

.coordinate-index {
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #409eff;
  color: #fff;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 500;
  margin-right: 10px;
}

.coordinate-value {
  flex: 1;
  font-size: 12px;
  color: #606266;
  font-family: "Courier New", monospace;
}

.delete-btn {
  padding: 4px;
  color: #f56c6c;
}

.delete-btn:hover {
  color: #f78989;
}

/* 预览区容器样式 */
.viewer-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* 工具栏样式 */
.viewer-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 40px;
  background: #fff;
  border-bottom: 1px solid #dcdfe6;
  padding: 0 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.toolbar-menu {
  display: flex;
  gap: 8px;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  color: #303133;
  transition: all 0.2s;
}

.menu-item:hover {
  background: #f0f2f5;
  color: #409eff;
}

.toolbar-actions {
  display: flex;
  gap: 3px;
}

.main-viewer {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.viewer-placeholder {
  color: #61dafb;
  text-align: center;
  opacity: 0.7;
}
</style>

<style>
/* 表格多选框颜色 */
.el-table .el-checkbox__inner {
  border-color: #409eff;
}
.el-table .el-checkbox__input.is-checked .el-checkbox__inner,
.el-table .el-checkbox__input.is-indeterminate .el-checkbox__inner {
  background-color: #409eff;
  border-color: #409eff;
}
.el-table .el-checkbox__input.is-checked .el-checkbox__inner::after {
  border-color: #fff;
}
</style>
