# Tapflow 宣发帖源文件(只改这一个文件)

> 改完保存后运行 `python3 generator.py`,自动重新生成 v2ex.md / reddit.md / hn.txt。
> 图片替换不用改这里 —— 打开预览页 http://localhost:8092 ,点图片下方缩略图或「换图」按钮,自动保存到 mapping.json。
> 语言规则:中文平台(v2ex)用 zh,英文平台(reddit/hn)用 en。(chiphell 已发过,不再生成)
> 基调:客观介绍,不贬低键盘/竞品;定位是配合键盘鼠标提效,不是替代。

[titles]
v2ex: 分享创造:Tapflow —— 把 iPad 变成你的 Mac 触控面板
reddit: Tapflow — Turn your iPad into a fully custom control panel for your Mac (no iPad app required)

[body]
## text
zh: 键盘是打字的通用工具,大多数情况下它做得很好。但电脑操作里还有大量高频动作——切换窗口、调音频、启动应用——这些用快捷键或鼠标多级菜单并不总是最直观的。
en: Keyboards are excellent general-purpose tools for typing. But plenty of high-frequency actions — switching windows, changing audio output, launching apps — aren't always the most intuitive with shortcuts or multi-level menus.

## img
slot: img-01
alt_zh: 键盘
alt_en: keyboard

## text
zh: 快捷键的数量很容易超出记忆负担。⌘⌥⇧K 是什么?先回忆功能,再回忆键位,再让手指找过去——当快捷键多到一定程度,这个过程就会打断思路。
en: Shortcut count easily outgrows memory. What does ⌘⌥⇧K do? Recall the function, recall the position, hunt with your fingers — once you have enough shortcuts, this process interrupts your flow.

## text
zh: 这张 Mac 快捷键图还不完整,数量已经相当可观。
en: This incomplete Mac shortcuts cheat sheet is already a lot to memorize.

## img
slot: img-02
alt_zh: Mac 快捷键不完全图
alt_en: Mac shortcuts

## text
zh: 相比之下,识别比回忆更快:看见一个写着功能的按钮,比回忆一个组合键快得多。这是 Tapflow 的出发点。
en: Recognition beats recall: seeing a labeled button is faster than remembering a key combination. That's the starting point of Tapflow.

## text
zh: 视觉界面在今天的设备上已经无处不在——手机认脸、Mac 认指纹。把常用操作做成看得见的东西,并不超前。
en: Visual interfaces are everywhere today — phones recognize faces, Macs recognize fingerprints. Making common actions visible is hardly radical.

## text
zh: 如今 AI 时代,Vibe Code 对输入方式提出了新需求,市面上也出现了相应的产品,例如 Worklouder Creator Micro 2:
en: The AI era and vibe coding are changing input needs, and products like the Worklouder Creator Micro 2 have appeared:

## img
slot: img-03
alt_zh: Creator Micro 2
alt_en: Creator Micro 2

## img
slot: img-04
alt_zh: Creator Micro 2
alt_en: Creator Micro 2

## img
slot: img-05
alt_zh: Creator Micro 2
alt_en: Creator Micro 2

## text
zh: 这类产品回应了 Vibe Code 的语音输入需求,但它们仍是实体按键:按键可以自定义,样子和大小却不会变,自定义多了以后,记住每个键的用途依然是个负担。
en: They address voice input for vibe coding, but the physical keys stay fixed: you can remap a key, but it won't change shape or size — and after enough customization, remembering each key's purpose becomes a burden again.

## text
zh: 自定义宏多了以后,忘记每个按键的用途是常见的事。
en: After enough custom macros, forgetting what each key does is common.

## img
slot: img-06
alt_zh: 忘记宏的 Vibe 键盘
alt_en: forgotten macros

## text
zh: 另一类成熟产品是 Elgato Stream Deck:实体按键 + 小屏幕,体验不错,价格从千元级起步。
en: Another established option is the Elgato Stream Deck: physical keys with tiny screens. Works well, priced from three figures.

## img
slot: img-07
alt_zh: Stream Deck
alt_en: Stream Deck XL

## text
zh: 我的做法是从一个小问题入手,做一个轻量的方案,和用户的需求一起成长。于是我做了这个:
en: My approach was to solve one small problem with the lightest possible thing, then grow with real needs. So I made this:

## img
slot: img-08
alt_zh: Tapflow
alt_en: Tapflow

## h2
zh: Tapflow:点流 —— 你的个性化控制层
en: Tapflow — your personal control layer

