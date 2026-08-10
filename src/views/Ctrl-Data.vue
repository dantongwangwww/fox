<template>
  <LayOut>
    <template #ctrl>
      <div class="page-container">
        <div class="layout-container">
          <!-- 左侧表格区域 -->
          <div class="left-panel">
            <h2>数据列表</h2>

            <!-- 搜索和筛选区域 -->
           <div class="search-filter-container">
              <div class="search-box">
                <el-select v-model="searchField" placeholder="选择搜索字段" style="width: 150px; margin-right: 10px">
                  <el-option label="名称" value="name" />
                  <el-option label="类型" value="lineType" />
                  <el-option label="图层路径/名称" value="layerName" />
                  <el-option label="来源文件" value="sourceFile" />
                </el-select>
                <el-input v-model="searchValue" placeholder="输入搜索内容" style="width: 200px; margin-right: 10px"
                  clearable />

                  <el-select v-model="searchSurveyId" placeholder="选择工区" style="width: 200px; margin-right: 10px" clearable
                @change="handleSurveyChange">
                <el-option v-for="item in surveyOptions" :key="item.SurveyId" :label="item.SurveyName"
                  :value="item.SurveyId" />
              </el-select>
                <el-button type="primary" @click="handleSearch">搜索</el-button>

              </div>
              

              <el-select v-model="filterType" placeholder="按类型筛选" style="width: 150px">
                <el-option label="全部" value="" />
                <el-option label="Point" value="Point" />
                <el-option label="LineString" value="LineString" />
                <el-option label="Polygon" value="Polygon" />
              </el-select>

              <el-button style="margin-left: 5px;" type="primary" @click="handleGeojsonFilter">范围过滤</el-button>
              <div>

              </div>

              <div class="filter-box" style="margin-top: 10px;">

              </div>
              <div style="margin-top: 10px;">
                <el-button type="primary" @click="handleAdd">添加元素</el-button>
                <el-button type="primary" @click="handleAddPoint">添加点</el-button>
                <el-button type="primary" @click="handleAddLine">添加线</el-button>
                <!-- <el-button type="primary" @click="handleAdd">添加面</el-button> -->
                <!-- <el-button type="primary" @click="setupMapProjection">设置投影</el-button>
                <el-button type="primary" @click="cancelMapProjection">取消投影</el-button> -->

              </div>
            </div>

            <!-- 表格区域 -->
            <div class="table-container" ref="tableContainer" @mousedown="handleMouseDown" @mousemove="handleMouseMove" @mouseup="handleMouseUp" @mouseleave="handleMouseUp">
              <el-table :data="filteredData" v-loading="loadingSearch" border stripe style="width: 100%" height='calc(100vh - 340px)'
                @selection-change="handleSelectionChange" @select="handleSelect" @select-all="handleSelectAll">
                <el-table-column type="selection" width="35" :header-cell-class-name="isSelectAllDisabled ? 'select-all-disabled' : ''" />
                <el-table-column prop="id" label="ID" width="80" />
                <el-table-column prop="name" label="名称" width="180" />
                <el-table-column prop="lineType" label="类型" width="120" />
                <el-table-column prop="lengthM" label="长度 (米)" width="120" align="right" />
                <el-table-column prop="layerName" label="图层路径/名称" min-width="300" />
                <el-table-column prop="sourceFile" label="来源文件" width="150" />
                <el-table-column prop="updateTime" label="更新时间" width="164" />
              </el-table>
            </div>
          </div>

          <!-- 右侧预览区域 -->
          <div class="right-panel">
            <div class="preview-header">
              <h2>可视化预览</h2>
              <div v-if="selectedRows.length > 0" class="preview-info">
                共选中 {{ getGeometryStats.total }} 个要素：{{ getGeometryStats.points }} 个点元素，{{ getGeometryStats.lines }} 个线元素，{{ getGeometryStats.polygons }} 个面元素
              </div>
            </div>
            <div class="preview-container" @wheel.prevent="handlePreviewWheel">
              <div class="preview-empty">
                <div id="myGdfMain"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </LayOut>

  <!-- 范围过滤弹窗 -->
  <el-dialog
    v-model="geojsonFilterDialogVisible"
    title="范围过滤"
    width="500px"
  >
    <div class="filter-dialog-content">
      <h3>请输入四点坐标</h3>
      <div class="points-container">
        <div class="point-item" v-for="(point, index) in filterPoints" :key="index">
          <div class="point-label">点 {{ index + 1 }}:</div>
          <el-input
            v-model="point.x"
            placeholder="X坐标"
            style="width: 150px; margin-right: 10px"
          />
          <el-input
            v-model="point.y"
            placeholder="Y坐标"
            style="width: 150px"
          />
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
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import LayOut from "../components/Layout.vue";
import { el } from "element-plus/es/locales.mjs";
import { ElMessage } from "element-plus";

