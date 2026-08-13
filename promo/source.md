# Tapflow 宣发帖源文件(只改这一个文件)

> 改完保存后运行 `python3 generator.py`,自动重新生成 v2ex.md / chiphell.txt / reddit.md / hn.txt。
> 图片替换不用改这里 —— 打开预览页 http://localhost:8092 ,在图片旁的下拉框换图,自动保存到 mapping.json。
> 语言规则:中文平台(v2ex/chiphell)用 zh,英文平台(reddit/hn)用 en。

[titles]
v2ex: 分享创造:Tapflow —— 把 iPad 变成你的 Mac 触控面板
chiphell: Tapflow:把 iPad 变成你的 Mac 触控面板(新版更新)
reddit: Tapflow — Turn your iPad into a fully custom control panel for your Mac (no iPad app required)

[body]
## text
zh: 键盘是一个"通用工具"——它被设计来让任何人能打字,而不是让你高效地操控你的电脑。
en: A keyboard is a "universal tool" — designed so that *anyone* can type, not so that *you* can control your computer efficiently.

## img
slot: img-01
alt_zh: 键盘
alt_en: keyboard

## text
zh: 100 多个键,每一个长得差不多。快捷键全靠脑子记。⌘⌥⇧K 是什么?你得先回忆它的功能,再回忆它的键位,再让手指找过去。你的大脑——这台地球上最强大的生物计算机——在被当成快捷键备忘录用。
en: 100+ keys, and they all look the same. Shortcuts live in your head: what does ⌘⌥⇧K do again? You have to recall the function, recall the key position, then hunt for it with your fingers. Your brain — the most powerful biocomputer on Earth — is being used as a shortcut memo pad.

## text
zh: Mac 快捷键不完全图:背的下来么?
en: Mac shortcuts cheat sheet — can you memorize all this?

## img
slot: img-02
alt_zh: Mac 快捷键不完全图
alt_en: Mac shortcuts

## text
zh: 识别、记忆、回忆。这不是思考,这是浪费。
en: Recognize, memorize, recall. That's not thinking — that's waste.

## text
zh: 都 2026 年了。你的手机认得你的脸。你的 Mac 认得你的指纹。但你控制电脑的方式,还停留在背键位。
en: It's 2026. Your phone recognizes your face. Your Mac recognizes your fingerprint. But the way you control your computer is still... memorizing key positions.

## text
zh: 然而情况也变了。如今 AI 时代,Vibe Code 更是对键盘的需求进一步降低,市面上也有很多为此而生的键盘变体产品,例如:Worklouder: Creator Micro 2
en: The landscape has shifted though. AI-era vibe coding demands less from keyboards, and products like the Worklouder Creator Micro 2 have appeared:

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
zh: 可以看出,这些都在试图满足今天 Vibe Code 对语音而不是键盘需求的改变,但是其并未改变实体按键这个「不可变」的痛点。当然:实体按键可以自定义,但是按键不会改变样子,大小不会变,不直观又不灵活,分分钟忘记定义的宏,这样的产品更像是在"补救"而不是改变!
en: They address the voice-input side of vibe coding, but the physical keys remain "immutable": you can remap a key, but it won't change shape or size. Not visual, not flexible — you'll forget your macros in days.

## text
zh: 设置了个 Vibe 键盘,没多久就想不起来设置的按键是什么
en: Set up a vibe keyboard and you'll forget what each key does within days.

## img
slot: img-06
alt_zh: 忘记宏的 Vibe 键盘
alt_en: forgotten macros

## text
zh: 这时候就一定会说了:不是有这个神器吗?那么不得不提 StreamDeck,同时也不能无视这东西的价格
en: Then someone will say: "What about a Stream Deck?" Fair — and then look at the price tag.

## img
slot: img-07
alt_zh: Stream Deck
alt_en: Stream Deck XL

## text
zh: 我想能做出改变的,不是花大力气憋出完美的产品,而是从细微入手解决一个小问题,用最轻的方式送到用户手中,然后再和需求一起成长,于是我做了这个:
en: I don't think the answer is another perfect product polished in a lab. It's solving one small problem with the lightest possible thing, getting it into users' hands, and growing with real needs. So I made this:

