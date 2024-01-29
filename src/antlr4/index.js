import antlr4 from 'antlr4'
import CypherLexer from './CypherLexer.js'
import CypherParser from './CypherParser.js'
import CypherParserListener from './CypherParserListener.js'

// 第一次遍历，监听所有的有 Symbol 节点，将节点信息存储到 nodes 数组中
class nodeEdgeListener extends CypherParserListener {
  nodes = []
  edges = []

  enterNodePattern(ctx) {
    // 随机生成一个 'n-' 开头的 16 位 nodeId
    let nodeId = 'n-' + Math.random().toString(16).slice(2)
    let nodeSymbol = null
    let nodeLabels = null
    let nodeProperties = null

    // 如果 ctx.chilren 数组中有 SybolContext 对象，那么这个节点就是一个节点的nodeSymbol
    if (
      ctx.children.some((child) => child instanceof CypherParser.SymbolContext)
    ) {
      nodeSymbol = ctx.children
        .find((child) => child instanceof CypherParser.SymbolContext)
        .getText()

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
          .split(':')

        // 将 nodeLabels 数组中的每个元素的首尾的空格去掉

        nodeLabels = nodeLabels.map((item) => item.trim())
        // 去除 nodeLabels 数组中的空字符串
        nodeLabels = nodeLabels.filter((item) => item !== '')
      }

      // 如果 ctx.chilren 数组中有 PropertiesContext 对象，那么这个节点就是一个节点的nodeProperties

      if (
        ctx.children.some(
          (child) => child instanceof CypherParser.PropertiesContext
        )
      ) {
        nodeProperties = ctx.children
          .find((child) => child instanceof CypherParser.PropertiesContext)
          .getText()

        // 将 nodeProperties 首尾的空格去掉，去掉首尾大括号，按照逗号分割为数组
        nodeProperties = nodeProperties.trim().slice(1, -1).split(',')

        // 根据 nodeProperties 生成一个对象
        // 对于数组中的每个元素，每个元素都是一个字符串，字符串按照冒号分割，前部分作为对象的一个 key，后部分作为这个key的 value，如果是字符串，去掉首尾的单引号和双引号，如果是数字，转换为数字

        nodeProperties = nodeProperties.reduce((acc, cur) => {
          let key = cur.split(':')[0].trim()
          let value = cur.split(':')[1].trim()
          if (value[0] === "'" || value[0] === '"') {
            value = value.slice(1, -1)
          } else {
            value = Number(value)
          }
          acc[key] = value
          return acc
        }, {})
      }

      let node = {
        nodeId,
        nodeSymbol,
        nodeLabels,
        nodeProperties,
      }

      if (!this.nodes.some((item) => item.nodeSymbol === node.nodeSymbol)) {
        this.nodes.push(node)
      }
    } else {
      // 如果 ctx.chilren 数组中没有 SybolContext 对象，那么就不是一个有效的节点
    }
  }

  enterRelationshipPattern(ctx) {
    // 随机生成一个 'e-' 开头的 16 位 edgeId
    let edgeId = 'e-' + Math.random().toString(16).slice(2)
    let relationSourceNode = null
    let relationEndNode = null
    let relationshipDetails = null
    let relationshipSymbol = null
    let relationshipType = null
    let relationshipProperties = null
    let relationshipDirection = '-'

    // 将 ctx.chilren 数组中的所有 Me 对象的 symbol.text整理到一个数组中，来判断关系的方向
    let relationshipDirectionArray = ctx.children.filter((child) => {
      // 如果 child 有 symbol 属性，那么它就是一个 Me 对象
      if (child.hasOwnProperty('symbol')) {
        // 如果 child.symbol.text 是一个方向，返回这个代表方向的child
        if (child.symbol.text === '<' || child.symbol.text === '>') {
          return child
        }
      }
    })

    relationshipDirection = relationshipDirectionArray[0].symbol.text

    // 如果 ctx.chilren 数组中有 RelationDetailContext 对象，那么这个节点就是一个关系的relationshipDetail
    if (
      ctx.children.some(
        (child) => child instanceof CypherParser.RelationDetailContext
      )
    ) {
      relationshipDetails = ctx.children.find(
        (child) => child instanceof CypherParser.RelationDetailContext
      )
    }

    // 从 relationshipDetail 中读取关系的类型和属性
    if (relationshipDetails) {
      // 如果 relationshipDetail 中有 SymbolContext 对象，那么这个节点就是一个关系的symbol
      if (
        relationshipDetails.children.some(
          (child) => child instanceof CypherParser.SymbolContext
        )
      ) {
        relationshipSymbol = relationshipDetails.children
          .find((child) => child instanceof CypherParser.SymbolContext)
          .getText()
      } else {
        // 如果没有 SymbolContext 对象，那么这个节点就是一个关系的类型
        relationshipSymbol = 'anonymous'
      }


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
          .split(':')

        // 将 relationshipType 数组中的每个元素的首尾的空格去掉

        relationshipType = relationshipType.map((item) => item.trim())
        // 去除 relationshipType 数组中的空字符串
        relationshipType = relationshipType.filter((item) => item !== '')
      }

      // 如果 relationshipDetail 中有 PropertiesContext 对象，那么这个节点就是一个关系的属性
      if (
        relationshipDetails.children.some(
          (child) => child instanceof CypherParser.PropertiesContext
        )
      ) {
        relationshipProperties = relationshipDetails.children
          .find((child) => child instanceof CypherParser.PropertiesContext)
          .getText()
      }
    }

    // 从 parentCtx 的 parentCtx 即 （PatternElemContext） 的 children 中，找到当前relation所在的PatternElemChainContext 的 index，从而得到当前 relation 的前一个 对象，从其中得到第一个点

    ctx.parentCtx.parentCtx.children.forEach((child, index) => {
      if (child === ctx.parentCtx) {
        relationSourceNode = ctx.parentCtx.parentCtx.children[index - 1]
      }
    })

    // 从 parentCtx 的 children 中，得到当前 relation 的下一个对象，从其中得到第二个点、7、

    ctx.parentCtx.children.forEach((child, index) => {
      if (child === ctx) {
        relationEndNode = ctx.parentCtx.children[index + 1]
      }
    })

    // 如果方向为 <，则将 relationSourceNode 和 relationEndNode 互换
    if (relationshipDirection === '<') {
      let temp = relationSourceNode
      relationSourceNode = relationEndNode
      relationEndNode = temp
    }

    // 从 relationNode 中，读取节点信息
    relationSourceNode = this.readNodeInfo(relationSourceNode)
    relationEndNode = this.readNodeInfo(relationEndNode)

    // 如果 relationSourceNode 是一个匿名节点，那么将这个匿名节点放入 nodes 数组中, 使用anonymousParentCtx 作为匿名节点的唯一标识，如果已存在，不添加，并读取匿名节点的 nodeId，赋值给 relationSourceNode

    if (relationSourceNode.nodeSymbol === 'anonymous') {
      if (
        !this.nodes.some(
          (item) =>
            item.anonymousParentCtx === relationSourceNode.anonymousParentCtx
        )
      ) {
        // 给 这个匿名节点添加一个 nodeId
        relationSourceNode.nodeId = 'n-' + Math.random().toString(16).slice(2)
        this.nodes.push(relationSourceNode)
        relationSourceNode = relationSourceNode.nodeId
      } else {
        relationSourceNode = this.nodes.find(
          (item) =>
            item.anonymousParentCtx === relationSourceNode.anonymousParentCtx
        ).nodeId
      }
    }

    // 如果 relationEndNode 是一个匿名节点，那么将这个匿名节点放入 nodes 数组中, 使用anonymousParentCtx 作为匿名节点的唯一标识，如果已存在，不添加，并读取匿名节点的 nodeId，赋值给 relationEndNode

    if (relationEndNode.nodeSymbol === 'anonymous') {
      if (
        !this.nodes.some(
          (item) =>
            item.anonymousParentCtx === relationEndNode.anonymousParentCtx
        )
      ) {
        // 给 这个匿名节点添加一个 nodeId
        relationEndNode.nodeId = 'n-' + Math.random().toString(16).slice(2)
        this.nodes.push(relationEndNode)
        relationEndNode = relationEndNode.nodeId
      } else {
        relationEndNode = this.nodes.find(
          (item) =>
            item.anonymousParentCtx === relationEndNode.anonymousParentCtx
        ).nodeId
      }
    }

    let edge = {
      edgeId,
      edgeSource: relationSourceNode,
      edgeTarget: relationEndNode,
      edgeSymbol: relationshipSymbol,
      edgeType: relationshipType,
      edgeProps: relationshipProperties,
      edgeDirection: relationshipDirection,
    }

    // 将 edge 添加到 edges 数组中, 如果已存在，不添加
    if (!this.edges.some((item) => item === edge)) {
      this.edges.push(edge)
    }
  }

  // 根据 relationNode 类型读取节点信息
  readNodeInfo(relationNode) {
    // relationNode 有可能是 NodePatternContext 或者 PatternElementChainContext

    // 先将 relationNode 赋值给 realRelationNode，这是 NodePatternContext 的情况
    let realRelationNode = relationNode

    // 如果 relationNode.chilren 数组中有 NodePatternContext 对象，那么这个节点就是 PatternElementChainContext, 将 PatternElementChainContext 的 NodePatternContext 更改为当前的 realRelationNode

    if (
      relationNode.children.some(
        (child) => child instanceof CypherParser.NodePatternContext
      )
    ) {
      realRelationNode = relationNode.children.find(
        (child) => child instanceof CypherParser.NodePatternContext
      )
    }

    // 从 realRelationNode 中读取节点信息
    let nodeSymbol = null
    let nodeLabels = null
    let nodeProperties = null

    // 如果 realRelationNode.chilren 数组中有 SybolContext 对象，那么这个节点就是一个节点的nodeSymbol, 且该 symbol 一定在 nodes 数组中出现过，只需要保存 symbol 即可
    if (
      realRelationNode.children.some(
        (child) => child instanceof CypherParser.SymbolContext
      )
    ) {
      nodeSymbol = realRelationNode.children
        .find((child) => child instanceof CypherParser.SymbolContext)
        .getText()

      return { nodeSymbol: nodeSymbol }
    } else {
      // 没有 symbol 的情况，即该节点是一个匿名节点，需要保存该节点的所有信息
      // 匿名的英文为 anonymous
      nodeSymbol = 'anonymous'
      // 保存匿名节点 的 parentCtx 的 parentCtx
      let anonymousParentCtx = realRelationNode.parentCtx.parentCtx

      // 如果 realRelationNode.chilren 数组中有 NodeLabelsContext 对象，那么这个节点就是一个节点的nodeLabels
      if (
        realRelationNode.children.some(
          (child) => child instanceof CypherParser.NodeLabelsContext
        )
      ) {
        nodeLabels = realRelationNode.children
          .find((child) => child instanceof CypherParser.NodeLabelsContext)
          .getText()
      }

      // 如果 realRelationNode.chilren 数组中有 PropertiesContext 对象，那么这个节点就是一个节点的nodeProperties

      if (
        realRelationNode.children.some(
          (child) => child instanceof CypherParser.PropertiesContext
        )
      ) {
        nodeProperties = realRelationNode.children
          .find((child) => child instanceof CypherParser.PropertiesContext)
          .getText()
      }

      let node = {
        anonymousParentCtx,
        nodeSymbol,
        nodeLabels,
        nodeProperties,
      }

      return node
    }
  }
}

