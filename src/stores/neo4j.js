/**
 * 存储 neo4j 数据库状态
 * 提供 neo4j 查询的 api
 */
import { defineStore } from "pinia";
import * as neo4j from "neo4j-driver";

export const useNeo4jStore = defineStore("neo4jLinker", {
  state: () => {
    return {
      state: false,
      settings: {
        type: "neo4j://",
        url: "localhost:7687",
        database: "neo4j",
        username: "neo4j",
        password: "lizhaozhuo1027",
      },
      driver: null,
      query: `MATCH (keanu:Person:Human {name:'Keanu Reeves', age:16})-[:ACTED_IN]->(movie1:Movie)<-[:ACTED_IN]-(coActors:Person),\n \t(coActors:Person)-[:ACTED_IN]->(movie2:Movie)<-[:ACTED_IN]-(cocoActors:Person)\nWHERE NOT (keanu)-[:ACTED_IN]->(movieX)<-[:ACTED_IN]-(cocoActors) AND keanu <> cocoActors\nRETURN cocoActors.name AS recommended, count(cocoActors) AS strength\nORDER BY strength DESC\nLIMIT 7`,
      ast: {},
      vqlGraph: null,
      result: null,
    };
  },
  actions: {
    updateSetting(newSettings) {
      this.settings = newSettings;
    },
    updateQuery(newQuery) {
      if (newQuery !== this.query) {
        this.query = newQuery;
      }
    },

    async testLink() {
      this.driver = neo4j.driver(
        this.settings.type + this.settings.url,
        neo4j.auth.basic(this.settings.username, this.settings.password)
      );

      const serverInfo = await this.driver.getServerInfo({
        database: this.settings.database,
      });
      return serverInfo;
    },

    async executeQuery() {
      let result = await this.driver.executeQuery(this.query);

      return result
    },
  },
  persist: {
    enabled: true,
    storage: sessionStorage,
    paths:['settings', 'query']

  },
});
