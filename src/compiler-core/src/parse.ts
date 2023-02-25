import { NodeTypes } from "./ast";

enum TagType {
  start,
  end,
}
export function baseParse(content: string) {
  const context = createParserContext(content);
  return createRoot(parseChildren(context,[]));
}

function parseChildren(context,ancestors) {
  const nodes: any[] = [];
  while (!isEnd(context,ancestors)) {
    let node;
    let s = context.source;
    if (s.startsWith("{{")) {
      // 处理插值
      node = parseInterpolation(context);
    } else if (s[0] === "<") {
      // 处理element <div></div>
      if (/[a-z]/i.test(s[1])) {
        node = parseElement(context,ancestors);
      }
    }
    // 处理text
    if (!node) {
      node = parseText(context);
    }
    nodes.push(node);
  }
  return nodes;
}

function isEnd(context,ancestors) { 
  const s = context.source;
  if(s.startsWith('</')){
    for (let i = ancestors.length -1; i >= 0; i--) {
      const tag = ancestors[i].tag;
      if (startsWithEndTagOpen(s,tag)) { 
        return true
      }
    }
  }
// 1. source 有值
  return !s
}

function parseText(context: any): any {
  let endIndex = context.source.length;
  let endTokens = ['<', "{{"];
  for (let i = 0; i < endTokens.length; i++) {
    const index = context.source.indexOf(endTokens[i]);
    if (index !== -1&& endIndex > index) {
      endIndex = index;
    }
  }
  
  // 获取content
  const content = parseTextData(context, endIndex);
  console.log("content -----", content);

  return {
    type: NodeTypes.TEXT,
    content,
  };
}

function parseTextData(context: any, length) {
  const content = context.source.slice(0, length);
  // 推进
  advanceBy(context, length);
  return content;
}

function parseElement(context: any,ancestors) {
  // 处理前一个标签<div>
  const element: any = parseTag(context, TagType.start);
  ancestors.push(element)
  // element内部可能会有嵌套
  element.children = parseChildren(context, ancestors);
  ancestors.pop()
  if (startsWithEndTagOpen(context.source,element.tag)) {
    parseTag(context, TagType.end);
  } else { 
    throw new Error(`缺少结束标签：${element.tag}`)
  }
  
  // 解析出 tag
  // 删除处理完成的代码
  return element;
}

function startsWithEndTagOpen(source,tag) { 
  return source.startsWith('</') && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase()
}

function parseTag(context: any, type) {
  const match = /^<\/?([a-z]*)/i.exec(context.source) as RegExpExecArray;
  const tag = match[1];
  advanceBy(context, match[0].length);
  advanceBy(context, 1);
  if (type === TagType.end) return;
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
  const rawContent = parseTextData(context, rawContentLength);
  const content = rawContent.trim();
  advanceBy(context, closeDelimiter.length);
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
    type: NodeTypes.ROOT,
  };
}
// 创建上下文对象
function createParserContext(content: string): any {
  return {
    source: content,
  };
}
