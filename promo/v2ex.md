# 分享创造:Tapflow —— 把 iPad 变成你的 Mac 触控面板

> 📌 [待补充:新版本变更亮点 —— 把变更清单给 Claude 后插入到这里]

键盘是一个"通用工具"——它被设计来让任何人能打字,而不是让你高效地操控你的电脑。

![键盘](https://img.tapflow.work/tapflow-02.jpg)

100 多个键,每一个长得差不多。快捷键全靠脑子记。⌘⌥⇧K 是什么?你得先回忆它的功能,再回忆它的键位,再让手指找过去。你的大脑——这台地球上最强大的生物计算机——在被当成快捷键备忘录用。

Mac 快捷键不完全图:背的下来么?

![Mac 快捷键不完全图](https://img.tapflow.work/tapflow-03.jpg)

识别、记忆、回忆。这不是思考,这是浪费。

都 2026 年了。你的手机认得你的脸。你的 Mac 认得你的指纹。但你控制电脑的方式,还停留在背键位。

然而情况也变了。如今 AI 时代,Vibe Code 更是对键盘的需求进一步降低,市面上也有很多为此而生的键盘变体产品,例如:Worklouder: Creator Micro 2

![Creator Micro 2](https://img.tapflow.work/tapflow-04.jpg)

![Creator Micro 2](https://img.tapflow.work/tapflow-05.jpg)

![Creator Micro 2](https://img.tapflow.work/tapflow-06.jpg)

可以看出,这些都在试图满足今天 Vibe Code 对语音而不是键盘需求的改变,但是其并未改变实体按键这个「不可变」的痛点。当然:实体按键可以自定义,但是按键不会改变样子,大小不会变,不直观又不灵活,分分钟忘记定义的宏,这样的产品更像是在"补救"而不是改变!

设置了个 Vibe 键盘,没多久就想不起来设置的按键是什么

![忘记宏的 Vibe 键盘](https://img.tapflow.work/tapflow-07.jpg)

这时候就一定会说了:不是有这个神器吗?那么不得不提 StreamDeck,同时也不能无视这东西的价格

![Stream Deck](https://img.tapflow.work/tapflow-08.jpg)

我想能做出改变的,不是花大力气憋出完美的产品,而是从细微入手解决一个小问题,用最轻的方式送到用户手中,然后再和需求一起成长,于是我做了这个:

![Tapflow](https://img.tapflow.work/tapflow-01.jpg)

## Tapflow:点流 —— 你的个性化控制层

Tapflow 的思路不是做一个"更好的键盘"。是让你不用脑子记快捷键,而且你现在就能开始用。

![面板](https://img.tapflow.work/tapflow-10.jpg)

![面板](https://img.tapflow.work/tapflow-11.jpg)

一个可以完全定制的,用于操作电脑的输入界面。有个运行在 MacOS 上的服务端,然后通过网页端连接,仅此而已。提供了一个用于定制的网页编辑器;

![编辑器](https://img.tapflow.work/tapflow-12.jpg)

你在编辑器里拖几个按钮出来。每个按钮可以定义自己的名字、颜色、尺寸、位置。按你的需要,你不需要回忆它是什么——你一眼就看到了。改了功能?标签立刻跟着变。你的大脑只负责"识别",不用负责"记忆"。

## 几个使用场景,感受一下

### 🎤 Vibe Coding 语音激活

![语音按钮](https://img.tapflow.work/tapflow-13.jpg)

你在用 Claude Code / Cursor 做 vibe coding。AI 在写代码,你要说下一段 prompt。键盘上:找到语音输入快捷键(是哪个来着?)Tapflow 上:有一个按钮,上面写着"🎤 说话"。点一下,开始说。不是"少按了几个键"的问题。是你不用打断思路去想那个快捷键是什么的问题。

### 🕹️ 窗口排列 = 游戏手柄摇杆

![Window Swipe](https://img.tapflow.work/tapflow-14.jpg)

macOS 的窗口贴靠功能很强——全屏、左半、右半、上半、下半。但触发方式呢?要么背快捷键,要么用鼠标拖到屏幕边缘。Tapflow 的 Window Swipe 组件把它做成了一个摇杆。手指在平板上往上滑 → 窗口全屏。往左滑 → 贴左半。往右下滑 → 右下角。就跟打游戏一样。点一下最大化,长按全屏。排列窗口这件事,根本就不应该用快捷键。

### 🖼️ 窗口缩略图,一眼切换

![Window Switcher](https://img.tapflow.work/tapflow-15.jpg)

⌘Tab 切窗口是盲猜——你只能看到 App 图标,看不到窗口内容。开了三个 VS Code 窗口?猜吧,看哪个是你想要的。Window Switcher 把所有窗口的实时缩略图排出来。按应用分组,横向滑动。哪个窗口里有什么,看得一清二楚。点一下,切过去。

### 📱 Dock 上平板,屏幕更干净

![Dock Panel](https://img.tapflow.work/tapflow-16.jpg)

macOS 的 Dock 长年占着屏幕底下一排。隐藏了又不方便。把 Dock Panel 放到 iPad 上。从平板启动 App、退出 App。Mac 屏幕上的 Dock 直接隐藏——每一寸屏幕都留给你的工作。

### 🔊 切音频设备?一眼就够了

![Audio Out](https://img.tapflow.work/tapflow-17.jpg)

会议室里要切 AirPods。工作室里要切外放。打游戏切耳机。通常的做法:系统设置 → 声音 → 输出 → 找到设备 → 点一下。每次都这样。Tapflow 的 Audio Out 组件:平板上一个按钮,点一下弹出所有设备列表,选一个。长按直接轮换。一秒。

### ⌨️ 把 iPad 变成一整个键盘

![全键盘面板](https://img.tapflow.work/tapflow-18.jpg)

平板屏幕足够大。在上面铺满按键、触控板、手势区、窗口摇杆——你的 iPad 就是一块完全按你的习惯定制的输入面板。配合平板的物理键盘打字,触控面板处理一切操作。这不是在键盘上"加按钮",这是完全按你自己的方式重新设计输入。

甚至你可以在面板上看 Deepseek 的余额

![余额显示](https://img.tapflow.work/tapflow-19.jpg)

按钮可变了,实时更新了,那就不仅可以作为指令的输入,同时可以输出信息,这不就是我们一直在追求的与信息无缝连接的终极需求吗?

## 5 分钟上手,然后就可以开始定义你自己的 Tapflow!

应用目前是只有 macOS 版本:GITHUB: [https://github.com/Alienwang1980/tapflow](https://github.com/Alienwang1980/tapflow) 。国内下载:百度网盘 [https://pan.baidu.com/s/1nMrRw4-q3FYKJQfGRo9nAA?pwd=qw3m](https://pan.baidu.com/s/1nMrRw4-q3FYKJQfGRo9nAA?pwd=qw3m) 提取码: qw3m 。打包文件中含有 2 个我做的预设的 Profile,下载后在编辑器中导入即可试用

这还只是一些很小的一部分,这些模块的自由度比键盘高了几个维度,尽管我从未想过这东西能替代键盘,但是目前我几乎不怎么碰键盘了。习惯了根据自己需求定义的简单的方法,突然还得用快捷键去激活各种功能的时候,就真的回不去了

![结尾](https://img.tapflow.work/tapflow-20.jpg)

如果看到这里,非常开心你对这个 Idea 有兴趣,目前我也刚做了第一个版本,目的只是验证这个想法是不是有用,或者说我自己的需求有没有普遍性。然而当然也有很多不完善的地方,欢迎提出你的想法和意见!

---

> 发布提示:发在 V2EX【分享创造】节点;正文发帖时选 Markdown 模式,图片链接才能显示。