class MyListener extends CypherParserListener {
  // 为你想要监听的每种类型的节点定义一个方法
  // 例如，如果你想要监听 MATCH 子句，你可以定义一个 enterMatchSt 和一个 exitMatchSt 方法

  st = {
    where: [],
    pattern: [],
    return: [],
  }

  enterWhere(ctx) {
    this.st.where.push(ctx)
  }

  // 进入 PatternContext 节点时，将 PatternContext 节点存储到 st.pattern 数组中
  enterPattern(ctx) {
    this.st.pattern.push(ctx)
  }

  enterReturnSt(ctx) {
    this.st.return.push(ctx)
  }
}

class NotListener extends CypherParserListener {
  notExpression = []
  otherExpression = []
  enterComparisonExpression(ctx) {
    // 如果 ctx 的 parentCtx 是一个 NotExpressionContext 对象，且children的第一个 child有 symbol属性，且 symbol.text 是 NOT，那么这个 ctx 就是一个 notExpression, 将这个 ctx 存储到 notExpression 数组中, 否则，将这个 ctx 存储到 otherExpression 数组中
    if (
      ctx.parentCtx instanceof CypherParser.NotExpressionContext &&
      ctx.parentCtx.children[0].hasOwnProperty('symbol') &&
      ctx.parentCtx.children[0].symbol.text === 'NOT'
    ) {
      this.notExpression.push(ctx.parentCtx)
    } else {
      this.otherExpression.push(ctx.parentCtx)
    }
  }
}

