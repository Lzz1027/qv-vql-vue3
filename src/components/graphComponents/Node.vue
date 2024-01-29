<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Handle, Position } from '@vue-flow/core'

import { NodeToolbar } from '@vue-flow/node-toolbar'

import {
  EditOutlined,
  PlusOutlined,
  ArrowsAltOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons-vue'

import { message } from 'ant-design-vue'
import { useNeo4jStore } from '../../stores/neo4j'

const neo4jStore = useNeo4jStore()
const props = defineProps(['label', 'data', 'id'])

let currentId = props.id
let currentLabel = props.label
let currentData = props.data

// 控制节点操作对话框的显示
const editModalVisible = ref(false)
const linkModalVisible = ref(false)
const newModalVisible = ref(false)

const setEditModalVisible = () => {
  editModalVisible.value = !editModalVisible.value
}

const setLinkModalVisible = () => {
  linkModalVisible.value = !linkModalVisible.value
}

const setNewModalVisible = () => {
  newModalVisible.value = !newModalVisible.value
}

const newNodeForm = reactive({
  id: 'n-' + Math.random().toString(16).slice(2),
  name: '',
  labels: [],
  props: [],
})

const currentNodeForm = reactive({
  id: props.id,
  name: props.label,
  labels: [],
  props: [],
})

if (props.data.label) {
  props.data.label.forEach((label) => {
    currentNodeForm.labels.push({
      text: label,
      id: Date.now(),
    })
  })
}

if (props.data.props) {
  // props.data.props 是一个对象，将对象中的每个属性转换为数组
  Object.keys(props.data.props).forEach((key) => {
    currentNodeForm.props.push({
      key: key,
      value: props.data.props[key],
      id: Date.now(),
    })
  })
}

const removeLabel = (item, form) => {
  const index = form.labels.indexOf(item)
  if (index !== -1) {
    form.labels.splice(index, 1)
  }
}
const addLabel = (form) => {
  form.labels.push({
    text: '',
    id: Date.now(),
  })
}

const removeProp = (item, form) => {
  const index = form.props.indexOf(item)
  if (index !== -1) {
    form.props.splice(index, 1)
  }
}

const addProp = (form) => {
  form.props.push({
    key: '',
    value: '',
    id: Date.now(),
  })
}

// 编辑节点对话框
const handleEditModal = (e) => {
  console.log(e)
  // 如果当前编辑的是匿名节点，则不允许编辑
  if (currentLabel == 'anonymous') {
    message.error('Anonymous node cannot be edited!')
    return
  } else {
    setEditModalVisible()
  }
  // 从props中获取节点的label、data
}

const handleEditModalOk = (e) => {
  console.log(e)
  let oldQuery = neo4jStore.query
  console.log(oldQuery)
  // 在 oldQuery 字符串中，找到第一个的 props.label 的位置，存到数组中
  let firstIndex = oldQuery.indexOf(props.label)
  // 对于第一个位置，匹配到其之前的第一个括号和之后的第一个括号，将这中间的字符串替换为 currentNodeForm 的信息
  let firstLeftIndex = oldQuery.lastIndexOf('(', firstIndex)
  let firstRightIndex = oldQuery.indexOf(')', firstIndex)
  // 将 currentNodeForm 的信息转换为字符串
  let newLabels = currentNodeForm.labels.map((label) => label.text)
  let newNodeInfo = `(${currentNodeForm.name}:${newLabels.join(
    ':'
  )} {${currentNodeForm.props
    .map((prop) => `${prop.key}: '${prop.value}'`)
    .join(', ')}})`

  console.log(newNodeInfo)
  // 替换第一个位置的字符串
  let newQuery =
    oldQuery.slice(0, firstLeftIndex) +
    newNodeInfo +
    oldQuery.slice(firstRightIndex + 1)

  // 将 newQuery中所有的 props.label 替换为 currentNodeForm.name
  newQuery = newQuery.replaceAll(props.label, currentNodeForm.name)
  
  neo4jStore.query = newQuery

  setEditModalVisible()
  // 从props中获取节点的label、data
}

const handleEditModalCancel = (e) => {
  console.log(e)
  setEditModalVisible()
}

// 新建节点对话框
const handleNewModal = (e) => {
  console.log(e)
  setNewModalVisible()
  // 给 newNodeForm 生成随机id
  newNodeForm.id = Math.random().toString(36).substr(2, 8)
}

// 链接节点对话框
const handleLinkModal = (e) => {
  console.log(e)
  setLinkModalVisible()
  // 从props中获取节点的label、data
}

onMounted(() => {
  // 读取 data 中的 hsl color
  let color = props.data.color
  if (props.label == 'anonymous') {
    color = '#ffffff'
  }
  // 设置节点内的背景色
  const node = document.getElementById(props.id)
  // 获取节点name、label、props的 div
  const nodeName = node.getElementsByClassName('custom-vql-name')[0]
  const nodeLabel = node.getElementsByClassName('custom-vql-lable-item')
  const nodeProps = node.getElementsByClassName('custom-vql-props-item')
  // 如果存在，则设置节点name、label、props的背景色
  if (nodeName) {
    nodeName.style.backgroundColor = color
  }
  if (nodeLabel) {
    // 在 rgb color 上，叠加一层 rgba(0, 0, 0, 0.2)
    let newColor = `rgba(${color.slice(4, -1)}, 0.2)`
    // 将每个label的背景色设置为newColor
    for (let i = 0; i < nodeLabel.length; i++) {
      nodeLabel[i].style.backgroundColor = newColor
    }
  }
  if (nodeProps) {
    // 在 rgb color 上，叠加一层 rgba(0, 0, 0, 0.2)
    let newColor = `rgba(${color.slice(4, -1)}, 0.5)`
    // 将每个props的背景色设置为color
    for (let i = 0; i < nodeProps.length; i++) {
      nodeProps[i].style.backgroundColor = newColor
    }
  }

  // 如果节点data中有 result 属性，则将 nodeName 的字体设置为粗体，颜色为红色，字体大小为 20px
  if (props.data.result) {
    nodeName.style.fontWeight = 'bold'
  }
})
</script>

<template>
  <!-- 节点本体 -->
  <div :id="props.id" class="custom-vql-node">
    <div class="custom-vql-name" @contextmenu="handleContextMenu">
      {{ label }}
    </div>
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

  <!-- 节点工具栏 -->
  <NodeToolbar
    style="display: flex; gap: 0.5rem; align-items: center"
    :is-visible="data.toolbarVisible"
    :position="data.toolbarPosition"
  >
    <!-- 编辑节点按钮 -->
    <a-tooltip placement="top">
      <template #title>
        <span>Edit current node</span>
      </template>
      <a-button shape="circle" @click="handleEditModal">
        <template #icon>
          <EditOutlined />
        </template>
      </a-button>
    </a-tooltip>

    <!-- 新节点按钮 -->
    <a-tooltip placement="top" @click="handleNewModal">
      <template #title>
        <span>Add new node</span>
      </template>
      <a-button shape="circle">
        <template #icon>
          <PlusOutlined />
        </template>
      </a-button>
    </a-tooltip>

    <!-- 链接按钮 -->
    <a-tooltip placement="top" @click="handleLinkModal">
      <template #title>
        <span>Link to </span>
      </template>
      <a-button shape="circle">
        <template #icon>
          <ArrowsAltOutlined />
        </template>
      </a-button>
    </a-tooltip>
  </NodeToolbar>

  <!-- 编辑节点对话框 -->
  <a-modal
    v-model:open="editModalVisible"
    title="Edit current node"
    centered
    @ok="setEditModalVisible"
  >
    <a-form
      name="editNode-Form"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 16 }"
      :model="currentNodeForm"
      @finish="onFinish"
    >
      <!-- 编辑节点 Symbol 输入框 -->
      <a-form-item label="Name" name="name">
        <a-input
          placeholder="Please enter the variable name of the node"
          v-model:value="currentNodeForm.name"
        />
      </a-form-item>

      <!-- 编辑节点 Label 输入框 -->
      <a-form-item
        label="Label"
        v-for="(label, index) in currentNodeForm.labels"
        class="modal-label-editor-container"
      >
        <a-space>
          <a-input
            class="modal-label-editor-inputer"
            v-model:value="label.text"
            placeholder="label"
          />
          <MinusCircleOutlined
            class="modal-delete"
            @click="removeLabel(label, currentNodeForm)"
          />
        </a-space>
      </a-form-item>

      <!-- 编辑节点 Props 输入框 -->
      <a-form-item label="Props" v-for="(prop, index) in currentNodeForm.props">
        <a-space>
          <a-input-group>
            <a-input
              v-model:value="prop.key"
              style="width: 50%"
              placeholder="key"
            />
            <a-input
              v-model:value="prop.value"
              style="width: 50%"
              placeholder="value"
            />
          </a-input-group>
          <MinusCircleOutlined
            class="modal-delete"
            @click="removeProp(prop, currentNodeForm)"
          />
        </a-space>
      </a-form-item>
    </a-form>
    <template #footer>
      <!-- 新标签按钮，点击增加新的label输入框 -->
      <a-button
        class="modal-button"
        key="addLabel"
        type="dashed"
        @click="addLabel(currentNodeForm)"
      >
        <a-plus-outlined /> Add label
      </a-button>
      <a-button
        class="modal-button"
        type="dashed"
        @click="addProp(currentNodeForm)"
      >
        <a-plus-outlined /> Add prop
      </a-button>
      <a-button class="modal-button" key="back" @click="handleEditModalCancel"
        >Cancel</a-button
      >
      <a-button
        class="modal-button"
        key="submit"
        type="primary"
        :loading="loading"
        @click="handleEditModalOk"
        >Submit</a-button
      >
    </template>
  </a-modal>

  <!-- 新建节点对话框 -->
  <a-modal
    v-model:open="newModalVisible"
    title="Add a new node"
    centered
    @ok="setNewModalVisible"
  >
    <a-form
      name="newNode-Form"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 16 }"
      :model="newNodeForm"
      @finish="onFinish"
    >
      <!-- 新节点 Symbol 输入框 -->
      <a-form-item label="Name" name="name">
        <a-input
          placeholder="Please enter the variable name of the node"
          v-model:value="newNodeForm.symbol"
        />
      </a-form-item>

      <!-- 新节点 Label 输入框 -->
      <a-form-item
        label="Label"
        v-for="(label, index) in newNodeForm.labels"
        class="modal-label-editor-container"
      >
        <a-space>
          <a-input
            class="modal-label-editor-inputer"
            v-model:value="label.text"
            placeholder="label"
          />
          <MinusCircleOutlined
            class="modal-delete"
            @click="removeLabel(label, newNodeForm)"
          />
        </a-space>
      </a-form-item>

      <!-- 新节点 Props 输入框 -->
      <a-form-item label="Props" v-for="(prop, index) in newNodeForm.props">
        <a-space>
          <a-input-group>
            <a-input
              v-model:value="prop.key"
              style="width: 50%"
              placeholder="key"
            />
            <a-input
              v-model:value="prop.value"
              style="width: 50%"
              placeholder="value"
            />
          </a-input-group>
          <MinusCircleOutlined
            class="modal-delete"
            @click="removeProp(prop, newNodeForm)"
          />
        </a-space>
      </a-form-item>
    </a-form>
    <template #footer>
      <!-- 新标签按钮，点击增加新的label输入框 -->
      <a-button
        class="modal-button"
        key="addLabel"
        type="dashed"
        @click="addLabel(newNodeForm)"
      >
        <a-plus-outlined /> Add label
      </a-button>
      <a-button
        class="modal-button"
        type="dashed"
        @click="addProp(newNodeForm)"
      >
        <a-plus-outlined /> Add prop
      </a-button>
      <a-button class="modal-button" key="back" @click="handleCancel"
        >Cancel</a-button
      >
      <a-button
        class="modal-button"
        key="submit"
        type="primary"
        :loading="loading"
        @click="handleOk"
        >Submit</a-button
      >
    </template>
  </a-modal>

  <!-- 链接节点对话框 -->
  <a-modal
    v-model:open="linkModalVisible"
    title="Link to ..."
    centered
    @ok="setLinkModalVisible"
  >
  </a-modal>

  <Handle class="custom-vql-handle" type="target" />
  <Handle class="custom-vql-handle" type="source" />
