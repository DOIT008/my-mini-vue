import { createRenderer } from "../../lib/my-mini-vue.esm.js"
import { App } from "./App.js"
console.log(PIXI);
// 创建game实例
const game = new PIXI.Application({
  width: 800,
  height: 800,
})
// 将canvas添加到页面上
document.body.appendChild(game.view)

const renderer = createRenderer({
  createElement(type) { 
    if (type === 'reac') { 
      const reac = new PIXI.Graphics();
      reac.beginFill(0xff0000);
      reac.drawRect(0, 0, 300, 300);
      reac.endFill();
      return reac
    }
  },
  patchProp(el, key, val) { 
    el[key] = val
  },
  insert(el,parent) { 
    parent.addChild(el)
  }
})

renderer.createApp(App).mount(game.stage)
// const rootContainer = document.querySelector('#app')
// createApp(App).mount(rootContainer)