// 几何类型映射表 (勿修改右边值)
const geomTypeMap = {
  Point: 'points',
  MultiPoint: 'points',
  LineString: 'lines',
  MultiLineString: 'lines',
  Polygon: 'polygons',
  MultiPolygon: 'polygons'
};

// 交互状态变量
const dialogVisible = ref(false);
const geometryDialogVisible = ref(false);
const geojsonFilterDialogVisible = ref(false);
const activeTab = ref("data");
const loadingSearch = ref(false);
const isSelectAllDisabled = ref(false); // 控制全选框是否禁用

// [107.30, 46.36],
//           [107.41, 46.36],
//           [107.41, 46.34],
//           [107.30, 46.34],
//           [107.30, 46.36],
// 范围过滤弹窗相关变量
const filterPoints = ref([
  { x: '107.30', y: '46.36' },
  { x: '107.41', y: '46.36' }, 
  { x: '107.41', y: '46.34' }, 
  { x: '107.30', y: '46.34' }, 
  // { x: '107.30', y: '46.36' }
]);
  

// 拖动相关变量
const tableContainer = ref(null);
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const scrollLeft = ref(0);
const scrollTop = ref(0);

// 数据存储状态
const detailData = ref([]); // 存储当前选中的图层下的所有线数据
const selectedGeometryData = ref(null); // 存储当前选中的几何数据
const selectedRow = ref(null); // 存储当前选中的行数据
const selectedRows = ref([]); // 存储表格中选中的行数据

// 存储数据
const pointsData = ref([]);
const linesData = ref([]);
const polygonsData = ref([]);

// 搜索和筛选相关变量
const searchField = ref("name"); // 默认搜索字段
const searchValue = ref(""); // 搜索内容
const filterType = ref("LineString"); // 筛选类型
const searchSurveyId = ref("");
const surveyOptions = ref([]);

// 图形控件相关变量
const fileUrl = ref(window.webConfig.fileUrl);
const notifyUrl = ref(window.webConfig.baseUrl);
const gdfCtrl = ref(null);
let gdf = gdfui;
const isProjected = ref(false) // 是否投影

// ====== 计算属性 ======
// --- 根据筛选类型选择数据源并进行格式化 --- // 改成保存格式化后的数据？
const layerSummaryList = computed(() => {
  let dataSource;
  if (!filterType.value) {
    dataSource = [...pointsData.value, ...linesData.value, ...polygonsData.value];
  } else {
    dataSource = {
      Point: pointsData,
      LineString: linesData,
      Polygon: polygonsData,
    }[filterType.value].value;
  }

  if (!dataSource || dataSource.length === 0) return [];

  return dataSource.map((item) => {
    let parsedGeom;
    if (item.Geom) {
      try {
        parsedGeom = JSON.parse(item.Geom);
      } catch (e) {
        console.error("Error pre-parsing geometry for item", item.Id, ":", e);
        parsedGeom = { type: "Point", coordinates: [] };
      }
    } else {
      parsedGeom = { type: "Point", coordinates: [] };
    }

    return {
      id: item.Id,
      name: item.Name,
      lineType: item.LineType,
      lengthM: Number(item.LengthM).toFixed(2),
      layerName: item.LayerName || "未知图层",
      sourceFile: item.SourceFileName,
      updateTime: item.UpdatedAt || item.CreatedAt,
      originalData: [item],
      parsedGeom: parsedGeom,
      GeomSummary: parsedGeom,
      isFirstChecked: false,
    };
  });
});

