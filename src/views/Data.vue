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
                <el-select v-model="searchField" placeholder="选择搜索字段" style="width: 150px; margin-right: 10px;">
                  <el-option label="ID" value="id" />
                  <el-option label="名称" value="name" />
                  <el-option label="类型" value="lineType" />
                  <el-option label="图层路径/名称" value="layerName" />
                  <el-option label="来源文件" value="sourceFile" />
                </el-select>
                <el-input 
                  v-model="searchValue" 
                  placeholder="输入搜索内容"
                  style="width: 200px; margin-right: 10px;"
                  clearable
                  @input="handleSearch"
                />
                <el-button type="primary" @click="handleSearch">搜索</el-button>
              </div>
              
              <div class="filter-box">
                <el-select v-model="filterType" placeholder="按类型筛选" style="width: 150px;">
                  <el-option label="全部" value="" />
                  <el-option label="Point" value="Point" />
                  <el-option label="LineString" value="LineString" />
                  <el-option label="Polygon" value="Polygon" />
                </el-select>
              </div>
            </div>
            
            <el-table 
              :data="filteredData" 
              border 
              style="width: 100%" 
              height="calc(100vh - 220px)"
              @selection-change="handleSelectionChange"
              @select="handleSelect"
              @select-all="handleSelectAll"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="name" label="名称" width="180" />
              <el-table-column prop="lineType" label="类型" width="120" />
              <el-table-column prop="lengthM" label="长度 (米)" width="150" align="right" />
              <el-table-column prop="layerName" label="图层路径/名称" min-width="300" />
              <el-table-column prop="sourceFile" label="来源文件" width="150" />
              <el-table-column prop="updateTime" label="更新时间" width="180" />
              <el-table-column label="操作" width="150" fixed="right" align="center">
                <template #default="scope">
                  <el-button 
                    type="success" 
                    link 
                    @click="handleViewPreview(scope.row)"
                    :disabled="!isRowSelected(scope.row)"
                  >
                    定位
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          
          <!-- 右侧预览区域 -->
          <div class="right-panel">
            <div class="preview-header">
              <h2>可视化预览</h2>
              <div v-if="detailData.length > 0" class="preview-info">
                共展示 {{ detailData.length }} 条线要素
              </div>
            </div>
            <div class="map-container">
              <div id="leafletMap" style="width: 100%; height: calc(100vh - 120px)"></div>
              <div class="map-legend">
                <p v-if="detailData.length > 0 || selectedRows.length > 0">
                  共展示 {{ getGeometryStats().total }} 个要素：
                  {{ getGeometryStats().points }} 个点元素，
                  {{ getGeometryStats().lines }} 个线元素，
                  {{ getGeometryStats().polygons }} 个面元素
                </p>
                <p v-else>请选择一个图层进行预览</p>
              </div>
            </div>
          </div>
        </div>

        <el-dialog v-model="dialogVisible" title="图层详情数据" width="80%" top="5vh" destroy-on-close>
          <el-tabs v-model="activeTab" type="card" @tab-change="handleTabChange">
            <el-tab-pane label="数据列表" name="data">
              <el-table :data="detailData" height="500" border stripe>
                <el-table-column prop="Id" label="ID" width="80" />
                <el-table-column prop="Name" label="名称" width="180" sortable />
                <el-table-column prop="LineType" label="类型" width="120" />
                <el-table-column prop="LengthM" label="长度 (米)" width="150">
                  <template #default="{ row }">
                    {{ Number(row.LengthM).toFixed(2) }}
                  </template>
                </el-table-column>
                <el-table-column label="详情" min-width="150" align="center">
                  <template #default="{ row }">
                    <el-button type="primary" link size="small" @click="handleViewGeometryDetails(row)">
                      查看详情
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="可视化预览" name="preview">
              <div class="map-container">
                <div id="leafletMap" style="width: 100%; height: 500px"></div>
                <div class="map-legend">
                  <p>共展示 {{ detailData.length }} 条线要素</p>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>

          <template #footer>
            <span class="dialog-footer">
              <el-button @click="dialogVisible = false">关 闭</el-button>
            </span>
          </template>
        </el-dialog>

        <!-- 几何详情对话框 -->
        <el-dialog v-model="geometryDialogVisible" title="几何详情" width="60%" top="10vh" destroy-on-close>
          <div v-if="selectedGeometryData">
            <el-card shadow="hover" style="margin-bottom: 10px; padding: 5px;">
              <template #header>
                <div class="card-header">
                  <span>基本信息</span>
                </div>
              </template>
              <el-descriptions :column="4" border size="small">
                <el-descriptions-item label="ID">{{ selectedGeometryData.Id }}</el-descriptions-item>
                <el-descriptions-item label="名称">{{ selectedGeometryData.Name }}</el-descriptions-item>
                <el-descriptions-item label="类型">{{ selectedGeometryData.LineType }}</el-descriptions-item>
                <el-descriptions-item label="长度 (米)">{{ Number(selectedGeometryData.LengthM).toFixed(2) }}</el-descriptions-item>
              </el-descriptions>
            </el-card>
            
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <span>坐标信息</span>
                  <span class="coordinate-count">共 {{ selectedGeometryData.GeomSummary.coordinates.length }} 个坐标点</span>
                </div>
              </template>
              <el-table :data="coordinateTableData" height="30vh" border stripe>
                <el-table-column prop="index" label="序号" width="80" align="center" />
                <el-table-column prop="longitude" label="经度" min-width="180" align="right">
                  <template #default="{ row }">
                    {{ row.longitude }}
                  </template>
                </el-table-column>
                <el-table-column prop="latitude" label="纬度" min-width="180" align="right">
                  <template #default="{ row }">
                    {{ row.latitude }}
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>
          <div v-else>
            无数据
          </div>
          <template #footer>
            <span class="dialog-footer">
              <el-button @click="geometryDialogVisible = false">关 闭</el-button>
            </span>
          </template>
        </el-dialog>
      </div>
    </template>
  </LayOut>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from "vue";
