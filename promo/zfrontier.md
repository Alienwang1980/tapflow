# Tapflow:把 iPad 变成客制化触控面板 —— 与键盘鼠标搭档的 Mac 输入方案

键盘是打字的通用工具,大多数情况下它做得很好。但电脑操作里还有大量高频动作——切换窗口、调音频、启动应用——这些用快捷键或鼠标多级菜单并不总是最直观的。

![键盘](https://img.tapflow.work/tapflow-02.jpg)

快捷键的数量很容易超出记忆负担。⌘⌥⇧K 是什么?先回忆功能,再回忆键位,再让手指找过去——当快捷键多到一定程度,这个过程就会打断思路。

这张 Mac 快捷键图还不完整,数量已经相当可观。

![Mac 快捷键不完全图](https://img.tapflow.work/tapflow-03.jpg)

相比之下,识别比回忆更快:看见一个写着功能的按钮,比回忆一个组合键快得多。这是 Tapflow 的出发点。

视觉界面在今天的设备上已经无处不在——手机认脸、Mac 认指纹。把常用操作做成看得见的东西,并不超前。

如今 AI 时代,Vibe Code 对输入方式提出了新需求,市面上也出现了相应的产品,例如 Worklouder Creator Micro 2:

![Creator Micro 2](https://img.tapflow.work/tapflow-04.jpg)

![Creator Micro 2](https://img.tapflow.work/tapflow-05.jpg)

![Creator Micro 2](https://img.tapflow.work/tapflow-06.jpg)

这类产品回应了 Vibe Code 的语音输入需求,但它们仍是实体按键:按键可以自定义,样子和大小却不会变,自定义多了以后,记住每个键的用途依然是个负担。

自定义宏多了以后,忘记每个按键的用途是常见的事。

![忘记宏的 Vibe 键盘](https://img.tapflow.work/tapflow-07.jpg)

另一类成熟产品是 Elgato Stream Deck:实体按键 + 小屏幕,体验不错,价格从千元级起步。

![Stream Deck](https://img.tapflow.work/tapflow-08.jpg)

我的做法是从一个小问题入手,做一个轻量的方案,和用户的需求一起成长。于是我做了这个:

![Tapflow](https://img.tapflow.work/tapflow-01.jpg)

## Tapflow:点流 —— 你的个性化控制层

Tapflow 不是要替代键盘,而是与键盘鼠标配合:把高频操作做成看得见的按钮,减少记忆负担。

![面板](https://img.tapflow.work/tapflow-10.jpg)

![面板](https://img.tapflow.work/tapflow-11.jpg)

一个可以完全定制的,用于操作电脑的输入界面。有个运行在 MacOS 上的服务端,然后通过网页端连接,仅此而已。提供了一个用于定制的网页编辑器;

![编辑器](https://img.tapflow.work/tapflow-12.jpg)

你在编辑器里拖出按钮,每个按钮可以定义名字、颜色、尺寸、位置。改了功能,标签立刻跟着变——看见即用,不用记。

## 几个使用场景,感受一下

### 🎤 Vibe Coding 语音激活

![语音按钮](https://img.tapflow.work/tapflow-13.jpg)

你用 Claude Code / Cursor 做 vibe coding,AI 在写代码,你要说下一段 prompt。在 Tapflow 上,一个写着"🎤 说话"的按钮,点一下就开始说,不用在键盘上找语音输入快捷键。

### 🕹️ 窗口排列 = 游戏手柄摇杆

![Window Swipe](https://img.tapflow.work/tapflow-14.jpg)

![Window Swipe 动图](https://img.tapflow.work/tapflow-window-swiper.gif)

macOS 的窗口贴靠功能很强——全屏、左半、右半、上半、下半。触发方式通常是快捷键或把窗口拖到屏幕边缘。Tapflow 的 Window Swipe 把它做成了摇杆:手指往上滑窗口全屏,往左滑贴左半,往右下滑贴右下角,点一下最大化,长按全屏。

### 🖼️ 窗口缩略图,一眼切换

![Window Switcher](https://img.tapflow.work/tapflow-15.jpg)

⌘Tab 切窗口只能看到 App 图标,看不到窗口内容;开了三个 VS Code 窗口时,得逐个试。Window Switcher 把所有窗口的实时缩略图排出来,按应用分组,横向滑动,窗口内容一目了然,点一下切过去。

### 📱 Dock 上平板,屏幕更干净

![Dock Panel](https://img.tapflow.work/tapflow-16.jpg)

macOS 的 Dock 常年占着屏幕底下一排,隐藏了又不方便。把 Dock Panel 放到 iPad 上,从平板启动 App、退出 App,Mac 屏幕上的 Dock 可以隐藏起来,屏幕全部留给工作。

### 🔊 切音频设备?一眼就够了

![Audio Out](https://img.tapflow.work/tapflow-17.jpg)

会议室切 AirPods,工作室切外放,打游戏切耳机。通常的路径是:系统设置 → 声音 → 输出 → 找到设备。Tapflow 的 Audio Out 组件:平板上一键弹出设备列表,选一个;长按直接轮换。

### ⌨️ 把 iPad 变成一整个键盘

![全键盘面板](https://img.tapflow.work/tapflow-18.jpg)

平板屏幕足够大。在上面铺满按键、触控板、手势区、窗口摇杆——iPad 变成一块按你的习惯定制的输入面板。配合平板物理键盘打字,触控面板处理其他操作。

甚至你可以在面板上看 Deepseek 的余额

![余额显示](https://img.tapflow.work/tapflow-19.jpg)

按钮可以实时变化,就不只是输入指令,还能输出信息。

## 5 分钟上手,然后就可以开始定义你自己的 Tapflow!

应用目前是只有 macOS 版本:GITHUB: [https://github.com/Alienwang1980/tapflow](https://github.com/Alienwang1980/tapflow) 。国内下载:百度网盘 [https://pan.baidu.com/s/1nMrRw4-q3FYKJQfGRo9nAA?pwd=qw3m](https://pan.baidu.com/s/1nMrRw4-q3FYKJQfGRo9nAA?pwd=qw3m) 提取码: qw3m 。打包文件中含有 2 个我做的预设的 Profile,下载后在编辑器中导入即可试用

上面只是功能的一部分。需要说明的是:我从未打算让它替代键盘——打字这类任务键盘依然是最合适的工具,Tapflow 的定位是与键盘鼠标配合,分担高频操作,提升效率。当然,也有用户告诉我,在特定场景下他们几乎不再碰键盘——这是意外的使用方式,不是设计目标。

![结尾](https://img.tapflow.work/tapflow-20.jpg)

如果看到这里,非常开心你对这个 Idea 有兴趣,目前我也刚做了第一个版本,目的只是验证这个想法是不是有用,或者说我自己的需求有没有普遍性。然而当然也有很多不完善的地方,欢迎提出你的想法和意见!


---

> 发布提示:zFrontier 装备前线社区;发帖前先看社区规则,选合适的圈子(外设/桌面装备相关);若编辑器不支持外链图再退回本地上传;语气对键盘玩家友好,评论区被问"和键盘比如何"时按定位答:配合,不替代。