## img
slot: img-08
alt_zh: Tapflow
alt_en: Tapflow

## h2
zh: Tapflow:点流 —— 你的个性化控制层
en: Tapflow — your personal control layer

## text
zh: Tapflow 的思路不是做一个"更好的键盘"。是让你不用脑子记快捷键,而且你现在就能开始用。
en: Tapflow isn't a "better keyboard." It's: *stop memorizing shortcuts, and start using it today.*

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
zh: 你在编辑器里拖几个按钮出来。每个按钮可以定义自己的名字、颜色、尺寸、位置。按你的需要,你不需要回忆它是什么——你一眼就看到了。改了功能?标签立刻跟着变。你的大脑只负责"识别",不用负责"记忆"。
en: Drag a few buttons out. Each one gets its own name, color, size, position. Change a function, the label changes instantly. Your brain only has to *recognize* — never *memorize*.

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
zh: 你在用 Claude Code / Cursor 做 vibe coding。AI 在写代码,你要说下一段 prompt。键盘上:找到语音输入快捷键(是哪个来着?)Tapflow 上:有一个按钮,上面写着"🎤 说话"。点一下,开始说。不是"少按了几个键"的问题。是你不用打断思路去想那个快捷键是什么的问题。
en: You're in Claude Code / Cursor, AI is writing, you need to dictate the next prompt. On a keyboard: which key was voice input again? On Tapflow: there's a button that literally says "🎤 Talk". Tap it, start speaking. It's not about pressing fewer keys — it's about never breaking your train of thought.

## h3
zh: 🕹️ 窗口排列 = 游戏手柄摇杆
en: 🕹️ Window tiling as a gamepad joystick

## img
slot: img-13
alt_zh: Window Swipe
alt_en: Window Swipe

## text
zh: macOS 的窗口贴靠功能很强——全屏、左半、右半、上半、下半。但触发方式呢?要么背快捷键,要么用鼠标拖到屏幕边缘。Tapflow 的 Window Swipe 组件把它做成了一个摇杆。手指在平板上往上滑 → 窗口全屏。往左滑 → 贴左半。往右下滑 → 右下角。就跟打游戏一样。点一下最大化,长按全屏。排列窗口这件事,根本就不应该用快捷键。
en: macOS window snapping is powerful — but triggering it means memorizing shortcuts or dragging to screen edges. Tapflow's Window Swipe turns it into a joystick: swipe up for fullscreen, left for left-half, down-right for bottom-right corner. It feels like a game. Arranging windows shouldn't involve shortcuts at all.

## h3
zh: 🖼️ 窗口缩略图,一眼切换
en: 🖼️ Window thumbnails at a glance

## img
slot: img-14
alt_zh: Window Switcher
alt_en: Window Switcher

## text
zh: ⌘Tab 切窗口是盲猜——你只能看到 App 图标,看不到窗口内容。开了三个 VS Code 窗口?猜吧,看哪个是你想要的。Window Switcher 把所有窗口的实时缩略图排出来。按应用分组,横向滑动。哪个窗口里有什么,看得一清二楚。点一下,切过去。
en: ⌘Tab is blind guessing — you see app icons, not window contents. Three VS Code windows open? Good luck. Window Switcher lays out live thumbnails of every window, grouped by app, swipeable. You see exactly what's inside, tap to switch.

## h3
zh: 📱 Dock 上平板,屏幕更干净
en: 📱 Your Dock, on the tablet

## img
slot: img-15
alt_zh: Dock Panel
alt_en: Dock Panel

## text
zh: macOS 的 Dock 长年占着屏幕底下一排。隐藏了又不方便。把 Dock Panel 放到 iPad 上。从平板启动 App、退出 App。Mac 屏幕上的 Dock 直接隐藏——每一寸屏幕都留给你的工作。
en: The macOS Dock eats a row of screen space. Hide it and it's annoying; keep it and it's in the way. Put the Dock Panel on your iPad — launch and quit apps from the tablet, hide the Mac's Dock entirely. Every inch of screen goes to your work.

## h3
zh: 🔊 切音频设备?一眼就够了
en: 🔊 Switch audio devices in one tap

## img
slot: img-16
alt_zh: Audio Out
alt_en: Audio Out

