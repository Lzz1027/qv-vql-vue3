import antlr4 from "antlr4";
import CypherLexer from "./CypherLexer.js";
import CypherParser from "./CypherParser.js";
import CypherParserListener from "./CypherParserListener.js";

class MyListener extends CypherParserListener {
  // 为你想要监听的每种类型的节点定义一个方法
  // 例如，如果你想要监听 MATCH 子句，你可以定义一个 enterMatchSt 和一个 exitMatchSt 方法
  nodes = [];
  edges = [];

  enterNodePattern(ctx) {    
    // 随机生成一个 'n-' 开头的 16 位 nodeId
    let nodeId = "n-" + Math.random().toString(16).slice(2);
    let nodeSymbol = null;
    let nodeLabels = null;
    let nodeProperties = null;

    // 如果 ctx.chilren 数组中有 SybolContext 对象，那么这个节点就是一个节点的nodeSymbol
    if (
      ctx.children.some((child) => child instanceof CypherParser.SymbolContext)
    ) {
      nodeSymbol = ctx.children
        .find((child) => child instanceof CypherParser.SymbolContext)
        .getText();
    }

    // 如果 ctx.chilren 数组中有 NodeLabelsContext 对象，那么这个节点就是一个节点的nodeLabels
    if (
      ctx.children.some(
        (child) => child instanceof CypherParser.NodeLabelsContext
      )
    ) {
      // 根据 NodeLabelsContext 对象的 getText() 方法，得到的字符串，再根据':'分割，得到的数组, 赋值给 nodeLabels

      nodeLabels = ctx.children
        .find((child) => child instanceof CypherParser.NodeLabelsContext)
        .getText()
        .split(":");

      // 将 nodeLabels 数组中的每个元素的首尾的空格去掉

      nodeLabels = nodeLabels.map((item) => item.trim());
      // 去除 nodeLabels 数组中的空字符串
      nodeLabels = nodeLabels.filter((item) => item !== "");
    }

    // 如果 ctx.chilren 数组中有 PropertiesContext 对象，那么这个节点就是一个节点的nodeProperties

    if (
      ctx.children.some(
        (child) => child instanceof CypherParser.PropertiesContext
      )
    ) {
      nodeProperties = ctx.children
        .find((child) => child instanceof CypherParser.PropertiesContext)
        .getText();

      // 将 nodeProperties 首尾的空格去掉，去掉首尾大括号，按照逗号分割为数组
      nodeProperties = nodeProperties.trim().slice(1, -1).split(",");

      // 根据 nodeProperties 生成一个对象
      // 对于数组中的每个元素，每个元素都是一个字符串，字符串按照冒号分割，前部分作为对象的一个 key，后部分作为这个key的 value，如果是字符串，去掉首尾的单引号和双引号，如果是数字，转换为数字

      nodeProperties = nodeProperties.reduce((acc, cur) => {
        let key = cur.split(":")[0].trim();
        let value = cur.split(":")[1].trim();
        if (value[0] === "'" || value[0] === '"') {
          value = value.slice(1, -1);
        } else {
          value = Number(value);
        }
        acc[key] = value;
        return acc;
      }, {});
      
    }

    let node = {
      nodeId,
      nodeSymbol,
      nodeLabels,
      nodeProperties,
    };

    console.log(node);
    if (!this.nodes.some((item) => item.nodeSymbol === node.nodeSymbol)) {
      this.nodes.push(node);
    }
  }

