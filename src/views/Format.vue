<template>

  <div class="file-converter-container">
    <!-- 页面头部 -->
    <el-page-header content="双狐格式转换工具" title="回到主页" class="page-header" @back="goBack" />
    <!-- 核心转换区域 -->
    <el-card class="converter-card">
      <el-form :model="formData" label-width="100px" class="converter-form">
        <!-- 文件上传区域 -->
        <el-form-item label="选择文件" prop="file">
          <el-upload ref="uploadRef" v-model:file-list="fileList" :show-file-list="false" :auto-upload="false"
            :multiple="true" :limit="uploadLimit" :on-exceed="handleExceed" :on-remove="handleRemove"
            class="upload-demo" drag action="#">
            <!-- ...现有内容... -->
            <div class="el-upload__tip">
              {{ uploadLimit === 1 ? '仅支持单个' : '支持多个' }}文件上传
              {{ uploadLimit > 1 ? '，可按住Ctrl/Cmd键多选文件' : '' }}
              <!-- 支持源格式：{{ supportSourceFormats.join('、') }} -->
              <div v-if="isProjectFile" class="project-file-warning">
                <el-alert type="warning" :title="`上传${projectFileTypeName}工程文件：需要以下关联文件`"
                  :description="requiredFilesForProject.join(', ')" center :closable="false" />
              </div>
              <div v-if="isProjectFile && fileList.length > 1" class="file-check-status">
                <el-tag :type="checkProjectFilesComplete() ? 'success' : 'danger'">
                  {{ checkProjectFilesComplete() ? '关联文件完整' : '关联文件不完整' }}
                </el-tag>
                <div v-if="!checkProjectFilesComplete()" class="missing-files">
                  缺少: {{
                    requiredFilesForProject
                      .filter(ext => !fileList.some(file => file.name.toLowerCase().endsWith(ext.toLowerCase())))
                      .join(', ')
                  }}
                </div>
              </div>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item style="margin-top: -20px;">
          <div v-if="fileList.length > 0" class="file-list-preview">
            <div class="file-item" v-for="(file, index) in fileList" :key="index">
              <i :class="getFileIcon(file.name)" />
              <span class="file-name">{{ file.name }}</span>
              <el-tag v-if="isMainProjectFile(file)" size="small" type="success" style="margin-left: 5px">
                主文件
              </el-tag>
              <el-button class="auto-margin" size="small" @click.stop="removeFile(index)">
                移除
              </el-button>
            </div>
          </div>
        </el-form-item>
        <!-- 格式选择区域 -->
        <el-form-item label="转换格式" prop="targetFormat">
          <el-select v-model="formData.targetFormat" placeholder="请选择要转换的目标格式" :disabled="!fileList.length">
            <el-option v-for="format in getTargetFormats()" :key="format.value" :label="format.label"
              :value="format.value" />
          </el-select>
        </el-form-item>

        <!-- 转换按钮 -->
        <el-form-item>
          <el-button type="primary" @click="handleConvert" :loading="converting"
            :disabled="!fileList.length || !formData.targetFormat">
            开始转换
          </el-button>
          <el-button @click="handleReset" style="margin-left: 10px">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 转换结果展示 -->
    <el-card class="result-card" v-if="convertResult" header="转换结果">
      <el-alert :type="convertResult.success ? 'success' : 'error'" :title="convertResult.message" show-icon />
      <el-button v-if="convertResult.success" type="text" @click="handleDownload" style="margin-top: 10px">
        <i class="el-icon-download" /> 下载转换后的文件
      </el-button>
    </el-card>
  </div>


  <!-- 在上传区域下方添加文件列表预览 -->

</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 上传组件引用
const uploadRef = ref(null)
// 文件基础路径
const fileUrl = ref(window.webConfig.fileUrl);
const notifyUrl = ref(window.webConfig.baseUrl);

// 支持的源格式和目标格式映射
const formatMap = {
  dfd: ['pcg', 'dfb', 'dml', 'gdbx', 'gdb'],
  dfb: ['pcg', 'dfd', 'dml', 'gdbx', 'gdb'],
  gdb: ['pcg', 'dfd', 'dfb', 'dml', 'gdbx'],
  gdbx: ['pcg', 'dfd', 'dfb', 'dml', 'gdbx',],
  mpj: ['pcg', 'dfd', 'dfb', 'dml', 'gdbx', 'gdb'],
  shp: ['pcg', 'dfd', 'dfb', 'dml', 'gdbx', 'gdb'],
  cgm: ['pcg', 'dfd', 'dfb', 'dml', 'gdbx', 'gdb'],
  dxf: ['pcg', 'dfd', 'dfb', 'dml', 'gdbx', 'gdb'],
  cdr: ['pcg', 'dfd', 'dfb', 'dml', 'gdbx', 'gdb']
}