// --- 前端过滤后的数据(依赖 layerSummaryList) ---
const filteredData = computed(() => {
  let result = layerSummaryList.value;

  // 应用搜索
  // if (searchValue.value) {
  //   result = result.filter((item) => {
  //     const value = item[searchField.value];
  //     return value && value.toString().toLowerCase().includes(searchValue.value.toLowerCase());
  //   });
  // }

  // // 应用筛选
  // if (filterType.value) {
  //   result = result.filter((item) => {
  //     return item.parsedGeom && item.parsedGeom.type === filterType.value;
  //   });
  // }

  return result;
});

// --- 将坐标数据转换为表格格式(依赖 selectedGeometryData) ---
const coordinateTableData = computed(() => {
  if (!selectedGeometryData.value || !selectedGeometryData.value.GeomSummary || !selectedGeometryData.value.GeomSummary.coordinates) {
    return [];
  }

  return selectedGeometryData.value.GeomSummary.coordinates.map((coord, index) => ({
    index: index + 1,
    longitude: coord[0].toFixed(6),
    latitude: coord[1].toFixed(6),
  }));
});

// --- 统计几何元素类型(依赖 selectedRows/detailData) ---
const getGeometryStats = computed(() => {
  const result = {
    points: 0,
    lines: 0,
    polygons: 0,
    total: 0
  };

  // 确定使用哪个数据源
  const data = selectedRows.value.length > 0 ? selectedRows.value : detailData.value;

  // 遍历数据，统计几何类型
  data.forEach((item) => {
    if (item.parsedGeom) {
      const type = item.parsedGeom.type;
      result[geomTypeMap[type]]++;
      result.total++;
    }
  });

  return result;
});

// ====== 方法定义 ======
// --- 数据获取 ---
const getPointsData = async (param = {}) => {
  const res = await axios.post(`/api/doublefoxapp/serverproxy/geodataservice/point/query`, param);
  return res.data;

}

const getLinesData = async (param = {}) => {
  const res = await axios.post(`/api/doublefoxapp/serverproxy/geodataservice/line/query`, param);
  return res.data;
}

const getPolygonsData = async (param = {}) => {
  return {};
  // const res = await axios.post(`/api/doublefoxapp/serverproxy/geodataservice/polygon/query`, param);
  // return res.data;
}
// 获取所有数据
const getData = async (param = {}) => {
  loadingSearch.value = true;
  const searchParams = {
    [searchField.value]: searchValue.value,
    surveyId: searchSurveyId.value,
    ...param
  }
  try {
    const [points, lines, polygons] = await Promise.all([
      getPointsData(searchParams),
      getLinesData(searchParams),
      getPolygonsData(searchParams),
    ]);
    console.log("Points data:", points);
    console.log("Lines data:", lines);
    console.log("Polygons data:", polygons);
    // 存储数据到状态变量
    pointsData.value = points.Data || [];
    linesData.value = lines.Data || [];
    polygonsData.value = polygons.Data || [];
  } catch (error) {
    console.error("Failed to load data:", error);
  } finally {
    loadingSearch.value = false;
  }
};

// --- 图形控件方法 ---
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
  myCtrl.ctrl = new gdf.gdfPlanMapCtrlProxy(myCtrl, function () {
    gdfCtrl.value = myCtrl;
    // 创建空图
    gdfCtrl.value.ctrl.file.createMap(function (obj) {

      //  // 设置投影CGCS2000
      // gdfCtrl.value.ctrl.setProjection("CGCS2000 Gauss 6,-1,0,2,1 0,2 0,0"); 
      // // // 转换投影CGCS2000
      // gdfCtrl.value.ctrl.changeToProjection("CGCS2000 Gauss 6,-1,0,2,1 1,1 0,0");
     });
    
    addTemplate();
  });
}

// 添加模板
function addTemplate() {
  // gdfCtrl.value.ctrl.
}

// 设置地图投影 todo: 根据比例尺？缩放级别？计算
function setupMapProjection() {
  // 设置投影CGCS2000
  // gdfCtrl.value.ctrl.setProjection("CGCS2000 Gauss 6,-1,0,2,1 0,2 0,0");
  // 转换投影CGCS2000
  gdfCtrl.value.ctrl.changeToProjection("CGCS2000 Gauss 6,-1,0,2,1 1,1 0,0");
  
  gdfCtrl.value.ctrl.mainCanvas.viewFitCenter();
  gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04); //重新更新控件
}

