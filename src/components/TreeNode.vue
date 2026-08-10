<template>
  <div class="tree-item">
    <div 
      class="tree-node" 
      :class="{ active: node.active }"
      @click="handleNodeClick"
    >
      <!-- 展开/折叠按钮 -->
      <span 
        v-if="node.children && node.children.length > 0"
        class="tree-toggle" 
        :class="{ expanded: node.expanded }"
      >
        <svg viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
      </span>
      <span v-else class="tree-toggle"></span>
      
      <!-- 节点图标 -->
      <span class="tree-icon">
        <svg v-if="node.icon === 'folder'" viewBox="0 0 24 24" fill="currentColor"><path d="M20 6h-8l-2-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2z"/></svg>
        <svg v-else-if="node.icon === 'database'" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.72V12H5V6.3l7-3.11v8.8z"/></svg>
        <svg v-else-if="node.icon === 'point'" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>
        <svg v-else-if="node.icon === 'line'" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
        <svg v-else-if="node.icon === 'polygon'" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
        <svg v-else-if="node.icon === 'grid'" viewBox="0 0 24 24" fill="currentColor"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></svg>
        <svg v-else viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>
      </span>
      
      <!-- 节点标签 -->
      <span class="tree-label">{{ node.label }}</span>
      
      <!-- 节点徽章 -->
      <span v-if="node.badge" class="tree-badge">{{ node.badge }}</span>
    </div>
    
    <!-- 子节点 -->
    <div 
      v-if="node.children && node.children.length > 0"
      class="tree-children" 
      :class="{ expanded: node.expanded }"
    >
      <TreeNode 
        v-for="child in node.children" 
        :key="child.id"
        :node="child"
        @select="$emit('select', $event)"
      />
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

// 定义组件属性
const props = defineProps({
  node: {
    type: Object,
    required: true
  }
})

// 定义组件事件
const emit = defineEmits(['select'])

/**
 * 处理节点点击
 */
const handleNodeClick = () => {
  // 切换展开/折叠状态
  if (props.node.children && props.node.children.length > 0) {
    props.node.expanded = !props.node.expanded
  } else {
    // 只有当节点没有子节点时，才触发选择事件
    emit('select', props.node)
  }
}
</script>

<style scoped>
/* 组件特定样式 */
</style>