import LayOut from "../components/Layout.vue";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

// import jsonData from "../data/response_1770191902194.json";
// const rawJsonData = jsonData;
const rawJsonData =  ref([]);

// --- 状态变量 ---
const dialogVisible = ref(false);
const geometryDialogVisible = ref(false);
const activeTab = ref("data");
const detailData = ref([]); // 存储当前选中的图层下的所有线数据
const selectedGeometryData = ref(null); // 存储当前选中的几何数据
const selectedRows = ref([]); // 存储表格中选中的行数据
let mapInstance = null; // Leaflet 地图实例
let geoJsonLayer = null; // 存储 GeoJSON 图层实例，方便后续操作
let pointLayer = null; // 存储点元素图层实例，确保点在最顶层

// 搜索和筛选相关变量
const searchField = ref("name"); // 默认搜索字段
const searchValue = ref(""); // 搜索内容
const filterType = ref(""); // 筛选类型

// 过滤后的数据
const filteredData = computed(() => {
  let result = layerSummaryList.value;
  
  // 应用搜索
  if (searchValue.value) {
    result = result.filter(item => {
      const value = item[searchField.value];
      return value && value.toString().toLowerCase().includes(searchValue.value.toLowerCase());
    });
  }
  
  // 应用筛选
  if (filterType.value) {
    result = result.filter(item => {
      return item.parsedGeom && item.parsedGeom.type === filterType.value;
    });
  }
  
  return result;
});

// --- 计算属性：将坐标数据转换为表格格式 ---  
const coordinateTableData = computed(() => {
  if (!selectedGeometryData.value || !selectedGeometryData.value.GeomSummary || !selectedGeometryData.value.GeomSummary.coordinates) {
    return [];
  }
  
  return selectedGeometryData.value.GeomSummary.coordinates.map((coord, index) => ({
    index: index + 1,
    longitude: coord[0].toFixed(6),
    latitude: coord[1].toFixed(6)
  }));
});