</template>

<style scoped>
.custom-vql-node {
  width: 100px;
  max-height: 200px;
}

.custom-vql-name {
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
  border: solid 1px #aaa;
  border-radius: 50%;
}

.custom-vql-lable {
  list-style: none;
  width: 100px;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.custom-vql-lable-item {
  padding: 0;
  margin: 0;
  width: 100px;
  text-align: center;
  line-height: 20px;
  border: solid 1px #aaa;
  border-radius: 5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  /* 增加一层加深的遮罩背景色 */
  background-color: rgba(0, 0, 0, 0.2);
}

.custom-vql-props {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.custom-vql-props-item {
  padding: 0;
  margin: 0;
  width: 100px;
  display: flex;
  flex-direction: row;
  border: solid 1px #aaa;
  border-radius: 5px;
}

.custom-vql-props-item-key {
  width: 45px;
  text-align: right;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-vql-props-item-value {
  flex: 1;
  text-align: left;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.custom-vql-handle {
  z-index: -1;
  top: 50px;
}

.modal-add-button-container {
  text-align: center;
}

.modal-add-button {
  width: 40%;
  margin: 0px 10px;
}

.modal-label-editor {
  width: 100%;
}

.modal-label-editor-container {
  width: 100%;
}

.modal-label-editor-inputer {
  width: 100%;
}
</style>