// 添加辅助方法
const isMainProjectFile = (file) => {
  if (!isProjectFile.value) return false;
  const mainFileName = fileList.value[0].name.split('.')[0];
  return file.name === fileList.value[0].name;
};

const getFileIcon = (fileName) => {
  const ext = fileName.split('.').pop().toLowerCase();
  const iconMap = {
    'shp': 'el-icon-map-location',
    'shx': 'el-icon-coordinate',
    'dbf': 'el-icon-tickets',
    'prj': 'el-icon-set-up',
    'mpj': 'el-icon-folder-opened',
    'dat': 'el-icon-document',
    'sym': 'el-icon-star-filled',
    'idx': 'el-icon-takeaway-box'
  };
  return iconMap[ext] || 'el-icon-document';
};

// 添加计算属性：根据文件类型动态设置上传限制
const uploadLimit = computed(() => {
  if (fileList.value.length === 0) return 1;

  const fileExt = fileList.value[0].name.split('.').pop().toLowerCase();
  // MPJ和SHP工程文件需要多文件上传
  if (['mpj', 'shp'].includes(fileExt)) {
    return 10; // 工程文件允许上传多个关联文件
  }
  return 1; // 其他文件仍限制为单文件
});

// 判断是否为工程文件
const isProjectFile = computed(() => {
  return fileList.value.length > 0 &&
    ['mpj', 'shp'].includes(fileList.value[0].name.split('.').pop().toLowerCase());
});

// 获取工程文件类型名称
const projectFileTypeName = computed(() => {
  if (!isProjectFile.value) return '';
  const ext = fileList.value[0].name.split('.').pop().toLowerCase();
  return ext === 'mpj' ? 'mpj' : 'shp';
});

// 获取工程文件所需关联文件列表
const requiredFilesForProject = computed(() => {
  if (!isProjectFile.value) return [];

  const ext = fileList.value[0].name.split('.').pop().toLowerCase();
  if (ext === 'shp') {
    return ['.shx', '.dbf', '.prj'];
  } else if (ext === 'mpj') {
    return ['.wl', '.wp', '.wt'];
  }
  return [];
});

// 检查关联文件是否完整
const checkProjectFilesComplete = () => {
  if (!isProjectFile.value) return true;

  const mainFileExt = fileList.value[0].name.split('.').pop().toLowerCase();
  const mainFileName = fileList.value[0].name.split('.')[0];

  const requiredExts = requiredFilesForProject.value;
  const uploadedExts = fileList.value.map(file => {
    const ext = file.name.split('.').pop().toLowerCase();
    return `.${ext}`;
  });

  // 检查是否包含所有必需的扩展名
  return requiredExts.every(ext => uploadedExts.includes(ext)) &&
    // 检查文件名是否匹配（除扩展名外）
    fileList.value.every(file =>
      file.name.startsWith(mainFileName)
    );
};

// 支持的源格式列表
const supportSourceFormats = Object.keys(formatMap)

// 文件列表
const fileList = ref([])

// 表单数据
const formData = reactive({
  targetFormat: '.pcg'
})

// 转换状态
const converting = ref(false)

// 转换结果
const convertResult = ref(null)

// 处理文件超出限制
const handleExceed = (files, uploadFiles) => {
  if (isProjectFile.value) {
    ElMessage.warning(`工程文件需要上传多个关联文件，请确保已上传所有必要文件`);
  } else {
    ElMessage.warning(`当前限制选择 1 个文件，本次选择了 ${files.length} 个文件，已自动忽略多余文件`);
  }
};

// 处理文件移除
const handleRemove = () => {
  formData.targetFormat = '.pcg'
  convertResult.value = null
}

const goBack = () => {
  window.location.href = window.webConfig.routerBase;
}
// 获取当前文件可转换的目标格式
const getTargetFormats = () => {
  if (!fileList.value.length) return []
  // 获取文件后缀名
  const fileExt = fileList.value[0].name.split('.').pop().toLowerCase()
  if (!formatMap[fileExt]) return []
  // 构建下拉选项
  return formatMap[fileExt].map(ext => ({
    label: `.${ext}`,
    value: `.${ext}`
  }))
}

// 重置操作
const handleReset = () => {
  fileList.value = []
  formData.targetFormat = '.pcg'
  convertResult.value = null
  uploadRef.value.clearFiles()
  converting.value = false;
}