// --- 计算属性：使用原始数据作为主表格数据 ---
const layerSummaryList = computed(() => {
  const dataList = rawJsonData.value;
  if (!dataList || dataList.length === 0) return [];

  // 直接返回原始数据，每条数据作为表格的一行
  return dataList.map((item) => {
    // 预先解析几何数据
    let parsedGeom;
    if (item.Geom) {
      try {
        parsedGeom = JSON.parse(item.Geom);
      } catch (e) {
        console.error('Error pre-parsing geometry for item', item.Id, ':', e);
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
      originalData: [item], // 保持与原有结构兼容
      parsedGeom: parsedGeom, // 直接存储解析后的几何数据
      GeomSummary: parsedGeom // 保持与原有结构兼容
    };
  });
});

// --- 方法 ---

// 1. 点击查看详情 (已不再使用，保留以备将来扩展)
// const handleViewDetails = (row) => {
//   // 只存储原始数据，不进行解析，减少初始化时间
//   detailData.value = row.originalData.map((item) => ({
//     ...item,
//     // 延迟解析，只在需要时才解析
//     get parsedGeom() {
//       if (!this._parsedGeom) {
//         this._parsedGeom = JSON.parse(this.Geom);
//       }
//       return this._parsedGeom;
//     },
//     get GeomSummary() {
//       return this.parsedGeom;
//     }
//   }));

//   activeTab.value = "data"; // 默认打开数据 Tab
//   dialogVisible.value = true;
// };

// 1. 点击定位
const handleViewPreview = (row) => {
  console.log('Locating row:', row.id);
  
  // 确保地图已初始化
  if (!mapInstance || !geoJsonLayer) {
    initMap();
  }
  
  // 找到对应的图层，同时在geoJsonLayer和pointLayer中查找
  let targetLayer = null;
  
  // 首先在点图层中查找
  if (pointLayer) {
    pointLayer.eachLayer((layer) => {
      if (layer.feature && layer.feature.properties && layer.feature.properties.name === row.name) {
        targetLayer = layer;
      }
    });
  }
  
  // 如果在点图层中没找到，再在线条/多边形图层中查找
  if (!targetLayer && geoJsonLayer) {
    geoJsonLayer.eachLayer((layer) => {
      if (layer.feature && layer.feature.properties && layer.feature.properties.name === row.name) {
        targetLayer = layer;
      }
    });
  }
  
  if (targetLayer) {
    // 定位到该元素
    if (targetLayer.getBounds) {
      // 对于有边界的元素（如线条、多边形）
      mapInstance.fitBounds(targetLayer.getBounds(), { padding: [50, 50] });
    } else if (targetLayer.getLatLng) {
      // 对于点元素
      mapInstance.setView(targetLayer.getLatLng(), 15);
    }
    
    // 触发点击事件，显示弹窗
    targetLayer.fire('click');
    console.log('Located and clicked on row:', row.id);
  } else {
    console.error('Target layer not found for row:', row.id);
    // 如果没有找到图层，尝试从原始数据创建并定位
    const item = rawJsonData.value.find(item => item.Id === row.id);
    if (item && item.parsedGeom) {
      const feature = {
        type: "Feature",
        properties: {
          name: item.Name,
          len: Number(item.LengthM).toFixed(2),
        },
        geometry: item.parsedGeom
      };
      
      // 创建临时图层，确保使用正确的坐标系统和点样式
      const tempLayer = L.geoJSON(feature, {
        style: function (feature) {
          // 根据几何类型返回不同的样式
          if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
            // 面元素样式
            return {
              color: "#409EFF", // 边框颜色
              weight: 2, // 边框宽度
              fillColor: "#69b1ff", // 填充颜色
              fillOpacity: 1// 填充透明度
            };
          } else {
            // 线条元素样式
            return { 
              color: "#409EFF", // 线条颜色
              weight: 1 // 线条宽度
            };
          }
        },
        onEachFeature: function (feature, layer) {
          if (feature.properties && feature.properties.name) {
            // 根据几何类型显示不同的信息
            if (feature.geometry.type === 'Point' || feature.geometry.type === 'MultiPoint') {
              // 点元素显示名称和坐标
              const coords = feature.geometry.coordinates;
              layer.bindPopup(`名称: ${feature.properties.name}<br>坐标: ${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`);
            } else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
              // 面元素显示名称和面积
              // 使用简单的面积计算方法
              let area = calculateArea(feature.geometry);
              layer.bindPopup(`名称: ${feature.properties.name}<br>面积: ${area.toFixed(6)} 平方公里`);
            } else {
              // 线条元素显示名称和长度
              layer.bindPopup(`名称: ${feature.properties.name}<br>长度: ${feature.properties.len}m`);
            }
          }
        },
        // 自定义点元素样式
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, {
            radius: 8, // 点的半径
            fillColor: "#ff7875", // 填充颜色
            color: "#ffffff", // 边框颜色
            weight: 2, // 边框宽度
            opacity: 1, // 透明度
            fillOpacity: 1 // 填充透明度
          });
        },
        // 确保坐标系统正确处理
        coordsToLatLng: function (coords) {
          // GeoJSON 格式: [longitude, latitude]
          return new L.LatLng(coords[1], coords[0]);
        }
      }).addTo(mapInstance);
      
      // 定位到该元素
      tempLayer.eachLayer((layer) => {
        if (layer.getBounds) {
          mapInstance.fitBounds(layer.getBounds(), { padding: [50, 50] });
        } else if (layer.getLatLng) {
          mapInstance.setView(layer.getLatLng(), 15);
        }
        // 触发点击事件
        layer.fire('click');
      });
    }
  }
};

