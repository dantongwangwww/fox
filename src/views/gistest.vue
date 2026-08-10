<template>
  <div class="app-container">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <!-- 头部 -->
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" stroke="white" stroke-width="2" fill="none"/>
              <path d="M12 22V12" stroke="white" stroke-width="2"/>
              <path d="M22 7L12 12L2 7" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
          </div>
          <div>
            <div class="logo-text">GIS Viewer</div>
            <div class="logo-subtitle">图形数据可视化平台</div>
          </div>
        </div>
      </div>

      <!-- 标签页导航 -->
      <nav class="tab-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-btn" 
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path v-if="tab.id === 'data-tree'" d="M3 9h18M3 15h18M9 3v18M15 3v18"/>
            <polygon v-else-if="tab.id === 'filter-query'" points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
          </svg>
          {{ tab.name }}
        </button>
      </nav>

      <!-- 侧边栏内容 -->
      <div class="sidebar-content">
        <!-- 数据树面板 -->
        <div class="panel" :class="{ active: activeTab === 'data-tree' }">
          <div class="data-tree">
            <TreeNode 
              v-for="node in treeData" 
              :key="node.id"
              :node="node"
              @select="handleNodeSelect"
            />
          </div>
        </div>

        <!-- 筛选和查询合并面板 -->
        <div class="panel panel-flex" :class="{ active: activeTab === 'filter-query' }">
          <!-- 筛选条件区域（上半部分，占一半空间，带滚动条） -->
          <div class="filter-container">
            <!-- 空间数据库筛选条件 -->
            <div class="filter-section">
              <div class="filter-title">空间关系</div>
              <div class="filter-group">
                <label class="filter-label">空间操作</label>
                <select class="filter-select" v-model="filterData.spatialOperator">
                  <option value="">全部</option>
                  <option value="contains">包含</option>
                  <option value="intersects">相交</option>
                  <option value="within">在内部</option>
                  <option value="distance">距离</option>
                </select>
              </div>
              <div class="filter-group" v-if="filterData.spatialOperator === 'distance'">
                <label class="filter-label">距离 (米)</label>
                <input type="number" class="filter-input" placeholder="1000" v-model.number="filterData.distance" min="0">
              </div>
            </div>

            <div class="filter-section">
              <div class="filter-title">属性查询</div>
              <div class="filter-group">
                <label class="filter-label">关键字</label>
                <input type="text" class="filter-input" placeholder="输入名称、ID等关键字..." v-model="filterData.keyword">
              </div>
              <div class="filter-group">
                <label class="filter-label">查询字段</label>
                <select class="filter-select" v-model="filterData.queryField">
                  <option value="">全部字段</option>
                  <option value="name">名称</option>
                  <option value="id">ID</option>
                  <option value="description">描述</option>
                </select>
              </div>
            </div>

            <div class="filter-section">
              <div class="filter-title">时间范围</div>
              <div class="filter-group">
                <label class="filter-label">数据创建时间</label>
                <div class="range-inputs">
                  <input type="date" v-model="filterData.dateRange.start">
                  <span class="range-separator">至</span>
                  <input type="date" v-model="filterData.dateRange.end">
                </div>
              </div>
            </div>
          </div>

          <!-- 单一查询按钮（放在中间） -->
          <div class="query-button-container">
            <button class="btn btn-primary btn-block" @click="performQuery">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              查询
            </button>
          </div>

          <!-- 查询结果表格（下半部分，占一半空间，带滚动条） -->
          <div class="query-results">
            <div class="filter-title">查询结果 ({{ searchResults.length }})</div>
            
            <div class="results-table">
              <table class="result-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>名称</th>
                    <th>类型</th>
                    <th>工区</th>
                    <th>几何类型</th>
                    <th>创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="result in searchResults" :key="result.id">
                    <td>{{ result.id }}</td>
                    <td>{{ result.title }}</td>
                    <td>{{ result.type }}</td>
                    <td>{{ result.workarea }}</td>
                    <td>{{ result.geometry }}</td>
                    <td>{{ result.createTime }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 工具栏 -->
      <div class="toolbar">
        <div class="toolbar-left">
          <div class="toolbar-breadcrumb">
            <span v-for="(item, index) in breadcrumbPath" :key="index" class="breadcrumb-item" :class="{ active: index === breadcrumbPath.length - 1 }">
              / {{ item }}
            </span>
          </div>
        </div>
        <div class="toolbar-right">
          <!-- 模式切换按钮 -->
          <button 
            class="toolbar-btn" 
            :title="isLightMode ? '切换到夜间模式' : '切换到日间模式'"
            @click="toggleTheme"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <!-- 月亮图标（夜间模式） -->
              <path v-if="isLightMode" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              <!-- 太阳图标（日间模式） -->
              <g v-else>
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </g>
            </svg>
          </button>
        </div>
      </div>

      <!-- 地图视口 -->
      <div class="map-viewport">
        <!-- 图层控制 -->
        <div class="layer-control">
          <div class="layer-header">图层控制</div>
          <div class="layer-list">
            <div 
              v-for="layer in mapLayers" 
              :key="layer.id"
              class="layer-item" 
              :class="{ active: layer.visible }"
              @click="toggleLayer(layer.id)"
            >
              <div class="layer-toggle"></div>
              <div class="layer-name">{{ layer.name }}</div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 底部状态栏 -->
      <div class="status-bar">
        <div class="status-left">
          <div class="status-item">
            <div class="status-dot"></div>
            <span>在线</span>
          </div>
          <!-- <div class="status-item">
            <span>比例尺: 1:10000</span>
          </div> -->
          <div class="status-item">
            <span>坐标: {{ currentCoord }}</span>
          </div>
        </div>
        <div class="status-right">
          <div class="status-item">
            <span>数据更新: 2024-12-01</span>
          </div>
          <div class="status-item">
            <span>© 2024 GIS Viewer</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import './style.css'

// 导入TreeNode组件
import TreeNode from '../components/TreeNode.vue'

// 标签页数据
const tabs = [
  { id: 'data-tree', name: '数据树' },
  { id: 'filter-query', name: '筛选与查询' }
]

// 当前激活的标签页
const activeTab = ref('filter-query')

// 数据树结构
const treeData = ref([
  {
    id: 'workarea',
    label: '工区',
    badge: '2',
    icon: 'folder',
    expanded: true,
    active: false,
    children: [
      {
        id: 'daqing',
        label: '大庆油田',
        badge: '4',
        icon: 'database',
        expanded: true,
        active: false,
        children: [
          {
            id: 'daqing-point',
            label: '点',
            badge: '2',
            icon: 'point',
            expanded: true,
            active: false,
            children: [
              {
                id: 'daqing-well',
                label: '井位',
                badge: '127',
                active: false
              },
              {
                id: 'daqing-scatter',
                label: '散点',
                badge: '356',
                active: false
              }
            ]
          },
          {
            id: 'daqing-line',
            label: '线',
            badge: '3',
            icon: 'line',
            expanded: true,
            active: false,
            children: [
              {
                id: 'daqing-isoline',
                label: '等值线',
                badge: '89',
                active: false
              },
              {
                id: 'daqing-boundary',
                label: '边界线',
                badge: '12',
                active: false
              },
              {
                id: 'daqing-fault',
                label: '断层线',
                badge: '45',
                active: false
              }
            ]
          },
          {
            id: 'daqing-polygon',
            label: '面',
            badge: '2',
            icon: 'polygon',
            expanded: true,
            active: false,
            children: [
              {
                id: 'daqing-area',
                label: '区域',
                badge: '28',
                active: false
              },
              {
                id: 'daqing-zone',
                label: '区块',
                badge: '15',
                active: false
              }
            ]
          },
          {
            id: 'daqing-grid',
            label: '网格',
            badge: '1',
            icon: 'grid',
            expanded: true,
            active: false,
            children: [
              {
                id: 'daqing-dem',
                label: '数字高程模型',
                badge: '1',
                active: false
              }
            ]
          }
        ]
      },
      {
        id: 'southwest',
        label: '西南油田',
        badge: '4',
        icon: 'database',
        expanded: true,
        active: false,
        children: [
          {
            id: 'southwest-point',
            label: '点',
            badge: '2',
            icon: 'point',
            expanded: true,
            active: false,
            children: [
              {
                id: 'southwest-well',
                label: '井位',
                badge: '98',
                active: false
              },
              {
                id: 'southwest-scatter',
                label: '散点',
                badge: '276',
                active: false
              }
            ]
          },
          {
            id: 'southwest-line',
            label: '线',
            badge: '3',
            icon: 'line',
            expanded: true,
            active: false,
            children: [
              {
                id: 'southwest-isoline',
                label: '等值线',
                badge: '67',
                active: false
              },
              {
                id: 'southwest-boundary',
                label: '边界线',
                badge: '8',
                active: false
              },
              {
                id: 'southwest-fault',
                label: '断层线',
                badge: '32',
                active: false
              }
            ]
          },
          {
            id: 'southwest-polygon',
            label: '面',
            badge: '2',
            icon: 'polygon',
            expanded: true,
            active: false,
            children: [
              {
                id: 'southwest-area',
                label: '区域',
                badge: '22',
                active: false
              },
              {
                id: 'southwest-zone',
                label: '区块',
                badge: '10',
                active: false
              }
            ]
          },
          {
            id: 'southwest-grid',
            label: '网格',
            badge: '1',
            icon: 'grid',
            expanded: true,
            active: false,
            children: [
              {
                id: 'southwest-dem',
                label: '数字高程模型',
                badge: '1',
                active: false
              }
            ]
          }
        ]
      }
    ]
  }
])

// 筛选数据
const filterData = reactive({
  workarea: '',
  dataType: '',
  spatialOperator: '',
  distance: 1000,
  keyword: '',
  queryField: '',
  dateRange: {
    start: '',
    end: ''
  }
})

// 几何类型
const geometryTypes = ref([
  { id: 'point', name: '点', checked: true },
  { id: 'line', name: '线', checked: true },
  { id: 'polygon', name: '面', checked: true },
  { id: 'multipoint', name: '多点', checked: false },
  { id: 'multiline', name: '多线', checked: false },
  { id: 'multipolygon', name: '多面', checked: false }
])

// 搜索相关
const searchResults = ref([
  {
    id: 'DAQ-2023-001',
    title: '大庆油田-井位127',
    type: '点',
    workarea: '大庆油田',
    geometry: '点',
    createTime: '2023-06-15'
  },
  {
    id: 'DAQ-2023-002',
    title: '大庆油田-散点356',
    type: '点',
    workarea: '大庆油田',
    geometry: '点',
    createTime: '2023-06-16'
  },
  {
    id: 'DAQ-2023-015',
    title: '大庆油田-断层线45',
    type: '线',
    workarea: '大庆油田',
    geometry: '线',
    createTime: '2023-07-22'
  },
  {
    id: 'DAQ-2023-016',
    title: '大庆油田-等值线89',
    type: '线',
    workarea: '大庆油田',
    geometry: '线',
    createTime: '2023-07-23'
  },
  {
    id: 'DAQ-2023-028',
    title: '大庆油田-区域28',
    type: '面',
    workarea: '大庆油田',
    geometry: '面',
    createTime: '2023-08-10'
  },
  {
    id: 'DAQ-2023-029',
    title: '大庆油田-区块15',
    type: '面',
    workarea: '大庆油田',
    geometry: '面',
    createTime: '2023-08-11'
  },
  {
    id: 'DAQ-2023-042',
    title: '大庆油田-数字高程模型',
    type: '网格',
    workarea: '大庆油田',
    geometry: '网格',
    createTime: '2023-09-05'
  },
  {
    id: 'SW-2023-001',
    title: '西南油田-井位98',
    type: '点',
    workarea: '西南油田',
    geometry: '点',
    createTime: '2023-06-15'
  },
  {
    id: 'SW-2023-015',
    title: '西南油田-断层线32',
    type: '线',
    workarea: '西南油田',
    geometry: '线',
    createTime: '2023-07-22'
  },
  {
    id: 'SW-2023-028',
    title: '西南油田-区域22',
    type: '面',
    workarea: '西南油田',
    geometry: '面',
    createTime: '2023-08-10'
  },
  {
    id: 'SW-2023-042',
    title: '西南油田-数字高程模型',
    type: '网格',
    workarea: '西南油田',
    geometry: '网格',
    createTime: '2023-09-05'
  }
])


// 当前激活的工具
const activeTool = ref('select')

// 地图图层
const mapLayers = ref([
  { id: 'base', name: '基础地图', visible: true },
  { id: 'poi', name: '兴趣点', visible: true },
  { id: 'building', name: '建筑物', visible: true },
  { id: 'road', name: '道路', visible: true },
  { id: 'water', name: '水域', visible: true }
])

// 统计数据
const stats = reactive({
  poiCount: 127,
  area: 16853.57,
  population: 1260.00
})

// 当前坐标
const currentCoord = ref('120.1551, 30.2741')

// 主题模式
const isLightMode = ref(false)

// 面包屑导航路径
const breadcrumbPath = ref(['地理数据集', '华东地区', '杭州市'])

/**
 * 处理节点选择
 * @param {Object} selectedNode - 选中的节点对象
 */
const handleNodeSelect = (selectedNode) => {
  // 递归更新节点状态
  const updateNodeState = (nodes) => {
    for (const node of nodes) {
      if (node.id === selectedNode.id) {
        node.active = true
      } else {
        node.active = false
      }
      if (node.children) {
        updateNodeState(node.children)
      }
    }
  }
  updateNodeState(treeData.value)
  
  // 更新面包屑路径 - 显示固定的地理数据集路径
  // 无论选择哪个数据树节点，都显示地理数据集/华东地区/杭州市
  breadcrumbPath.value = ['地理数据集', '华东地区', '杭州市']
  
  // 根据选中的节点类型更新筛选条件
  updateFilterByNode(selectedNode)
}

/**
 * 根据选中的节点更新筛选条件
 * @param {Object} node - 选中的节点
 */
const updateFilterByNode = (node) => {
  // 重置筛选条件
  filterData.workarea = ''
  filterData.dataType = ''
  filterData.spatialOperator = ''
  filterData.distance = 1000
  filterData.keyword = ''
  filterData.queryField = ''
  filterData.dateRange.start = ''
  filterData.dateRange.end = ''
  
  // 根据节点类型设置筛选条件
  if (node.id === 'daqing') {
    // 选中大庆油田
    filterData.workarea = 'daqing'
  } else if (node.id === 'southwest') {
    // 选中西南油田
    filterData.workarea = 'southwest'
  } else if (node.id === 'daqing-point' || node.id === 'southwest-point') {
    // 选中点类型
    filterData.dataType = 'point'
    // 设置工作区
    if (node.id.startsWith('daqing')) {
      filterData.workarea = 'daqing'
    } else if (node.id.startsWith('southwest')) {
      filterData.workarea = 'southwest'
    }
  } else if (node.id === 'daqing-line' || node.id === 'southwest-line') {
    // 选中线类型
    filterData.dataType = 'line'
    // 设置工作区
    if (node.id.startsWith('daqing')) {
      filterData.workarea = 'daqing'
    } else if (node.id.startsWith('southwest')) {
      filterData.workarea = 'southwest'
    }
  } else if (node.id === 'daqing-polygon' || node.id === 'southwest-polygon') {
    // 选中面类型
    filterData.dataType = 'polygon'
    // 设置工作区
    if (node.id.startsWith('daqing')) {
      filterData.workarea = 'daqing'
    } else if (node.id.startsWith('southwest')) {
      filterData.workarea = 'southwest'
    }
  } else if (node.id === 'daqing-grid' || node.id === 'southwest-grid') {
    // 选中网格类型
    filterData.dataType = 'grid'
    // 设置工作区
    if (node.id.startsWith('daqing')) {
      filterData.workarea = 'daqing'
    } else if (node.id.startsWith('southwest')) {
      filterData.workarea = 'southwest'
    }
  } else if (node.id === 'daqing-well' || node.id === 'southwest-well') {
    // 选中井位
    filterData.dataType = 'point'
    // 设置工作区
    if (node.id.startsWith('daqing')) {
      filterData.workarea = 'daqing'
    } else if (node.id.startsWith('southwest')) {
      filterData.workarea = 'southwest'
    }
  } else if (node.id === 'daqing-fault' || node.id === 'southwest-fault') {
    // 选中断层线
    filterData.dataType = 'line'
    // 设置工作区
    if (node.id.startsWith('daqing')) {
      filterData.workarea = 'daqing'
    } else if (node.id.startsWith('southwest')) {
      filterData.workarea = 'southwest'
    }
  }
  
  // 自动切换到筛选与查询标签页
  activeTab.value = 'filter-query'
  
  // 执行查询
  performQuery()
}

/**
 * 切换主题模式
 */
const toggleTheme = () => {
  isLightMode.value = !isLightMode.value
  if (isLightMode.value) {
    document.documentElement.classList.add('light-mode')
  } else {
    document.documentElement.classList.remove('light-mode')
  }
  // 保存主题偏好到本地存储
  localStorage.setItem('theme', isLightMode.value ? 'light' : 'dark')
}

/**
 * 初始化主题
 */
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'light') {
    isLightMode.value = true
    document.documentElement.classList.add('light-mode')
  }
}

