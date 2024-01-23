<script setup>
import { ref } from 'vue';
import CodeInputer from './components/CodeInputer.vue';
import Neo4jLinker from './components/Neo4jLinker.vue';
import Result from './components/Result.vue';
import Visualization from './components/Visualization.vue';
</script>

<template>
  <a-layout class="layout">
    <!-- header -->
    <a-layout-header class="layout-header">
      <div class="logo">
        QV-VQL
      </div>
      <div style="flex: 1;"></div>
      <Neo4jLinker />
    </a-layout-header>

    <!-- content -->
    <a-layout-content>
      <div class="content-contianer">
        <!-- left side: code input area -->
        <div class="side-content-contianer">
          <CodeInputer id="code-inputer-container"></CodeInputer>
          <div class="code-result-container">
            <Result></Result>
          </div>
        </div>
        <!-- right side: graph area -->
        <div class="side-content-contianer">
          <Visualization></Visualization>
        </div>
      </div>
    </a-layout-content>

    <!-- footer -->
    <a-layout-footer style="text-align: center">
      QV-VQL ©2024 Created by TJUDB
    </a-layout-footer>
  </a-layout>
</template>

<style scoped>
.layout-header {
  display: flex;
  flex-direction: row;
}

.logo {
  float: left;
  width: 150px;
  height: 47px;
  line-height: 47px;
  font-size: 28px;
  color: #fff;
  margin: 8px 24px 8px 0;
  padding: 0px 10px;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
}

.content-contianer {
  background: #fff;
  padding: 24px;
  height: 100%;
  display: flex;
  flex-direction: row;
}

.side-content-contianer {
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 50%;
  height: 100%;
  padding: 0px 12px;
}

#code-inputer-container {
  height: calc(100% - 300px);
  width: 100%;
}

.code-result-container {
  height: 300px;
  width: 100%;
  margin-top: 24px;
  border: solid 1px #ccc;
  box-shadow: 1px 1px 5px black;
}
</style>