// 2. 处理表格选择变化
const handleSelectionChange = (val) => {
  selectedRows.value = val;
  console.log('Selection changed:', val.length, 'rows selected');
  // 更新地图上显示的线条
  updateMapLayers();
};

// 3. 处理单个行选择
const handleSelect = (selection, row) => {
  console.log('Row selected:', row.id, 'Current selection:', selection.length);
  // 这里可以添加额外的选择逻辑
};

// 4. 处理全选
const handleSelectAll = (selection) => {
  console.log('Select all:', selection.length, 'rows selected');
  // 这里可以添加额外的全选逻辑
};

// 5. 处理搜索
const handleSearch = () => {
  console.log('Searching for:', searchValue.value, 'in field:', searchField.value);
  // 搜索逻辑已经在filteredData计算属性中实现
  // 这里可以添加额外的搜索相关逻辑
};

// 6. 判断行是否被选中
const isRowSelected = (row) => {
  // 检查selectedRows中是否包含当前行
  return selectedRows.value.some(item => {
    // 使用id或name来匹配，确保能正确识别所有类型的元素
    return item.id === row.id || item.name === row.name;
  });
};

// 7. 更新地图图层
const updateMapLayers = () => {
  console.log('Updating map layers with selected rows:', selectedRows.value.length);
  
  if (!mapInstance || !geoJsonLayer) {
    console.log('Map not initialized, initializing...');
    // 如果地图还未初始化，先初始化地图
    initMap();
    return;
  }
  
  // 清空现有图层
  geoJsonLayer.clearLayers();
  pointLayer.clearLayers();
  console.log('Cleared existing layers');
  console.log('Cleared point layers');
  
  // 确保点图层在最顶层
  pointLayer.bringToFront();
  
  // 添加选中的元素到地图
  let addedFeatures = 0;
  selectedRows.value.forEach((row) => {
    // 检查几何数据是否有效
    const geometry = row.parsedGeom;
    console.log('Checking row:', row.id, 'geometry:', geometry);
    
    if (geometry && geometry.type && geometry.coordinates && geometry.coordinates.length > 0) {
      // 构造标准的 GeoJSON Feature
      const feature = {
        type: "Feature",
        properties: {
          name: row.name,
          len: row.lengthM
        },
        geometry: geometry
      };
      console.log('Adding feature:', feature);
      
      // 根据几何类型添加到对应的图层
      if (geometry.type === 'Point' || geometry.type === 'MultiPoint') {
        // 点元素添加到点图层（顶层）
        pointLayer.addData(feature);
      } else {
        // 线条和多边形添加到常规图层
        geoJsonLayer.addData(feature);
      }
      addedFeatures++;
    } else {
      console.log('Skipping invalid geometry for row:', row.id);
    }
  });
  
  console.log('Added', addedFeatures, 'features to map');
  
  // 自动缩放地图以适应所有线条
  if (addedFeatures > 0) {
    const bounds = geoJsonLayer.getBounds();
    console.log('Map bounds:', bounds);
    if (bounds.isValid()) {
      mapInstance.fitBounds(bounds, { padding: [50, 50] });
      console.log('Fitting map to bounds');
    } else {
      console.log('Invalid bounds, not fitting map');
    }
  }
};