## text
zh: 会议室里要切 AirPods。工作室里要切外放。打游戏切耳机。通常的做法:系统设置 → 声音 → 输出 → 找到设备 → 点一下。每次都这样。Tapflow 的 Audio Out 组件:平板上一个按钮,点一下弹出所有设备列表,选一个。长按直接轮换。一秒。
en: AirPods in a meeting, speakers in the studio, headset for gaming. The usual path: System Settings → Sound → Output → find the device → click. Every single time. Tapflow's Audio Out widget: one button pops the device list, long-press cycles. One second.

## h3
zh: ⌨️ 把 iPad 变成一整个键盘
en: ⌨️ The whole iPad as a keyboard

## img
slot: img-17
alt_zh: 全键盘面板
alt_en: full panel

## text
zh: 平板屏幕足够大。在上面铺满按键、触控板、手势区、窗口摇杆——你的 iPad 就是一块完全按你的习惯定制的输入面板。配合平板的物理键盘打字,触控面板处理一切操作。这不是在键盘上"加按钮",这是完全按你自己的方式重新设计输入。
en: A tablet screen is big enough. Cover it with keys, a trackpad area, gesture zones, the window joystick — your iPad becomes an input panel designed entirely around *your* habits.

## text
zh: 甚至你可以在面板上看 Deepseek 的余额
en: You can even watch your DeepSeek API balance right on the panel:

## img
slot: img-18
alt_zh: 余额显示
alt_en: balance widget

## text
zh: 按钮可变了,实时更新了,那就不仅可以作为指令的输入,同时可以输出信息,这不就是我们一直在追求的与信息无缝连接的终极需求吗?
en: Buttons that can change and update in real time aren't just inputs — they're outputs too. Isn't that the seamless information connection we've always wanted?

## h2
zh: 5 分钟上手,然后就可以开始定义你自己的 Tapflow!
en: Try it

## text
zh: 应用目前是只有 macOS 版本:GITHUB: https://github.com/Alienwang1980/tapflow 。国内下载:百度网盘 https://pan.baidu.com/s/1nMrRw4-q3FYKJQfGRo9nAA?pwd=qw3m 提取码: qw3m 。打包文件中含有 2 个我做的预设的 Profile,下载后在编辑器中导入即可试用
en: macOS only for now: https://github.com/Alienwang1980/tapflow — the package ships with 2 preset profiles, import them in the editor and you're up in ~5 minutes.

## text
zh: 这还只是一些很小的一部分,这些模块的自由度比键盘高了几个维度,尽管我从未想过这东西能替代键盘,但是目前我几乎不怎么碰键盘了。习惯了根据自己需求定义的简单的方法,突然还得用快捷键去激活各种功能的时候,就真的回不去了
en: This is still just a small slice of it. It's a first release, built to validate whether this idea has universal appeal — or if it's just my own itch.

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

Why: keyboards are designed so anyone can type, not so you can control *your* computer efficiently. Shortcuts force you to remember function + key position + hunt for it. In 2026 that felt wrong. I wanted "recognize, don't memorize": buttons you can see, with your own labels, colors, and positions — not 100 identical keys.

How it works:
- A small server runs on the Mac (menu bar app), serving a web editor + panel over HTTP/WebSocket on your LAN.
- The iPad opens the panel in Safari; every touch is injected into macOS via CoreGraphics CGEvent (keyboard/mouse simulation).
- The editor is browser-based: drag buttons, set name/color/size/position, bind actions. Labels update when you change a function.

Widgets I built so far: voice-input button (for vibe coding with Claude Code/Cursor), a window-swipe "joystick" (tiling via gestures), window switcher with live thumbnails, Dock panel (move your Dock to the tablet), audio output switcher, app launcher, key macro pads, a trackpad area, and a live DeepSeek API balance display (buttons can show data, not just send commands).

What it isn't: a Stream Deck clone. Those cost real money and are physical buttons — same "immutable key" problem with a nicer keycap.

It's macOS-only, built to test whether my own itch is general. 5-minute setup, ships with 2 preset profiles. [VERSION PLACEHOLDER: fill in current release version here — see note below]

Repo: https://github.com/Alienwang1980/tapflow

What would make you (not) use something like this? The floor is yours — especially the critical kind of feedback.
