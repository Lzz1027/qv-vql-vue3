<template>
  <div class="result-tips" v-show="!neo4jStore.state">If you want to run queries in a real environment, please connect to the neo4j database
    first. </div>

  <div  class="result-tips" v-show="neo4jStore.state && neo4jStore.result == null">Execute query to get result. </div>


  <div v-show="neo4jStore.state && neo4jStore.result !== null" class="result-table-container">
    <a-table class="result-table" :dataSource="dataSources.dataSource" :columns="columns.column" :pagination="false"
      :style="{ height: '300px' }" :scroll="{ x: '100%', y: 245 }" />
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { useNeo4jStore } from '../stores/neo4j';

const neo4jStore = useNeo4jStore()

const columns = reactive({
  column: []
})
const dataSources = reactive({
  dataSource: []
})

const resultString = (obj) => {
  JSON.stringify(results.result)
}

watch(neo4jStore, () => {
  if (neo4jStore.result) {
    // 添加表头
    columns.column = []
    let tempColumn
    neo4jStore.result.keys.forEach(element => {
      tempColumn = {
        title: element,
        dataIndex: element,
        key: element,
        ellipsis: true,
      }
      columns.column.push(tempColumn)
    });
    // 添加结果
    dataSources.dataSource = []
    let dataKey = 1
    neo4jStore.result.records.forEach(record => {

      let tempRecord = {}
      columns.column.forEach(col => {
        console.log(col.key);
        console.log(record._fieldLookup[col.key]);
        tempRecord[col.key] = record._fields[record._fieldLookup[col.key]].toString()
      })
      tempRecord['key'] = dataKey.toString()
      dataKey++
      dataSources.dataSource.push(tempRecord)



    });
  }
})


</script>

<style scoped>
.result-tips{
  width: 100%;
  height: 100%;
  display: flex;
  font-size: large;
  color: #aaa;
  justify-content: center;
  align-items: center;
}
.result-table-container {
  width: 100%;
  height: 100%;
}

.result-table {
  width: 100%;
  height: 100%;
}
</style>