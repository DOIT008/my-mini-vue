// 位运算，识别当前虚拟节点的类型，element?component?还是其他？
// 0000
// 0001: element
// 0010: statefulComponent
// 0100: text_children
// 1000: arr_children

  // 位运算
  // “|”：两位都为0，才是0
  // “&”：两位都为1，才是1

// 查找 &
// 0001
// 0010
// -----
// 0000

// 修改 |
// 0001
// 0010
// -----
// 0011
export const enum ShapeFlags { 
  ELEMENT = 1,// 0001
  STATEFUL_COMPONENT = 1 << 1, // 0010
  TEXT_CHILDREN = 1 << 2,// 0100
  ARRAY_CHILDREN = 1 << 3,// 1000
} 

