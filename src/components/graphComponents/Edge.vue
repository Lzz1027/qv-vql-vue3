<script setup>
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useVueFlow,
} from '@vue-flow/core'
import { computed, onMounted } from 'vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  sourceX: {
    type: Number,
    required: true,
  },
  sourceY: {
    type: Number,
    required: true,
  },
  targetX: {
    type: Number,
    required: true,
  },
  targetY: {
    type: Number,
    required: true,
  },
  sourcePosition: {
    type: String,
    required: true,
  },
  targetPosition: {
    type: String,
    required: true,
  },
  data: {
    type: Object,
    required: false,
  },
  label: {
    type: String,
    required: false,
  },
  markerEnd: {
    type: String,
    required: false,
  },
  style: {
    type: Object,
    required: false,
  },
})

const { removeEdges } = useVueFlow()

const path = computed(() =>
  getStraightPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    targetX: props.targetX,
    targetY: props.targetY,
    sourcePosition: props.sourcePosition,
    targetPosition: props.targetPosition,
  })
)

onMounted(() => {
  // console.log(props.data)
  // 读取 data 中的 hsl color
  const color = props.data.color
  // 设置节点内的背景色
  const edgePath = document.getElementById(props.id + '-path')
  const edgeLabel = document.getElementById(props.id + '-label')

  const edgeLabelDiv = edgeLabel.getElementsByClassName('custom-vql-lable-item')
  const edgePropsDiv = edgeLabel.getElementsByClassName('custom-vql-props-item')
  // 如果存在，则设置节点edgePath、edgeLabelDiv、edgePropsDiv的背景色
  if (edgePath) {
    if (props.data.type && props.data.type === 'notEdges') {
      edgePath.style.stroke = '#ee7777'
    } else {
      edgePath.style.stroke = color
      edgePath.style.strokeWidth = '3px'
    }
  }

  if (edgeLabelDiv) {
    // 在 rgb color 上，叠加一层 rgba(0, 0, 0, 0.2)
    let newColor = `rgba(${color.slice(4, -1)}, 1)`
    // 将每个label的背景色设置为newColor
    for (let i = 0; i < edgeLabelDiv.length; i++) {
      edgeLabelDiv[i].style.backgroundColor = newColor
    }
  }
  if (edgePropsDiv) {
    // 在 rgb color 上，叠加一层 rgba(0, 0, 0, 0.2)
    let newColor = `rgba(${color.slice(4, -1)}, 0.5)`
    // 将每个props的背景色设置为color
    for (let i = 0; i < edgePropsDiv.length; i++) {
      edgePropsDiv[i].style.backgroundColor = newColor
    }
  }
})
</script>

<script>
export default {
  inheritAttrs: false,
}
</script>

<template>
  <!-- You can use the `BaseEdge` component to create your own custom edge more easily -->
  <BaseEdge
    class="custom-edge"
    :id="id + '-path'"
    :style="style"
    :path="path[0]"
    :marker-end="markerEnd"
    style="z-index: 1"
  />

  <!-- Use the `EdgeLabelRenderer` to escape the SVG world of edges and render your own custom label in a `<div>` ctx -->
  <EdgeLabelRenderer>
    <div
      :id="id + '-label'"
      :style="{
        pointerEvents: 'all',
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${path[1]}px,${path[2]}px)`,
      }"
      class="nodrag nopan"
    >
      <!-- label -->
      <div class="custom-vql-lable" v-if="props.data.label !== null">
        <div class="custom-vql-lable-item" v-for="value in props.data.label">
          {{ value }}
        </div>
      </div>
      <!-- props -->
      <div class="custom-vql-props" v-if="props.data.props !== null">
        <div
          class="custom-vql-props-item"
          v-for="(value, key) in props.data.props"
        >
          <div class="custom-vql-props-item-key">{{ key }}:</div>
          <div class="custom-vql-props-item-value">
            {{ value }}
          </div>
        </div>
      </div>
    </div>
  </EdgeLabelRenderer>
</template>

<style scoped>
.custom-edge {
  visibility: hidden;
}

.custom-vql-lable-ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.custom-vql-lable-li {
  padding: 0;
  margin: 0;
}

.custom-vql-props-ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.custom-vql-props-li {
  padding: 0;
  margin: 0;
}
</style>
