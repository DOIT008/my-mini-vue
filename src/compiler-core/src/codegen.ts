import { helperMapName, TO_DISPLAY_STRING, CREATE_ELEMENT_VNODE } from './runtimeHelpers';
import { NodeTypes } from './ast';
import { isString } from '@/shared';
export function generate(ast) {
  const context = createCodegenContext()
  const { push } = context;
  genFunctionPreamble(ast,context);
  const functionName = 'render';
  const args = ['_ctx', '_cache'];
  const signature = args.join(", ");
  push(`function ${functionName}(${signature}){`);
  push('return ')
  genNode(ast.codegenNode, context);
  push('}')
  return {
    code:context.code
  }
}

// 前导
function genFunctionPreamble(ast: any, context) {
  let { push } = context;
  const VueBinging = 'Vue';
  // const helps = ['toDiaplayString'];
  const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
  if (ast.helpers.length > 0) {
    push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } ${VueBinging}`);
  }
  push("\n");
  push('return ');
}

function genNode(node: any, context: any) {
  switch (node.type) {
    case NodeTypes.TEXT:
      genText(node, context);
      break;
    case NodeTypes.INTERPOLATION:
      genInterpolation(node, context);
      break;
    case NodeTypes.SIMPLE_EXPRESSION:
      genExpression(node, context)
      break;
    case NodeTypes.ELEMENT:
      genElement(node,context)
      break;
    case NodeTypes.COMPOUND_EXPRESSION:
      genCompoundExpression(node,context)
      break;
    default:
      break;
  }
 
}
// 复合类型
function genCompoundExpression(node: any, context: any) {
  const children = node.children;
  const { push } = context;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isString(child)) {
      push(child)
    } else {
      genNode(child, context)
    }
    
  }
}
// element类型 <div><div>
function genElement(node,context) { 
  const { push, helper } = context;
  const { tag, children,props } = node;
  push(`${helper(CREATE_ELEMENT_VNODE)}(`);
  genNodeList(genNullable([tag, props, children]),context);
  genNode(children, context);
  push(')')
}
// 插值类型
function genInterpolation(node: any, context: any) {
  const {push,helper} = context;
   push(`_${helper(TO_DISPLAY_STRING)}(`);
   genNode(node.content,context)
   push(')')
 }
// text类型---hi
function genText(node, context) {
  const { push } = context;
  push(`"${node.content}"`);
}
function genNodeList(nodes, context) { 
  console.log('------da',nodes);
  const { push } = context;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (isString(node)) {
      push(node)
    } else {
      genNode(node, context)
    }
    if (i < nodes.length - 1) {
      push(', ')
    }
  }
}
function createCodegenContext() {
  const context = {
    code:'',
    push(source) { 
      context.code+=source;
    },
    helper(key) { 
      return `_${helperMapName[key]}`
    }
  }
  return context
}

function genExpression(node: any, context: any) {
  const {push} = context;
  push(`${node.content}`)
}


function genNullable(arg: any[]) {
 return arg.map(item => { 
    return arg||null
  })
}

