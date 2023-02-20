import {createRenderer} from '../runtime-core'
function createElement(type) { 
  return document.createElement(type)
}

function patchProp(el, key, prevVal,nextVal) { 
  
  //  on + Event name的形式，比如onClick，onMousemove，onMousedown...
  //     判断是否符合上述模式
      const isOn = (key:any)=>/^on[A-Z]/.test(key)
      if (isOn(key)) {
        const event = key.slice(2).toLowerCase();// onClick->click
        el.addEventListener(event,nextVal)
      } else {
        if (nextVal === undefined || nextVal === null) {
          el.removeAttribute(key)
        } else { 
          el.setAttribute(key, nextVal)
        }
      }
}

function insert(el,container) { 
  container.append(el)
}

const renderer:any = createRenderer({ createElement, patchProp, insert })

export function createApp(...args) { 
  return renderer.createApp(...args)
}

export * from "../runtime-core" // 都打包出去