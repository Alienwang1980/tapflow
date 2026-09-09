# Sound 编辑模式 — 需求演进与实现记录(2026-09-09)

> P2-8 功能增强:按键声音编辑。同日多轮反馈迭代,最终 commit `d50988e`。
> AI 记忆库另有同名笔记(`memory-bank/tapflow/sound-batch-editor.md`),内容同步。

## 📝 需求演进记录(用户实时口述,逐版推进)

1. P2-8 改为功能增强:左面板 Default Sound 换成入口按钮 → overlay 显示每键声音,可单独/批量改(→ 38471b1 overlay 版)
2. 反馈:不要发明新多选(复用框选);没选中时提示;选中才给声音选项;声音要预览;按键上标注当前声音
3. 反馈:**浮窗从根本上错了**,不要覆盖别的 UI,声音按钮与画布按键重叠即可,不要单独浮窗
4. 反馈细化:状态激活后**每个按键上出现浮层显示其声音,点击可改**;框选多个 → 出现批量更换入口(→ 714543c 就地版)
5. 反馈:点击编辑声音后,**左侧面板替换为子菜单**,列出所有声音、每个有预览;**拖拽**左侧声音到按键上应用;框选多个再拖 = 批量;**Done 按钮**退出(→ a5ff342 拖拽版)
6. 补充确认:**按键上标注的声音状态保留**(badge 纯展示)
7. 最新:fallback 选项不需要了,**每个按钮创建时自带默认声音**;拖拽到按钮上时,**即将被更改的按钮要高亮**(→ d50988e)

## ✅ 终版实现(d50988e,client/editor.html 单文件)

- **模式开关**: 左面板 `Edit Key Sounds…` 入口;`openSoundEdit()` 给 #carea 与 #lp-panel 同时加 `.sound-edit`;左面板整体换为 Key Sounds 子菜单(#sePanel):11 种声音行(色点+名称+▶ 试听)、动态提示、Done 退出;Esc 关闭;切 profile 自动关;keydown 守卫(模式中只放行 Esc/Cmd+S/Cmd+Z)
- **拖拽应用**: 声音行 draggable,dragstart 携带 `__sound__:` 载荷;document drop 处理器前置分支;框选>1 → 画布任意处落点=批量;否则落点命中测试(`_seHitKey`);落空 toast;落点在左面板上直接忽略(防拖回列表误批量应用)
- **无 fallback**: 子菜单无 Fallback 设置;新键在三个创建路径(库组件拖放 addKeyOfType / 键盘布局 _kbNewKey / 剪贴板粘贴)统一写 `sound=(profile.defaultSound)||"click"`,创建时快照,不再运行时回退;旧键 sound 为空仍回退 defaultSound 兼容(按键属性面板的 Inherit 下拉保留)
- **悬停高亮**: dragstart 记 `_seDragSound`(dragover 阶段读不到 dataTransfer 内容,绕行方案);悬停时框选>1 全部选中键加 `.ck.sd-drop`,单选落点键高亮(accent outline+glow);悬停左面板清高亮;drop/dragend/Done 清除
- **badge 纯展示**: 每键底部显示生效声音名,旧 Inherit 键 dim+italic 显示 fallback 名;模式开启时 tooltip 显示详情

## 实测(Playwright)

fallback 行消失/11 项列表无 Inherit/三路径新建键均得默认 "deep"(vibe.json defaultSound)/悬停单键高亮→空区清→批量两键全亮→面板上空悬停清→dragend 清/drop 面板忽略(批量未误改)/drop 键上应用+高亮同步清/undo 恢复/Done 退出恢复左面板/保存落盘服务器核对/reload 后 clean 0 console 错误;真实 vibe.json 未动。

## 坑

- #sePanel 内联 display:none 会覆盖样式表规则 → 面板显示逻辑必须交给样式表(a5ff342 已修)
- ▶ 按钮上起拖要 cancel(防试听误拖成应用);远处选中键在空画布落点只 toast 不误改
- 合成 dragover 测试不带 dataTransfer 会在 `e.dataTransfer.dropEffect=` 抛错(真实拖拽必带,测试须构造 DataTransfer)
- 测试中 querySelector 后再 rr() 重建 DOM → 旧元素引用失活,高亮断言要看重新查询的 count(测试方法坑,非产品 bug)
- code-reviewer 两轮均无 CRITICAL/HIGH;LOW 均已修

## 废弃版本

- 38471b1 overlay 版 — 覆盖别的 UI,废弃
- 714543c 就地版(badge 点击循环 + 浮选批量面板)— 交互方式被拖拽版取代
- a5ff342 拖拽版 — 保留 fallback 与 Inherit,被 d50988e 取代