function cancelMapProjection() {
  gdfCtrl.value.ctrl.changeToProjection("CGCS2000 Gauss 6,-1,0,2,1 0,2 0,0");
  gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04); //重新更新控件
  gdfCtrl.value.ctrl.mainCanvas.viewFitCenter();
}

// 添加点元素
function addPoints() {
  
}

// 添加线元素
function addLines(lines) {

  gdfCtrl.value.ctrl.file.createMap(function (obj) {

  gdfCtrl.value.ctrl.plane.addLinesObj(2, lines, "Layer:\\line", function (obj) {

     // 设置投影CGCS2000
      gdfCtrl.value.ctrl.setProjection("CGCS2000 Gauss 6,-1,0,2,1 0,2 0,0");
      // // 转换投影CGCS2000
      gdfCtrl.value.ctrl.changeToProjection("CGCS2000 Gauss 6,-1,0,2,1 1,1 0,0");

    // gdfCtrl.value.ctrl.layer.activation("Layer:\\line", function () {
      gdfCtrl.value.ctrl.mainCanvas.viewFitCenter();
      gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04); //重新更新控件
    // });
  });

  })
}
// 添加面元素
function addPolygons() {}

function addPointsByServer() {
  let configParam = gdfCtrl.value.ctrl.mapCtrl.configParam;
  gdfCtrl.value.ctrl.file.createMap(function (obj) {
    //   axios.post(`${notifyUrl.value}/api/doublefoxapp/${configParam.keyPort}/DataMapServices/AddPointsGeo`, { // 添加点元素
    axios.post(`${notifyUrl.value}/api/doublefoxapp/${configParam.keyPort}/DataMapServices/AddWellPointsGeo`, { // 添加井位点元素
      GraphicID: configParam.graphicID,
      PageID: configParam.pageID,
      LayerName: "Layer:\\point"
    }).then((res) => {
      // 设置投影CGCS2000
      gdfCtrl.value.ctrl.setProjection("CGCS2000 Gauss 6,-1,0,2,1 0,2 0,0");
      // // 转换投影CGCS2000
      gdfCtrl.value.ctrl.changeToProjection("CGCS2000 Gauss 6,-1,0,2,1 1,1 0,0");
      //gdfCtrl.value.ctrl.layer.activation("Layer:\\line", function () {
      gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04); //重新更新控件
      gdfCtrl.value.ctrl.mainCanvas.viewFitCenter();
      // });
    }).catch((error) => {
      console.error("请求失败:", error);
    });
  })
}

function addLinesByServer() {

  var objLines = [{
    // "iType": 2,
    "LayerName": "Layer:\\井位\\平台1\\井靶点连线\\上排连线",
    "DataFileObj": [
      {
        "LineName": "平台1-1A-上排",
        "dataList": [
          {
            "x": 18505577.11,
            "y": 3237757.11
          },
          {
            "x": 18505458,
            "y": 3238063.75
          }
        ]
      },
      {
        "LineName": "平台1-2A-上排",
        "dataList": [
          {
            "x": 18505577.22,
            "y": 3237757.33
          },
          {
            "x": 18505852.11,
            "y": 3238133.25
          }
        ]
      },
      {
        "LineName": "平台1-3A-上排",
        "dataList": [
          {
            "x": 18505577.31,
            "y": 3237757.68
          },
          {
            "x": 18506246.11,
            "y": 3238202.55
          }
        ]
      },
      {
        "LineName": "平台1-4A-上排",
        "dataList": [
          {
            "x": 18505577.31,
            "y": 3237757.68
          },
          {
            "x": 18506640.12,
            "y": 3238272.20
          }
        ]
      }
    ]
  }];
  let configParam = gdfCtrl.value.ctrl.mapCtrl.configParam;
  var param = [{
    iType: 2,
    LayerName: 'Layer:\\line',
    DataFileObj: objLines
  }];

  gdfCtrl.value.ctrl.file.createMap(function (obj) {

    axios.post(`${notifyUrl.value}/api/doublefoxapp/${configParam.keyPort}/DataMapServices/AddLinesGeo`, {
      GraphicID: configParam.graphicID,
      PageID: configParam.pageID,
      DataFileModel: param
    }).then((res) => {
      // // 设置投影CGCS2000
      gdfCtrl.value.ctrl.setProjection("CGCS2000 Gauss 6,-1,0,2,1 0,2 0,0");
      // // // 转换投影CGCS2000
      gdfCtrl.value.ctrl.changeToProjection("CGCS2000 Gauss 6,-1,0,2,1 1,1 0,0");
      //gdfCtrl.value.ctrl.layer.activation("Layer:\\line", function () {
      gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04); //重新更新控件
      gdfCtrl.value.ctrl.mainCanvas.viewFitCenter();
      // });
    }).catch((error) => {
      console.error("请求失败:", error);
    });

  })
}