  enterRelationshipPattern(ctx) {
    // 随机生成一个 'e-' 开头的 16 位 edgeId
    let edgeId = "e-" + Math.random().toString(16).slice(2);
    let relationSourceNode = null;
    let relationEndNode = null;
    let relationshipDetails = null;
    let relationshipType = null;
    let relationshipProperties = null;
    let relationshipDirection = "-";

    // 将 ctx.chilren 数组中的所有 Me 对象的 symbol.text整理到一个数组中，来判断关系的方向
    let relationshipDirectionArray = ctx.children.filter((child) => {
      // 如果 child 有 symbol 属性，那么它就是一个 Me 对象
      if (child.hasOwnProperty("symbol")) {
        // 如果 child.symbol.text 是一个方向，返回这个代表方向的child
        if (child.symbol.text === "<" || child.symbol.text === ">") {
          return child;
        }
      }
    });

    relationshipDirection = relationshipDirectionArray[0].symbol.text;

    // 如果 ctx.chilren 数组中有 RelationDetailContext 对象，那么这个节点就是一个关系的relationshipDetail
    if (
      ctx.children.some(
        (child) => child instanceof CypherParser.RelationDetailContext
      )
    ) {
      relationshipDetails = ctx.children.find(
        (child) => child instanceof CypherParser.RelationDetailContext
      );
    }

    // 从 relationshipDetail 中读取关系的类型和属性
    if (relationshipDetails) {
      // 如果 relationshipDetail 中有 RelationshipTypesContext 对象，那么这个节点就是一个关系的类型
      if (
        relationshipDetails.children.some(
          (child) => child instanceof CypherParser.RelationshipTypesContext
        )
      ) {
        relationshipType = relationshipDetails.children
          .find(
            (child) => child instanceof CypherParser.RelationshipTypesContext
          )
          .getText()
          .split(":");
  
        // 将 relationshipType 数组中的每个元素的首尾的空格去掉
  
        relationshipType = relationshipType.map((item) => item.trim());
        // 去除 relationshipType 数组中的空字符串
        relationshipType = relationshipType.filter((item) => item !== "");
      }

      // 如果 relationshipDetail 中有 PropertiesContext 对象，那么这个节点就是一个关系的属性
      if (
        relationshipDetails.children.some(
          (child) => child instanceof CypherParser.PropertiesContext
        )
      ) {
        relationshipProperties = relationshipDetails.children
          .find((child) => child instanceof CypherParser.PropertiesContext)
          .getText();
      }
    }

    // 从 parentCtx 的 parentCtx 即 （PatternElemContext） 的 children 中，找到当前relation所在的PatternElemChainContext 的 index，从而得到当前 relation 的前一个 对象，从其中得到第一个点

    ctx.parentCtx.parentCtx.children.forEach((child, index) => {
      if (child === ctx.parentCtx) {
        relationSourceNode = ctx.parentCtx.parentCtx.children[index - 1];
      }
    });

    // 从 parentCtx 的 children 中，得到当前 relation 的下一个对象，从其中得到第二个点、7、

    ctx.parentCtx.children.forEach((child, index) => {
      if (child === ctx) {
        relationEndNode = ctx.parentCtx.children[index + 1];
      }
    });

    // 如果方向为 <，则将 relationSourceNode 和 relationEndNode 互换
    if (relationshipDirection === "<") {
      let temp = relationSourceNode;
      relationSourceNode = relationEndNode;
      relationEndNode = temp;
    }

    // 从 relationNode 中，读取节点信息
    relationSourceNode = this.readNodeInfo(relationSourceNode);
    relationEndNode = this.readNodeInfo(relationEndNode);

    let edge = {
      edgeId,
      edgeSource: relationSourceNode,
      edgeTarget: relationEndNode,
      edgeType: relationshipType,
      edgeProps: relationshipProperties,
      edgeDirection: relationshipDirection,
    };

    // 将 edge 添加到 edges 数组中, 如果已存在，不添加
    if (!this.edges.some((item) => item.edgeId === edge.edgeId)) {
      this.edges.push(edge);
    }
  }

  // 根据 relationNode 类型读取节点信息
  readNodeInfo(relationNode) {
    // relationNode 有可能是 NodePatternContext 或者 PatternElementChainContext

    // 先将 relationNode 赋值给 realRelationNode，这是 NodePatternContext 的情况
    let realRelationNode = relationNode;

    // 如果 relationNode.chilren 数组中有 NodePatternContext 对象，那么这个节点就是 PatternElementChainContext, 将 PatternElementChainContext 的 NodePatternContext 更改为当前的 realRelationNode

    if (
      relationNode.children.some(
        (child) => child instanceof CypherParser.NodePatternContext
      )
    ) {
      realRelationNode = relationNode.children.find(
        (child) => child instanceof CypherParser.NodePatternContext
      );
    }

    // 从 realRelationNode 中读取节点信息
    let nodeSymbol = null;
    let nodeLabels = null;
    let nodeProperties = null;

    // 如果 realRelationNode.chilren 数组中有 SybolContext 对象，那么这个节点就是一个节点的nodeSymbol
    if (
      realRelationNode.children.some(
        (child) => child instanceof CypherParser.SymbolContext
      )
    ) {
      nodeSymbol = realRelationNode.children
        .find((child) => child instanceof CypherParser.SymbolContext)
        .getText();
    }

    // 如果 realRelationNode.chilren 数组中有 NodeLabelsContext 对象，那么这个节点就是一个节点的nodeLabels
    if (
      realRelationNode.children.some(
        (child) => child instanceof CypherParser.NodeLabelsContext
      )
    ) {
      nodeLabels = realRelationNode.children
        .find((child) => child instanceof CypherParser.NodeLabelsContext)
        .getText();
    }

    // 如果 realRelationNode.chilren 数组中有 PropertiesContext 对象，那么这个节点就是一个节点的nodeProperties

    if (
      realRelationNode.children.some(
        (child) => child instanceof CypherParser.PropertiesContext
      )
    ) {
      nodeProperties = realRelationNode.children
        .find((child) => child instanceof CypherParser.PropertiesContext)
        .getText();
    }

    let node = {
      nodeSymbol,
      nodeLabels,
      nodeProperties,
    };

    return node;
  }

  // 你可以添加更多的方法来监听其他类型的节点
}

export const genAST = (cypherQuery) => {
  // 生成抽象语法树
  const chars = new antlr4.InputStream(cypherQuery);
  const lexer = new CypherLexer(chars);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new CypherParser(tokens);
  const tree = parser.query();
  return tree;
};

export const genGraph = (tree) => {
  const listener = new MyListener();
  const walker = new antlr4.tree.ParseTreeWalker();
  walker.walk(listener, tree);
  // 返回 Mylistener 中的 nodes 和 edges
  return {
    nodes: listener.nodes,
    edges: listener.edges,
  };
};