class ExpressionListener extends CypherParserListener {
  ex1 = null
  sign = null
  ex2 = null

  enterComparisonExpression(ctx) {
    // 如果 ctx.children 长度为三
    if (ctx.children.length === 3) {
      // 如果 ctx.children[0] 是一个 ExpressionContext 对象，那么这个 ctx 就是一个 ex1
      if (ctx.children[0] instanceof CypherParser.AddSubExpressionContext) {
        this.ex1 = ctx.children[0].getText()
      }

      // 如果 ctx.children[1] 是一个 SymbolContext 对象，那么这个 ctx 就是一个 sign
      if (ctx.children[1] instanceof CypherParser.ComparisonSignsContext) {
        this.sign = ctx.children[1].getText()
      }

      // 如果 ctx.children[2] 是一个 ExpressionContext 对象，那么这个 ctx 就是一个 ex2
      if (ctx.children[2] instanceof CypherParser.AddSubExpressionContext) {
        this.ex2 = ctx.children[2].getText()
      }
    }
  }
}

class ReturnListener extends CypherParserListener {
  returnSymbol = []
  enterSymbol(ctx) {
    // 去除重复的 symbol，push到 returnSymbol 数组中
    if (!this.returnSymbol.includes(ctx.getText())) {
      this.returnSymbol.push(ctx.getText())
    }
  }
}