## text
zh: Tapflow 不是要替代键盘,而是与键盘鼠标配合:把高频操作做成看得见的按钮,减少记忆负担。
en: Tapflow isn't a keyboard replacement — it works alongside keyboard and mouse: common actions become visible buttons, reducing what you have to memorize.

## img
slot: img-09
alt_zh: 面板
alt_en: panel

## img
slot: img-10
alt_zh: 面板
alt_en: panel

## text
zh: 一个可以完全定制的,用于操作电脑的输入界面。有个运行在 MacOS 上的服务端,然后通过网页端连接,仅此而已。提供了一个用于定制的网页编辑器;
en: A fully customizable input surface. **No app to install on the iPad** — a small server runs on your Mac, the iPad connects through the browser, that's it. There's a web-based editor:

## img
slot: img-11
alt_zh: 编辑器
alt_en: editor

## text
zh: 你在编辑器里拖出按钮,每个按钮可以定义名字、颜色、尺寸、位置。改了功能,标签立刻跟着变——看见即用,不用记。
en: Drag out buttons in the editor; each gets its own name, color, size, position. Change a function and the label updates instantly — see it, use it, nothing to memorize.

## h2
zh: 几个使用场景,感受一下
en: Some scenarios

## h3
zh: 🎤 Vibe Coding 语音激活
en: 🎤 Voice activation for vibe coding

## img
slot: img-12
alt_zh: 语音按钮
alt_en: voice button

## text
zh: 你用 Claude Code / Cursor 做 vibe coding,AI 在写代码,你要说下一段 prompt。在 Tapflow 上,一个写着"🎤 说话"的按钮,点一下就开始说,不用在键盘上找语音输入快捷键。
en: You're vibe coding in Claude Code / Cursor and need to dictate the next prompt. On Tapflow there's a button labeled "🎤 Talk". Tap and speak — no hunting for the voice-input shortcut.

## h3
zh: 🕹️ 窗口排列 = 游戏手柄摇杆
en: 🕹️ Window tiling as a gamepad joystick

## img
slot: img-13
alt_zh: Window Swipe
alt_en: Window Swipe

## img
slot: img-20
alt_zh: Window Swipe 动图
alt_en: Window Swipe animation

## text
zh: macOS 的窗口贴靠功能很强——全屏、左半、右半、上半、下半。触发方式通常是快捷键或把窗口拖到屏幕边缘。Tapflow 的 Window Swipe 把它做成了摇杆:手指往上滑窗口全屏,往左滑贴左半,往右下滑贴右下角,点一下最大化,长按全屏。
en: macOS window snapping is powerful, but triggering it usually means shortcuts or dragging to screen edges. Tapflow's Window Swipe turns it into a joystick: swipe up for fullscreen, left for left-half, down-right for bottom corner; tap to maximize, long-press for fullscreen.

## h3
zh: 🖼️ 窗口缩略图,一眼切换
en: 🖼️ Window thumbnails at a glance

## img
slot: img-14
alt_zh: Window Switcher
alt_en: Window Switcher

## text
zh: ⌘Tab 切窗口只能看到 App 图标,看不到窗口内容;开了三个 VS Code 窗口时,得逐个试。Window Switcher 把所有窗口的实时缩略图排出来,按应用分组,横向滑动,窗口内容一目了然,点一下切过去。
en: ⌘Tab shows app icons, not window contents — with three VS Code windows open you have to guess. Window Switcher lays out live thumbnails of every window, grouped by app, swipeable: see exactly what's inside, tap to switch.

## h3
zh: 📱 Dock 上平板,屏幕更干净
en: 📱 Your Dock, on the tablet

## img
slot: img-15
alt_zh: Dock Panel
alt_en: Dock Panel

## text
zh: macOS 的 Dock 常年占着屏幕底下一排,隐藏了又不方便。把 Dock Panel 放到 iPad 上,从平板启动 App、退出 App,Mac 屏幕上的 Dock 可以隐藏起来,屏幕全部留给工作。
en: The macOS Dock eats a row of screen space. Hide it and it's annoying; keep it and it's in the way. Put the Dock Panel on your iPad — launch and quit apps from the tablet, hide the Mac's Dock entirely. Every inch of screen goes to your work.

## h3
zh: 🔊 切音频设备?一眼就够了
en: 🔊 Switch audio devices in one tap

## img
slot: img-16
alt_zh: Audio Out
alt_en: Audio Out

## text
zh: 会议室切 AirPods,工作室切外放,打游戏切耳机。通常的路径是:系统设置 → 声音 → 输出 → 找到设备。Tapflow 的 Audio Out 组件:平板上一键弹出设备列表,选一个;长按直接轮换。
en: AirPods in a meeting, speakers in the studio, headset for gaming. The usual path: System Settings → Sound → Output → find the device. Tapflow's Audio Out widget: one tap pops the device list, long-press cycles.

