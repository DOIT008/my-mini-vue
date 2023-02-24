import { NodeTypes } from "./ast";

enum TagType {
  start,
  end
} 
export function baseParse(content: string) {
  const context = createParserContext(content);
  return createRoot(parserChildren(context));
}

function parserChildren(context) {
  const nodes: any[] = [];
  let node;
  let s = context.source;
  if (s.startsWith("{{")) {
    node = parseInterpolation(context);
  } else if (s[0] === "<") {
    // 处理element <div></div>
    if (/[a-z]/i.test(s[1])) {
     node = parseElement(context);
    }
  }
  nodes.push(node);
  return nodes;
}

function parseElement(context: any) {
  // 处理前一个标签<div>
  const element = parseTag(context, TagType.start);
  // 处理后一个标签 </div>
  parseTag(context,TagType.end);
  // 解析出 tag
  // 删除处理完成的代码
  return element
}

function parseTag(context: any,type) {
  const match = /^<\/?([a-z]*)/i.exec(context.source) as RegExpExecArray;
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceBy(context, 1);
  if(type===TagType.end) return
  return {
    type: NodeTypes.ELEMENT,
    tag: tag,
  };
}

function parseInterpolation(context) {
  const openDelimiter = "{{";
  const closeDelimiter = "}}";
  // 获取右侧}}索引值
  const closeIndex = context.source.indexOf(
    closeDelimiter,
    openDelimiter.length
  );

  advanceBy(context, openDelimiter.length);
  const rawContentLength = closeIndex - openDelimiter.length;
  const rawContent = context.source.slice(0, rawContentLength);
  const content = rawContent.trim();
  advanceBy(context, rawContentLength + closeDelimiter.length);
  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content: content,
    },
  };
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length);
}

function createRoot(children) {
  return {
    children,
  };
}
// 创建上下文对象
function createParserContext(content: string): any {
  return {
    source: content,
  };
}