// 3. 切换 Tab 时处理地图渲染 (已不再使用，保留以备将来扩展)
// const handleTabChange = (tabName) => {
//   if (tabName === "preview") {
//     nextTick(() => {
//       initMap();
//     });
//   }
// };

// 4. 弹窗打开回调 (已不再使用，保留以备将来扩展)
// const handleDialogOpened = () => {
//   if (activeTab.value === "preview") {
//     initMap();
//   }
// };

// 8. 初始化地图
const initMap = () => {
  console.log('Initializing map...');
  const mapContainer = document.getElementById("leafletMap");

  // 防止重复初始化
  if (mapInstance) {
    console.log('Map instance already exists, removing...');
    mapInstance.remove(); // 销毁旧实例
  }

  // 创建地图，默认中心设置一个大概位置
  console.log('Creating map instance');
  mapInstance = L.map("leafletMap").setView([41.8, 107.2], 10);
  
  // 监听地图缩放事件，确保点图层始终在最顶层
  mapInstance.on('zoomend', function() {
    if (pointLayer) {
      pointLayer.bringToFront();
      console.log('Brought point layer to front after zoom');
    }
  });
  
  // 监听地图移动事件，确保点图层始终在最顶层
  mapInstance.on('moveend', function() {
    if (pointLayer) {
      pointLayer.bringToFront();
      console.log('Brought point layer to front after move');
    }
  });

  // 添加底图 (使用高德卫星地图作为替代方案，解决访问问题)
  console.log('Adding高德卫星地图 base layer');
  L.tileLayer("https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}", {
    attribution: "&copy; 高德地图",
    subdomains: ['1', '2', '3', '4'],
    maxZoom: 19
  }).addTo(mapInstance);

  // 创建一个 GeoJSON 图层组用于线条和多边形，明确使用 EPSG:4326 坐标系
  console.log('Creating GeoJSON layer for lines and polygons');
  geoJsonLayer = L.geoJSON(null, {
    style: function (feature) {
      // 根据几何类型返回不同的样式
      if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        // 面元素样式
        return {
          color: "#409EFF", // 边框颜色
          weight: 2, // 边框宽度
          fillColor: "#69b1ff", // 填充颜色
          fillOpacity: 0.5 // 填充透明度
        };
      } else {
        // 线条元素样式
        return { 
          color: "#409EFF", // 线条颜色
          weight: 3 // 线条宽度
        };
      }
    },
    onEachFeature: function (feature, layer) {
      // 给每条线或多边形添加 Popup
      if (feature.properties && feature.properties.name) {
        // 根据几何类型显示不同的信息
        if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
          // 计算面元素面积
          let area = calculateArea(feature.geometry);
          // 面元素显示名称和面积
          layer.bindPopup(`名称: ${feature.properties.name}<br>面积: ${area.toFixed(6)} 平方公里`);
        } else {
          // 线条元素显示名称和长度
          layer.bindPopup(`名称: ${feature.properties.name}<br>长度: ${feature.properties.len}m`);
        }
      }
    },
    // 确保坐标系统正确处理
    coordsToLatLng: function (coords) {
      // GeoJSON 格式: [longitude, latitude]
      return new L.LatLng(coords[1], coords[0]);
    }
  }).addTo(mapInstance);
  
  // 创建一个单独的图层组用于点元素，确保点在最顶层
  console.log('Creating GeoJSON layer for points (top layer)');
  pointLayer = L.geoJSON(null, {
    onEachFeature: function (feature, layer) {
      // 给每个点添加 Popup
      if (feature.properties && feature.properties.name) {
        // 点元素显示名称和坐标
        const coords = feature.geometry.coordinates;
        layer.bindPopup(`名称: ${feature.properties.name}<br>坐标: ${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}`);
      }
    },
    // 自定义点元素样式
    pointToLayer: function (feature, latlng) {
      return L.circleMarker(latlng, {
        radius: 8, // 点的半径
        fillColor: "#ff7875", // 填充颜色
        color: "#ffffff", // 边框颜色
        weight: 2, // 边框宽度
        opacity: 1, // 透明度
        fillOpacity: 0.8 // 填充透明度
      });
    },
    // 确保坐标系统正确处理
    coordsToLatLng: function (coords) {
      // GeoJSON 格式: [longitude, latitude]
      return new L.LatLng(coords[1], coords[0]);
    }
  }).addTo(mapInstance); // 后添加的图层会显示在前面
  
  console.log('Map initialized successfully');
  
  // 如果有选中的线条，更新地图图层
  if (selectedRows.value.length > 0) {
    console.log('Selected rows found, updating map layers...');
    nextTick(() => {
      updateMapLayers();
    });
  }

  // 将数据添加到地图
  if (selectedRows.value.length > 0) {
    // 如果有选中的元素，显示选中的元素
    selectedRows.value.forEach((row) => {
      // 检查几何数据是否有效
      const geometry = row.parsedGeom;
      if (geometry && geometry.type && geometry.coordinates && geometry.coordinates.length > 0) {
        // 构造标准的 GeoJSON Feature
        const feature = {
          type: "Feature",
          properties: {
            name: row.name,
            len: row.lengthM
          },
          geometry: geometry
        };
        
        // 根据几何类型添加到对应的图层
        if (geometry.type === 'Point' || geometry.type === 'MultiPoint') {
          // 点元素添加到点图层（顶层）
          pointLayer.addData(feature);
        } else {
          // 线条和多边形添加到常规图层
          geoJsonLayer.addData(feature);
        }
      }
    });
  } else if (detailData.value.length > 0) {
    // 如果没有选中的元素但有预览的元素，显示预览的元素
    detailData.value.forEach((item) => {
      // 检查几何数据是否有效
      const geometry = item.parsedGeom;
      if (geometry && geometry.type && geometry.coordinates && geometry.coordinates.length > 0) {
        // 构造标准的 GeoJSON Feature
        const feature = {
          type: "Feature",
          properties: {
            name: item.Name,
            len: Number(item.LengthM).toFixed(2),
          },
          geometry: geometry, // 这里会触发getter，自动解析Geom
        };
        
        // 根据几何类型添加到对应的图层
        if (geometry.type === 'Point' || geometry.type === 'MultiPoint') {
          // 点元素添加到点图层（顶层）
          pointLayer.addData(feature);
        } else {
          // 线条和多边形添加到常规图层
          geoJsonLayer.addData(feature);
        }
      }
    });
  }
  
  // 确保点图层在最顶层
  pointLayer.bringToFront();

  // 自动缩放地图以适应所有元素
  if (geoJsonLayer.getLayers().length > 0 || pointLayer.getLayers().length > 0) {
    // 创建一个临时的要素组，包含所有元素
    const allLayers = L.featureGroup();
    
    // 添加所有线条和多边形
    geoJsonLayer.eachLayer((layer) => {
      allLayers.addLayer(layer);
    });
    
    // 添加所有点
    pointLayer.eachLayer((layer) => {
      allLayers.addLayer(layer);
    });
    
    // 计算所有元素的边界
    if (allLayers.getLayers().length > 0) {
      const bounds = allLayers.getBounds();
      if (bounds.isValid()) {
        mapInstance.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }
};

// 9. 查看几何详情
const handleViewGeometryDetails = (row) => {
  selectedGeometryData.value = row;
  geometryDialogVisible.value = true;
};

// 10. 统计几何元素类型
const getGeometryStats = () => {
  let points = 0;
  let lines = 0;
  let polygons = 0;
  let total = 0;
  
  // 确定使用哪个数据源
  const data = selectedRows.value.length > 0 ? selectedRows.value : detailData.value;
  
  // 遍历数据，统计几何类型
  data.forEach((item) => {
    if (item.parsedGeom) {
      const type = item.parsedGeom.type;
      switch (type) {
        case 'Point':
        case 'MultiPoint':
          points++;
          break;
        case 'LineString':
        case 'MultiLineString':
          lines++;
          break;
        case 'Polygon':
        case 'MultiPolygon':
          polygons++;
          break;
      }
      total++;
    }
  });
  
  return {
    total,
    points,
    lines,
    polygons
  };
};

// 11. 计算面元素面积
const calculateArea = (geometry) => {
  let area = 0;
  
  if (geometry.type === 'Polygon') {
    // 计算单个多边形面积
    area = calculatePolygonArea(geometry.coordinates[0]);
  } else if (geometry.type === 'MultiPolygon') {
    // 计算多个多边形面积之和
    geometry.coordinates.forEach(polygon => {
      area += calculatePolygonArea(polygon[0]);
    });
  }
  
  return area;
};

// 计算多边形面积（使用地理坐标系的面积计算公式）
const calculatePolygonArea = (coords) => {
  let area = 0;
  const earthRadius = 6371; // 地球半径（公里）
  
  for (let i = 0; i < coords.length - 1; i++) {
    const lat1 = coords[i][1] * Math.PI / 180;
    const lon1 = coords[i][0] * Math.PI / 180;
    const lat2 = coords[i + 1][1] * Math.PI / 180;
    const lon2 = coords[i + 1][0] * Math.PI / 180;
    
    // 计算面积增量
    const dLon = lon2 - lon1;
    const term1 = Math.sin(lat2) * Math.cos(lon2);
    const term2 = Math.sin(lat1) * Math.cos(lon1);
    area += (term1 - term2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  }
  
  // 计算总面积并转换为平方公里
  area = Math.abs(area) * earthRadius * earthRadius;
  return area;
};


// 2026.04.08 数据查询接口
const getPointsData = async (param = {}) => {
  const res = await axios.post(`/api/doublefoxapp/serverproxy/geodataservice/point/query`, param);
  return res.data;

}

const getLinesData = async (param = {}) => {
  const res = await axios.post(`/api/doublefoxapp/serverproxy/geodataservice/line/query`, param);
  return res.data;
}

const getPolygonsData = async (param = {}) => {
  const res = await axios.post(`/api/doublefoxapp/serverproxy/geodataservice/polygon/query`, param);
  return res.data;
}

const getData = async () => {
  const [points, lines, polygons] = await Promise.all([
    getPointsData(),
    getLinesData(),
    getPolygonsData(),
  ]);
  console.log(points)
  rawJsonData.value = [...points.Data, ...lines.Data, ...polygons.Data];
}

onMounted(() => {
  getData();
});
</script>

<style scoped>
.page-container {
  padding: 20px;
}
.map-container {
  position: relative;
  border: 1px solid #dcdfe6;
}
.map-legend {
  position: absolute;
  bottom: 20px;
  right: 20px;
  background: white;
  padding: 10px;
  z-index: 1000;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
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
  height: calc(100vh - 40px);
  gap: 20px;
}

.left-panel {
  flex: 2;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.right-panel {
  flex: 3;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.preview-info {
  font-size: 14px;
  color: #606266;
  background-color: #ecf5ff;
  padding: 5px 10px;
  border-radius: 4px;
}

/* 标题样式 */
h2 {
  font-size: 18px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 15px;
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
  flex-wrap: wrap;
}

.filter-box {
  display: flex;
  align-items: center;
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