## h3
zh: ⌨️ 把 iPad 变成一整个键盘
en: ⌨️ The whole iPad as a keyboard

## img
slot: img-17
alt_zh: 全键盘面板
alt_en: full panel

## text
zh: 平板屏幕足够大。在上面铺满按键、触控板、手势区、窗口摇杆——iPad 变成一块按你的习惯定制的输入面板。配合平板物理键盘打字,触控面板处理其他操作。
en: A tablet screen is big enough. Cover it with keys, a trackpad area, gesture zones, the window joystick — your iPad becomes an input panel designed entirely around *your* habits.

## text
zh: 甚至你可以在面板上看 Deepseek 的余额
en: You can even watch your DeepSeek API balance right on the panel:

## img
slot: img-18
alt_zh: 余额显示
alt_en: balance widget

## text
zh: 按钮可以实时变化,就不只是输入指令,还能输出信息。
en: Buttons that update in real time aren't just inputs — they're outputs too.

## h2
zh: 5 分钟上手,然后就可以开始定义你自己的 Tapflow!
en: Try it

## text
zh: 应用目前是只有 macOS 版本:GITHUB: https://github.com/Alienwang1980/tapflow 。国内下载:百度网盘 https://pan.baidu.com/s/1nMrRw4-q3FYKJQfGRo9nAA?pwd=qw3m 提取码: qw3m 。打包文件中含有 2 个我做的预设的 Profile,下载后在编辑器中导入即可试用
en: macOS only for now: https://github.com/Alienwang1980/tapflow — the package ships with 2 preset profiles, import them in the editor and you're up in ~5 minutes.

## text
zh: 上面只是功能的一部分。需要说明的是:我从未打算让它替代键盘——打字这类任务键盘依然是最合适的工具,Tapflow 的定位是与键盘鼠标配合,分担高频操作,提升效率。当然,也有用户告诉我,在特定场景下他们几乎不再碰键盘——这是意外的使用方式,不是设计目标。
en: This is only part of what's built. To be clear: it was never meant to replace the keyboard — for typing, a keyboard is still the right tool. Tapflow is designed to work alongside keyboard and mouse, taking over high-frequency actions. Some users report barely touching their keyboard in certain scenarios — that's an incidental use case, not the design goal.

## img
slot: img-19
alt_zh: 结尾
alt_en: outro

## text
zh: 如果看到这里,非常开心你对这个 Idea 有兴趣,目前我也刚做了第一个版本,目的只是验证这个想法是不是有用,或者说我自己的需求有没有普遍性。然而当然也有很多不完善的地方,欢迎提出你的想法和意见!
en: Feedback, especially the critical kind, is very welcome. *Full disclosure: I'm the developer of Tapflow.*

[hn]
Hi HN,

I made Tapflow: a macOS menu-bar server + a web client that turns an iPad (or any tablet) into a fully customizable touch control panel for your Mac. No app to install on the iPad — it just opens a web page on your LAN.

Why: keyboards are excellent for typing, but a lot of everyday computer control is shortcut-heavy. Enough shortcuts and you're remembering function + position + hunting for keys. I wanted to move some of that load from memory to the screen: buttons you can see, with your own labels, colors, and positions — recognition instead of recall.

How it works:
- A small server runs on the Mac (menu bar app), serving a web editor + panel over HTTP/WebSocket on your LAN.
- The iPad opens the panel in Safari; every touch is injected into macOS via CoreGraphics CGEvent (keyboard/mouse simulation).
- The editor is browser-based: drag buttons, set name/color/size/position, bind actions. Labels update when you change a function.

Widgets I built so far: voice-input button (for vibe coding with Claude Code/Cursor), a window-swipe "joystick" (tiling via gestures), window switcher with live thumbnails, Dock panel (move your Dock to the tablet), audio output switcher, app launcher, key macro pads, a trackpad area, and a live DeepSeek API balance display (buttons can show data, not just send commands).

What it isn't: a keyboard replacement. Tapflow is designed to complement keyboard and mouse — high-frequency actions move to the panel, typing stays on the keyboard. (Functionally it's closer to a Stream Deck's job than a keyboard's; it also costs less than a Stream Deck since it uses hardware you may already own.)

It's macOS-only, built to test whether my own itch is general. 5-minute setup, ships with 2 preset profiles. [VERSION PLACEHOLDER: fill in current release version here — see note below]

Repo: https://github.com/Alienwang1980/tapflow

What would make you (not) use something like this? The floor is yours — especially the critical kind of feedback.