function addLinesByServer1(param) {

 let configParam = gdfCtrl.value.ctrl.mapCtrl.configParam;

  gdfCtrl.value.ctrl.file.createMap(function (obj) {
    //   axios.post(`${notifyUrl.value}/api/doublefoxapp/${configParam.keyPort}/DataMapServices/AddPointsGeo`, { // 添加点元素
    axios.post(`${notifyUrl.value}/api/doublefoxapp/${configParam.keyPort}/DataMapServices/AddLinesGeo1`, { // 添加井位点元素
      GraphicID: configParam.graphicID,
      PageID: configParam.pageID,
      LayerName: "Layer:\\point",
      ...param
    }).then((res) => {
      // 设置投影CGCS2000
      gdfCtrl.value.ctrl.setProjection("CGCS2000 Gauss 6,-1,0,2,1 0,2 0,0");
      // // 转换投影CGCS2000
      gdfCtrl.value.ctrl.changeToProjection("CGCS2000 Gauss 6,-1,0,2,1 1,1 0,0");
      //gdfCtrl.value.ctrl.layer.activation("Layer:\\line", function () {
      gdfCtrl.value.ctrl.viewRefresh(0x01 | 0x02 | 0x04); //重新更新控件
      gdfCtrl.value.ctrl.mainCanvas.viewFitCenter();
      // });
    }).catch((error) => {
      console.error("请求失败:", error);
    });
  })
}

const getSurveyOptions = async () => {
  const res = await axios.get(`/api/doublefoxapp/serverproxy/geodataservice/survey/getoptions`);
  surveyOptions.value = res.data.Data || [];
};

// --- 事件处理 ---
// 处理表格选择变化
const handleSelectionChange = (val) => {
  // 确保所有已标记为isFirstChecked的行都在选择中
  // const updatedSelection = [...val];
  // layerSummaryList.value.forEach((row) => {
  //   if (row.isFirstChecked && !updatedSelection.includes(row)) {
  //     updatedSelection.push(row);
  //   }
  // });
  // selectedRows.value = updatedSelection;
  selectedRows.value = [...val];
};

// 处理单个行选择
const handleSelect = (selection, row) => {
  // 输出选中的行数据
  selectedRow.value = { ...row };

  // // 如果是第一次勾选，设置isFirstChecked为true
  // if (!row.isFirstChecked) {
  //   addLines([
  //     {
  //       LineName: row.name,
  //       dataList: row.GeomSummary.coordinates.map((item) => ({
  //         x: item[0],
  //         y: item[1],
  //       })),
  //     },
  //   ]);
  //   row.isFirstChecked = true;
  // } else {
  //   // 如果已经勾选过，阻止取消选择
  //   // 重新添加到选择中
  //   if (!selection.includes(row)) {
  //     selection.push(row);
  //   }
  // }
};

