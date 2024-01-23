<template>
  <div>
    <a-button v-bind="formState" v-show="isLinked" class="link-button" type="default" ghost @click="showModal">
      Current database: {{ formState.database }}
    </a-button>
    <!-- 对话框按钮 -->
    <a-button v-show="!isLinked" class="link-button" type="primary" @click="showModal">Link To Neo4j</a-button>
  </div>
  <!-- 对话框 -->
  <a-modal v-model:open="open" title="Link To Neo4j Database" @ok="handleOk">
    <!-- 自定义对话框按钮 -->
    <template #footer>
      <a-button key="back" @click="handleCancel">Return</a-button>
      <a-button key="submit" type="primary" :loading="loading" @click="handleOk">Submit</a-button>
    </template>
    <!-- 对话框内容-表单 -->
    <a-form :model="formState" name="basic" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }" autocomplete="off"
      @finish="onFinish" @finishFailed="onFinishFailed">
      <!-- URL -->
      <a-form-item label="Connect URL" name="url" :rules="[{ required: true, message: 'Please input neo4j url!' }]">
        <a-tooltip>
          <template #title>Pick neo4j:// for a routed connection (Aura, Cluster), bolt:// for a direct connection to a
            single instance.</template>
          <a-form-item-rest>
            <a-input-group compact>
              <a-select v-model:value="formState.type" style="width: 40%">
                <a-select-option value="neo4j://">neo4j://</a-select-option>
                <a-select-option value="bolt://">bolt://</a-select-option>
              </a-select>
              <a-input v-model:value="formState.url" style="width: 60%" />
            </a-input-group>
          </a-form-item-rest>
        </a-tooltip>
      </a-form-item>
      <!-- Database -->
      <a-form-item label="Database" name="database" :rules="[{ required: true, message: 'Please input your username!' }]">
        <a-input v-model:value="formState.database" />
      </a-form-item>
      <!-- UserName -->
      <a-form-item label="Username" name="username" :rules="[{ required: true, message: 'Please input your username!' }]">
        <a-input v-model:value="formState.username" />
      </a-form-item>
      <!-- Password -->
      <a-form-item label="Password" name="password" :rules="[{ required: true, message: 'Please input your password!' }]">
        <a-input-password v-model:value="formState.password" />
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup>
import { ref, reactive, onMounted, h } from 'vue'
import { useNeo4jStore } from '../stores/neo4j.js'
import { notification } from 'ant-design-vue';


const neo4jStore = useNeo4jStore()
const isLinked = ref(false)

const openNotificationWithIcon = (type, title, description) => {
  notification[type]({
    message: title,
    description: description,
  });
};

const formState = reactive({
  type: '',
  url: '',
  database: '',
  username: '',
  password: '',
});


const initSetting = () => {

  formState.type = neo4jStore.settings.type
  formState.url = neo4jStore.settings.url
  formState.database = neo4jStore.settings.database
  formState.username = neo4jStore.settings.username
  formState.password = neo4jStore.settings.password
}

// 控制对话框显示
const open = ref(false);
const showModal = () => {
  open.value = true;
};
// 控制 loading 状态
const loading = ref(false);

// 确认：修改 neo4j 设置后调用 neo4j-driver 进行测试
const handleOk = async () => {
  // 更新配置
  neo4jStore.updateSetting(formState)
  // loading 中
  loading.value = true;
  // 生命返回值通知变量
  let description;
  try {
    // 尝试连接
    const serverResults = await neo4jStore.testLink()
    // 连接成功：
    neo4jStore.state = true
    isLinked.value = true
    description = h(
      'div',
      null,
      [
        h(
          'div',
          null,
          "Address: " + serverResults.address
        ),
        h(
          'div',
          null,
          "Agent: " + serverResults.agent
        ),
        h(
          'div',
          null,
          "Protocol Version: " + serverResults.protocolVersion
        ),
      ]
    )
    openNotificationWithIcon('success', 'Link to neo4j successfully!', description)
  } catch (err) {
    // 连接失败
    neo4jStore.state = false
    isLinked.value = false
    description = h(
      'div',
      null,
      [
        h(
          'div',
          null,
          "Error: " + err.name
        ),
        h(
          'div',
          null,
          err.message
        ),
      ]
    )
    openNotificationWithIcon('error', 'Link to neo4j failed!', description)
  }
  loading.value = false;
  open.value = false;
};
// 取消，恢复对话框为不可视
const handleCancel = () => {
  open.value = false;
};

// 表单



onMounted(() => {
  initSetting()
})
</script>

<style scoped></style>