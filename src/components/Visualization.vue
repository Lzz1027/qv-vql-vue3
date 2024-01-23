<script setup>
import { ref, onMounted, markRaw, watch } from 'vue'
import { MarkerType, useVueFlow, VueFlow, Position } from '@vue-flow/core'
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'd3-force'
import { Background } from '@vue-flow/background'

import '@vue-flow/minimap/dist/style.css'
import { MiniMap } from '@vue-flow/minimap'

import '@vue-flow/controls/dist/style.css'
import { Controls } from '@vue-flow/controls'
import CustomNode from './graphComponents/Node.vue'
import CustomEdge from './graphComponents/Edge.vue'
import CustomEdgeNotEqual from './graphComponents/EdgeNotequal.vue'
import { useNeo4jStore } from '../stores/neo4j';

const { fitView } = useVueFlow()

const nodeTypes = {
  custom: markRaw(CustomNode)
}

const edgeTypes = {
  custom: markRaw(CustomEdge),
  customNotEqual: markRaw(CustomEdgeNotEqual)
}

// 
const neo4jStore = useNeo4jStore()
watch(neo4jStore, () => {
  if (neo4jStore.vqlGraph) {
    const tempGraph = genVqlFromGraph(neo4jStore.vqlGraph)
    const graph = calculatePosition(tempGraph)
    const coloredGraph = genColorForNodes(graph)
    renderGraph(coloredGraph)
    
  }

})



const vqlGraph = ref([])

const genVqlFromGraph = (graph) => {
  vqlGraph.value = []
  let tempGraph = {
    nodes: [],
    edges: []
  }
  graph.nodes.forEach(node => {
    let nodeData = {
      id: node.nodeId,
      type: 'custom',
      label: node.nodeSymbol,
      data: {
        label: node.nodeLabels,
        props: node.nodeProperties
      },
      // 随机生成整数位置
      position: {
        x: Math.floor(Math.random() * 1000),
        y: Math.floor(Math.random() * 1000),
      }
    }
    tempGraph.nodes.push(nodeData)
  })

  graph.edges.forEach(edge => {
    // 根据 edge 的 edgeSource 中的 nodeSymbol，在 tempGraph.nodes 中找到有相同 nodeSymbol 的 node, 得到其 nodeId

    let edgeSource = tempGraph.nodes.find(node => node.label === edge.edgeSource.nodeSymbol)

    let edgeTarget = tempGraph.nodes.find(node => node.label === edge.edgeTarget.nodeSymbol)


    let edgeSourceId = edgeSource.id

    let edgeTargetId = edgeTarget.id

    let edgeData = {
      id: edge.edgeId,
      source: edgeSourceId,
      target: edgeTargetId,
      type: 'custom',
      markerEnd: MarkerType.ArrowClosed,
      animated: true,
      data: {
        label: edge.edgeType,
        props: edge.edgeProperties
      },
    }

    tempGraph.edges.push(edgeData)
  })
  return tempGraph
}

const genColorForNodes = (graph) => {
  // 对于每个 node，根据其 label，计算出一个随机的浅色颜色，在其 data 中生成一个 color 属性，用于渲染节点的背景色
  graph.nodes.forEach(node => {
    let color = getColor(node.label)
    node.data.color = color
  })

  // 对于每个 edge，采用其 source 的 color，在其 data 中生成一个 color 属性，用于渲染 edge 的颜色
  graph.edges.forEach(edge => {
    let sourceNode = graph.nodes.find(node => node.id === edge.source)
    edge.data.color = sourceNode.data.color
  })

  return graph

}

// 上色函数
const getColor = (value) => {
  let color = '#' + getHashCode(value).toString(16).substring(0, 6)
  let rgb = getLightColor(color, 0.6)
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
};

const hexToRgb = (str) => {
    let hexs = null;
    let reg = /^\#?[0-9A-Fa-f]{6}$/;
    if (!reg.test(str))  return alert('色值不正确')
    str = str.replace('#', '') // 去掉#
    hexs = str.match(/../g) // 切割成数组 409EFF => ['40','9E','FF']
    // 将切割的色值转换为16进制
    for (let i = 0; i < hexs.length; i++) hexs[i] = parseInt(hexs[i], 16)
    return hexs  // 返回rgb色值[64, 158, 255]
}

const getLightColor = (color, level) => {
    let reg = /^\#?[0-9A-Fa-f]{6}$/;
    if (!reg.test(color)) return alert('色值不正确')
    let rgb = hexToRgb(color);
    // 循环对色值进行调整
    for(let i = 0 ; i < 3 ; i++){
        rgb[i] = Math.floor((255 - rgb[i]) * level + rgb[i]) // 始终保持在0-255之间
    }
    return rgb  // [159, 206, 255]
}


const getHashCode = (str) => {
  let hash = 0;
  let ch;
  for (let i = str.length - 1; i >= 0; i--) {
    ch = str.charCodeAt(i);
    hash ^= (hash << 5) + ch + (hash >> 2);
  }
  return hash & 0x7fffffff;
};

const calculatePosition = (graph) => {
  const simulation = forceSimulation(graph.nodes)
    .force('link', forceLink(graph.edges).id(d => d.id).strength(0.8))
    .force('charge', forceManyBody().strength(-5000))
    .force('center', forceCenter(300, 300))
    .stop()

  for (let i = 0; i < 300; i++) {
    simulation.tick()
  }

  graph.nodes.forEach(node => {
    node.position = {
      x: node.x,
      y: node.y
    }
  })


  // 将每个edge的source和target修改为其id

  graph.edges.forEach(edge => {
    edge.source = edge.source.id
    edge.target = edge.target.id
  })
  return graph
}

// 渲染图
const renderGraph = (graph) => {
  // 将 graph 中的 nodes 和 edges 数组中的每个元素 push 到 vqlGraph 中

  graph.nodes.forEach(node => {
    vqlGraph.value.push(node)
  })

  graph.edges.forEach(edge => {
    vqlGraph.value.push(edge)
  })

  // 等待10毫秒后调用 useViewFLow 的 fitView 方法，使得图居中显示
  setTimeout(() => {
    fitView({ padding: 0.2, includeHiddenNodes: true })
  }, 10)
}



</script>

<template>
  <div class="vis-container">
    <VueFlow v-model="vqlGraph" connection-mode="loose" :snap-to-grid="true" :node-types="nodeTypes"
      :edge-types="edgeTypes" fit-view-on-init>
      <Background></Background>
      <!-- <MiniMap pannable zoomable /> -->
      <Controls />
    </VueFlow>
  </div>
</template>

<style scoped>
/* import the necessary styles for Vue Flow to work */

.vue-flow__edges {
  z-index: 1;
}

.vis-container {
  width: 100%;
  height: 100%;
  box-shadow: 1px 1px 5px black;
}
</style>