// 处理全选
const handleSelectAll = (selection) => {
  // 如果全选框已禁用，直接返回，阻止全选操作
  // if (isSelectAllDisabled.value) {
  //   return;
  // }

  // // 打印全选时的数据
  // console.log("全选时的数据：", selection);
  // let lines = [];
  // let points = [];
  // let polygons = [];
  // selection.forEach((row) => {
  //   if (row.lineType == "test_line" && row.isFirstChecked != true) {
  //     lines.push({
  //       LineName: row.name,
  //       dataList: row.GeomSummary.coordinates.map((item) => ({
  //         x: item[0],
  //         y: item[1],
  //       })),
  //     });
  //   } else if (typeof row.pointType == "test_point" && row.isFirstChecked != true) {
  //     points.push({
  //       PointName: row.name,
  //       dataList: row.GeomSummary.coordinates.map((item) => ({
  //         x: item[0],
  //         y: item[1],
  //       })),
  //     });
  //   } else if (row.polygonType == "test_polygon" && row.isFirstChecked != true) {
  //     polygons.push({
  //       PolygonName: row.name,
  //       dataList: row.GeomSummary,
  //     });
  //   }
  // });
  // lines.length > 0 && addLines(lines);
  // points.length > 0 && addPoints(points);
  // polygons.length > 0 && addPolygons(polygons);
  // // 遍历所有行，将未标记为isFirstChecked的行标记为true
  // layerSummaryList.value.forEach((row) => {
  //   if (!row.isFirstChecked) {
  //     row.isFirstChecked = true;
  //     // 确保所有已标记的行都在选择中
  //     if (!selection.includes(row)) {
  //       selection.push(row);
  //     }
  //   }
  // });
  // 全选后禁用全选框
  // isSelectAllDisabled.value = true;
};

// 处理搜索
const handleSearch = () => {
  getData();
};
// 添加元素
const handleAdd = () => {
  // 测试用
  // const newLine = {
  //   LineName: "新添加的线",
  //   dataList: [
  //     { x: 21683000, y: 4794400 },
  //     { x: 21683500, y: 4794400 },
  //     { x: 21683500, y: 4794350 },
  //     { x: 21683000, y: 4794350 },
  //   ],
  // };
  // addLines([newLine]);
  // addPoints();
  
  // 从 selectedRows 中分离出对应的类型, 分别调用添加方法
  const newGeom = {
    points: [],
    lines: [],
    polygons: [],
  }
  selectedRows.value.forEach(row => {
    newGeom[geomTypeMap[row.parsedGeom.type]].push(row);
  });
  console.log(newGeom);
  // addPoints(newGeom.points.map());
  addLines(newGeom.lines.map(row => ({ LineName: row.name, dataList: row.GeomSummary.coordinates.map((item) => ({ x: item[0], y: item[1] })) })));
  // addPolygons(newGeom.polygons.map());
};

const handleAddPoint = () => {
  addPointsByServer();
};

const handleAddLine = () => {
  addLinesByServer();
};

const handleAddPolygon = () => {
};

const handleGeojsonFilter = () => {
  // 打开范围过滤弹窗
  geojsonFilterDialogVisible.value = true;
};

const confirmGeojsonFilter = () => {
  // 验证所有坐标是否都已输入
  const allPointsFilled = filterPoints.value.every(point => point.x && point.y);
  if (!allPointsFilled) {
    ElMessage.warning('请填写所有四点坐标');
    return;
  }

  // 构建多边形GeoJSON
  const coordinates = filterPoints.value.map(point => [parseFloat(point.x), parseFloat(point.y)]);
  // 闭合多边形，添加第一个点到末尾
  coordinates.push([parseFloat(filterPoints.value[0].x), parseFloat(filterPoints.value[0].y)]);

  // // 执行过滤查询
  // getData({
  //   PolygonGeoJson: {
  //     type: "Polygon",
  //     coordinates: [coordinates]
  //   }
  // });
  addLinesByServer1( {
    PolygonGeoJson: {
      type: "Polygon",
      coordinates: [coordinates]
    }
  });

  // 关闭弹窗
  geojsonFilterDialogVisible.value = false;
};

// 判断行是否被选中
const isRowSelected = (row) => {
  // 检查selectedRows中是否包含当前行
  return selectedRows.value.some((item) => {
    // 使用id或name来匹配，确保能正确识别所有类型的元素
    return item.id === row.id || item.name === row.name;
  });
};

// 鼠标按下事件
const handleMouseDown = (e) => {
  isDragging.value = true;
  startX.value = e.pageX - tableContainer.value.offsetLeft;
  startY.value = e.pageY - tableContainer.value.offsetTop;
  scrollLeft.value = tableContainer.value.scrollLeft;
  scrollTop.value = tableContainer.value.scrollTop;
};