const blobData = ref(null);
// 文件转换
const handleConvert = async () => {
  try {
    converting.value = true;
    convertResult.value = null;

    const sourceFile = fileList.value[0];
    const sourceExt = sourceFile.name.split('.').pop().toLowerCase();

    // 工程文件检查
    if (['mpj', 'shp'].includes(sourceExt) && fileList.value.length === 1) {
      ElMessage.error(`错误：${sourceFile.name} 是工程文件，需要上传所有关联文件才能转换`);
      converting.value = false;
      return;
    }

    // 检查关联文件完整性
    if (isProjectFile.value && !checkProjectFilesComplete()) {
      const missingFiles = requiredFilesForProject.value
        .filter(ext => !fileList.value.some(file =>
          file.name.toLowerCase().endsWith(ext.toLowerCase())
        ))
        .join(', ');

      ElMessageBox.confirm(
        `检测到缺少必要关联文件：${missingFiles}\n\n是否继续尝试转换？\n(转换可能失败)`,
        '关联文件不完整',
        {
          confirmButtonText: '继续转换',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        await processConversion();
      }).catch(() => {
        converting.value = false;
      });
      return;
    }

    await processConversion();
  } catch (error) {
    // ...错误处理
  }
};

// 独立的转换处理函数
const processConversion = async () => {
  const sourceFile = fileList.value[0];
  const sourceExt = sourceFile.name.split('.').pop().toLowerCase();
  const mainFileName = sourceFile.name.split('.')[0];

  // 创建 FormData 对象
  const formDataObj = new FormData();

  // 添加所有文件（支持工程文件）
  fileList.value.forEach(file => {
    formDataObj.append('fromFiles', file.raw, file.name);
  });

  // 添加目标文件名
  formDataObj.append('toFileName', `${mainFileName}${formData.targetFormat}`);
console.log("转换");

  // 发送请求
  blobData.value = await axios.post(
    `${notifyUrl.value}/api/doublefoxapp/serverproxy/map/formatConverts`,
    formDataObj,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      responseType: 'blob'
    }
  );
  // 处理响应
  convertResult.value = {
    success: true,
    message: `文件 ${sourceFile.name} 已成功转换为 ${formData.targetFormat} 格式`,
    fileName: `${mainFileName}${formData.targetFormat}`
  };

  ElMessage.success('转换成功！');
  converting.value = false;
};

// 下载文件
const handleDownload = () => {
  if (!convertResult.value?.success) return;

  // 检查是否为工程文件转换结果
  const targetExt = formData.targetFormat;
  const isTargetProject = ['mpj', 'shp', 'gdb', 'gdbx'].includes(targetExt);

  ElMessage.success(`已开始下载：${convertResult.value.fileName}`);

  // 处理文件流响应
  const blob = new Blob([blobData.value.data], {
    type: isTargetProject ? 'application/zip' : 'application/octet-stream'
  });

  const fileName = convertResult.value.fileName;

  // 创建下载链接
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();

  // 清理
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 100);
};

const removeFile = (index) => {
  // 从fileList中移除指定文件
  fileList.value.splice(index, 1);

  // 如果没有文件了，重置相关状态
  if (fileList.value.length === 0) {
    formData.targetFormat = '.pcg';
    convertResult.value = null;
  }

  // 检查是否需要更新工程文件状态
  if (isProjectFile.value && !checkProjectFilesComplete()) {
    ElMessage.warning('关联文件不完整，请补充必要文件');
  }
};
</script>

<style scoped>
/* 使按钮自动靠右对齐 */
.auto-margin {
  margin-left: auto !important;
}

/* 添加到<style>部分 */
.file-list-preview {
  margin-top: 15px;
  padding: 10px;
  background: #eef0f2;
  border-radius: 4px;
}

.file-item {
  width: 598px;
  height: 30px;
  display: flex;
  align-items: center;
  padding: 5px 0;
  font-size: 14px;
}

.file-name {
  margin-left: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
}

.project-file-warning {
  margin: 10px 0;
}

.file-check-status {
  margin-top: 10px;
  padding: 8px;
  background-color: #f5f7fa;
  border-radius: 4px;
}

.missing-files {
  color: #F56C6C;
  margin-top: 5px;
  font-size: 12px;
}

.el-upload__tip {
  width: 593px;
}

.file-converter-container {
  max-width: 800px;
  margin: 20px auto;
  padding: 0 20px;
}

.page-header {
  margin-bottom: 20px;
  color: #444;
}

.converter-card {
  margin-bottom: 20px;
}

.converter-form {
  padding: 10px 0;
}

.result-card {
  animation: fadeIn 0.3s ease;
}

/* 在<style>部分添加 */
.el-upload__input {
  /* 确保多选功能在所有浏览器中正常工作 */
  position: absolute;
  top: 0;
  right: 0;
  margin: 0;
  border: solid 1px transparent;
  cursor: pointer;
  opacity: 0;
  filter: alpha(opacity=0);
  font-size: 999px;
  min-height: 100%;
  width: 100%;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>