// 初始化主题
initTheme()

/**
 * 执行空间数据库查询
 */
const performQuery = () => {
  console.log('执行查询:', filterData)
  // 这里可以添加空间数据库查询逻辑
  // 模拟查询结果
  searchResults.value = [
    {
      id: 'DAQ-2023-001',
      title: '大庆油田-井位127',
      type: '点',
      workarea: '大庆油田',
      geometry: '点',
      createTime: '2023-06-15'
    },
    {
      id: 'DAQ-2023-002',
      title: '大庆油田-散点356',
      type: '点',
      workarea: '大庆油田',
      geometry: '点',
      createTime: '2023-06-16'
    },
    {
      id: 'DAQ-2023-015',
      title: '大庆油田-断层线45',
      type: '线',
      workarea: '大庆油田',
      geometry: '线',
      createTime: '2023-07-22'
    },
    {
      id: 'DAQ-2023-016',
      title: '大庆油田-等值线89',
      type: '线',
      workarea: '大庆油田',
      geometry: '线',
      createTime: '2023-07-23'
    },
    {
      id: 'DAQ-2023-028',
      title: '大庆油田-区域28',
      type: '面',
      workarea: '大庆油田',
      geometry: '面',
      createTime: '2023-08-10'
    },
    {
      id: 'DAQ-2023-029',
      title: '大庆油田-区块15',
      type: '面',
      workarea: '大庆油田',
      geometry: '面',
      createTime: '2023-08-11'
    },
    {
      id: 'DAQ-2023-042',
      title: '大庆油田-数字高程模型',
      type: '网格',
      workarea: '大庆油田',
      geometry: '网格',
      createTime: '2023-09-05'
    },
    {
      id: 'SW-2023-001',
      title: '西南油田-井位98',
      type: '点',
      workarea: '西南油田',
      geometry: '点',
      createTime: '2023-06-15'
    },
    {
      id: 'SW-2023-015',
      title: '西南油田-断层线32',
      type: '线',
      workarea: '西南油田',
      geometry: '线',
      createTime: '2023-07-22'
    },
    {
      id: 'SW-2023-028',
      title: '西南油田-区域22',
      type: '面',
      workarea: '西南油田',
      geometry: '面',
      createTime: '2023-08-10'
    },
    {
      id: 'SW-2023-042',
      title: '西南油田-数字高程模型',
      type: '网格',
      workarea: '西南油田',
      geometry: '网格',
      createTime: '2023-09-05'
    }
  ]
}

/**
 * 切换图层可见性
 * @param {string} layerId - 图层ID
 */
const toggleLayer = (layerId) => {
  const layer = mapLayers.value.find(l => l.id === layerId)
  if (layer) {
    layer.visible = !layer.visible
  }
}
</script>

<style scoped>
/* 组件特定样式 */
</style>