export const genAST = (cypherQuery) => {
  // 生成抽象语法树
  const chars = new antlr4.InputStream(cypherQuery)
  const lexer = new CypherLexer(chars)
  const tokens = new antlr4.CommonTokenStream(lexer)
  const parser = new CypherParser(tokens)
  const tree = parser.query()
  return tree
}

const getNodeEdge = (tree) => {
  const listener = new nodeEdgeListener()
  const walker = new antlr4.tree.ParseTreeWalker()
  walker.walk(listener, tree)
  return { nodes: listener.nodes, edges: listener.edges }
}

const getSt = (tree) => {
  const listener = new MyListener()
  const walker = new antlr4.tree.ParseTreeWalker()
  walker.walk(listener, tree)
  return listener.st
}

const distinguishExpression = (tree) => {
  const listener = new NotListener()
  const walker = new antlr4.tree.ParseTreeWalker()
  walker.walk(listener, tree)
  return listener
}

const getExpression = (tree) => {
  const listener = new ExpressionListener()
  const walker = new antlr4.tree.ParseTreeWalker()
  walker.walk(listener, tree)
  return listener
}

const getResult = (tree) => {
  const listener = new ReturnListener()
  const walker = new antlr4.tree.ParseTreeWalker()
  walker.walk(listener, tree)
  return listener
}

export const genGraph = (tree) => {
  const st = getSt(tree)

  let commonNodes = []
  let commonEdges = []
  let notNodes = []
  let notEdges = []
  let expressions = []
  let resultInfo = []

  st.pattern.forEach((patternSt) => {
    let { nodes, edges } = getNodeEdge(patternSt)
    // 将 nodes 和 edges 添加到 commonNodes 和 commonEdges 中，去除重复的节点和边
    commonNodes = [...commonNodes, ...nodes]
    commonEdges = [...commonEdges, ...edges]
  })

  st.where.forEach((whereSt) => {
    // 从 whereSt 中 读取 notExpression
    let { notExpression, otherExpression } = distinguishExpression(whereSt)

    notExpression.forEach((notSt) => {

      let { nodes, edges } = getNodeEdge(notSt)

      notNodes = [...notNodes, ...nodes]
      notEdges = [...notEdges, ...edges]
    })

    otherExpression.forEach((otherSt) => {
      let { nodes, edges } = getNodeEdge(otherSt)

      commonNodes = [...commonNodes, ...nodes]
      commonEdges = [...commonEdges, ...edges]

      let { ex1, sign, ex2 } = getExpression(otherSt)
      expressions.push({ ex1, sign, ex2 })
    })
  })

  st.return.forEach((returnSt) => {
    let {returnSymbol} = getResult(returnSt)
    
    // 将 returnSymbol 中的每个 Symbol push 到 resultInfo 中，去除重复的 Symbol
    returnSymbol.forEach((symbol) => {
      if (!resultInfo.includes(symbol)) {
        resultInfo.push(symbol)
      }
    }) 
  })

  let result = {
    commonEdges,
    commonNodes,
    notEdges,
    notNodes,
    expressions,
    resultInfo,
  }


  // 返回 Mylistener 中的 nodes 和 edges
  return result
}