// 鼠标移动事件
const handleMouseMove = (e) => {
  if (!isDragging.value) return;
  e.preventDefault();
  const x = e.pageX - tableContainer.value.offsetLeft;
  const y = e.pageY - tableContainer.value.offsetTop;
  const walkX = (x - startX.value) * 1; // 滚动速度
  const walkY = (y - startY.value) * 1; // 滚动速度
  tableContainer.value.scrollLeft = scrollLeft.value - walkX;
  tableContainer.value.scrollTop = scrollTop.value - walkY;
};

// 鼠标释放事件
const handleMouseUp = () => {
  isDragging.value = false;
};
// 查看几何详情
const handleViewGeometryDetails = (row) => {
  selectedGeometryData.value = row;
  geometryDialogVisible.value = true;
};

// 处理预览窗口滚轮事件
const handlePreviewWheel = (event) => {
  // 事件已经通过 @wheel.prevent 阻止冒泡，这里可以添加其他滚轮相关逻辑
};

// ====== 生命周期钩子 ======
onMounted(async () => {
  getSurveyOptions();
  init();
  getData();
});

</script>

<style scoped>
.page-container {
  padding: 10px;
}

.coordinates-list {
  max-height: 120px;
  overflow-y: auto;
  font-size: 12px;
  line-height: 1.4;
}

.coordinate-item {
  margin-bottom: 4px;
  color: #606266;
}

.coordinate-more {
  margin-top: 4px;
  color: #909399;
  font-style: italic;
}

.coordinate-count {
  font-size: 14px;
  color: #909399;
  font-weight: normal;
}

.card-header {
  height: 32px;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 布局样式 */
.layout-container {
  display: flex;
  width: 100%;
  height: calc(100vh - 102px);
  gap: 10px;
}

.left-panel {
  flex: 1.5;
  padding: 15px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-container {
  width: 100%;
  height: calc(100vh - 295px);
  overflow: auto;
  cursor: grab;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 固定表头 */
.table-container .el-table__header-wrapper {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #ffffff;
}

.table-container .el-table__header {
  background-color: #ffffff;
  border-bottom: 1px solid #dcdfe6;
}

/* 确保表格内容可以滚动 */
.table-container .el-table__body-wrapper {
  overflow: visible !important;
}

.table-container:active {
  cursor: grabbing;
}

.table-container * {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

/* 禁用全选框样式 */
.select-all-disabled .el-checkbox__input {
  cursor: not-allowed;
  pointer-events: none;
  opacity: 0.5;
}

.table-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.table-container::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}

.right-panel {
  flex: 3.5;
  padding: 15px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview-info {
  font-size: 14px;
  color: #606266;
  background-color: #ecf5ff;
  padding: 5px 10px;
  border-radius: 4px;
}

.preview-container {
  height: calc(100vh - 80px);
  /* border: 1px solid #dcdfe6; */
  /* border-radius: 4px; */
  overflow: hidden;
}

.preview-content {
  height: 90%;
  padding: 15px;
  overflow: auto;
}

.preview-empty {
  height: 92%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  /* background-color: #f5f7fa;
  color: #909399; */
  font-size: 16px;
  border-radius: 4px;
}

/* 标题样式 */
h2 {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 10px;
  margin-top: 0;
}

/* 搜索和筛选区域样式 */
.search-filter-container {
  margin-bottom: 20px;
  padding: 15px;
  background-color: #f5f7fa;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-box {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  /* flex-wrap: wrap; */
}

.filter-box {
  display: flex;
  align-items: center;
}

/* 范围过滤弹窗样式 */
.filter-dialog-content {
  padding: 10px 0;
}

.filter-dialog-content h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 16px;
  color: #303133;
}

.points-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.point-item {
  display: flex;
  align-items: center;
}

.point-label {
  width: 60px;
  font-size: 14px;
  color: #606266;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .search-box {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-box .el-select,
  .search-box .el-input,
  .search-box .el-button {
    width: 100%;
    margin-right: 0;
    margin-bottom: 10px;
  }

  .filter-box {
    width: 100%;
  }

  .filter-box .el-select {
    width: 100%;
  }
}
</style>
