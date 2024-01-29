<template>
  <div class="code-inputer">
    <!-- 操控按钮 -->
    <div class="code-runner">
      <!-- 编辑按钮 -->
      <!-- 复制 -->
      <a-button style="float: left" type="default" :size="size" @click="copy">
        <template #icon>
          <CopyOutlined />
        </template>
        <span class="button-text">Copy</span>
      </a-button>

      <!-- 剪切 -->

      <a-button
        style="float: left; margin-left: 10px"
        type="default"
        :size="size"
      >
        <template #icon>
          <ScissorOutlined />
        </template>
        <span class="button-text">Cut</span>
      </a-button>
      <!-- 粘贴 -->
      <a-button
        style="float: left; margin-left: 10px"
        type="default"
        :size="size"
      >
        <template #icon>
          <SnippetsOutlined />
        </template>
        <span class="button-text">Paste</span>
      </a-button>
      <!-- 清除 -->
      <a-button
        style="float: left; margin-left: 10px"
        type="default"
        :size="size"
      >
        <template #icon>
          <DeleteOutlined />
        </template>
        <span class="button-text">Clear</span>
      </a-button>

      <!-- 执行查询 -->
      <a-button
        @click="handleQueryExecute"
        style="float: right"
        type="primary"
        :size="size"
      >
        <template #icon>
          <CaretRightOutlined />
        </template>
        <span class="button-text">Execute Code In Neo4j</span>
      </a-button>

      <!-- 生成图 -->
      <a-button
        @click="handleGraphGenerate"
        style="float: right; margin-right: 10px"
        type="primary"
        :size="size"
      >
        <template #icon>
          <RedoOutlined />
        </template>
        <span class="button-text">Generate Graph</span>
      </a-button>
    </div>
    <!-- 代码编辑器 -->
    <div class="code-editor">
      <div id="monacoContainer" style="height: 100%; width: 100%"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, toRaw, watch } from 'vue'
import {
  CopyOutlined,
  ScissorOutlined,
  SnippetsOutlined,
  DeleteOutlined,
  CaretRightOutlined,
  RedoOutlined,
} from '@ant-design/icons-vue'
import * as monaco from 'monaco-editor'
import { useNeo4jStore } from '../stores/neo4j'
import { message } from 'ant-design-vue'
import { genAST, genGraph } from '../antlr4'

const neo4jStore = useNeo4jStore()

const lineCount = ref(0)
const query = ref('')
const editor = ref(null)

watch(neo4jStore, () => {
  query.value = neo4jStore.query
  toRaw(editor.value).setValue(query.value)
})

watch(query, () => {
  handleGraphGenerate()
})

const getCodeContext = () => {
  return toRaw(editor.value).getValue()
}

const paste = () => {
  toRaw(editor.value).getAction('editor.action.clipboardPasteAction').run()
}

const copy = () => {
  toRaw(editor.value).getAction('editor.action.clipboardCopyAction').run()
}

const InitEditor = () => {
  query.value = neo4jStore.query
  editor.value = monaco.editor.create(
    document.getElementById('monacoContainer'),
    {
      value: query.value, // 初始文字
      language: 'cypher', // 语言
      theme: 'vs', // 主题
      fontSize: 20,
      fontFamily: 'console',
      lineNumbers: 'on', // 行号 取值： "on" | "off" | "relative" | "interval" | function
      lineNumbersMinChars: 3, // 行号最小占位   number
      quickSuggestionsDelay: 100, //代码提示延时
      // wordWrap: "on", // 自动换行
      cursorStyle: 'underline', //光标样式
      automaticLayout: true, // 自动布局
      folding: true, // 是否折叠
      foldingHighlight: true, // 折叠等高线
      foldingStrategy: 'indentation', // 折叠方式  auto | indentation
      showFoldingControls: 'always', // 是否一直显示折叠 always | mouseover
      disableLayerHinting: true, // 等宽优化
      emptySelectionClipboard: false, // 空选择剪切板
      selectionClipboard: false, // 选择剪切板
      colorDecorators: true, // 颜色装饰器
      scrollBeyondLastLine: false,
      accessibilitySupport: 'off', // 辅助功能支持  "auto" | "off" | "on"
      readOnly: false, //是否只读
      minimap: {
        enabled: false,
      },
    }
  )
  query.value = getCodeContext()
  editor.value.onDidChangeModelContent((e) => {
    query.value = getCodeContext()
    lineCount.value = editor.value.getModel().getLineCount()
  })
}

// 执行查询
const handleQueryExecute = async () => {
  let result
  if (neo4jStore.state) {
    // 修改为双引号
    let realQuery = query.value.replaceAll("'", '"')
    try {
      neo4jStore.ast = genAST(realQuery)
      result = await neo4jStore.executeQuery()
      console.log(result)
      neo4jStore.result = result
    } catch (err) {
      console.log(err)
    }
  } else {
    message.error('Please link to database first!')
  }
  console.log('execute query')
}

// 生成图
const handleGraphGenerate = async () => {
  let result
  // 修改为双引号
  neo4jStore.query = query.value
  let realQuery = query.value.replaceAll("'", '"')
  try {
    // 通过 antlr4 得到 cypher 查询的抽象语法树
    neo4jStore.ast = genAST(realQuery)
    neo4jStore.vqlGraph = genGraph(neo4jStore.ast)
  } catch (err) {
    console.log(err)
  }
}

onMounted(() => {
  InitEditor()
})
</script>

<style scoped>
.code-inputer {
  width: 100%;
  height: 100%;
}

.code-runner {
  width: 100%;
  height: 40px;
}

.code-editor {
  height: calc(100% - 40px);
}

#monacoContainer {
  box-shadow: 1px 1px 5px black;
}

@media (max-width: 1600px) {
  .button-text {
    display: none;
  }
}
</style>
