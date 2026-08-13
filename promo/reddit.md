# Tapflow — Turn your iPad into a fully custom control panel for your Mac (no iPad app required)

> 📌 [Pending: new-version highlights — send the changelog to Claude and it gets inserted here]

Keyboards are excellent general-purpose tools for typing. But plenty of high-frequency actions — switching windows, changing audio output, launching apps — aren't always the most intuitive with shortcuts or multi-level menus.

![keyboard](https://img.tapflow.work/tapflow-02.jpg)

Shortcut count easily outgrows memory. What does ⌘⌥⇧K do? Recall the function, recall the position, hunt with your fingers — once you have enough shortcuts, this process interrupts your flow.

This incomplete Mac shortcuts cheat sheet is already a lot to memorize.

![Mac shortcuts](https://img.tapflow.work/tapflow-03.jpg)

Recognition beats recall: seeing a labeled button is faster than remembering a key combination. That's the starting point of Tapflow.

Visual interfaces are everywhere today — phones recognize faces, Macs recognize fingerprints. Making common actions visible is hardly radical.

The AI era and vibe coding are changing input needs, and products like the Worklouder Creator Micro 2 have appeared:

![Creator Micro 2](https://img.tapflow.work/tapflow-04.jpg)

![Creator Micro 2](https://img.tapflow.work/tapflow-05.jpg)

![Creator Micro 2](https://img.tapflow.work/tapflow-06.jpg)

They address voice input for vibe coding, but the physical keys stay fixed: you can remap a key, but it won't change shape or size — and after enough customization, remembering each key's purpose becomes a burden again.

After enough custom macros, forgetting what each key does is common.

![forgotten macros](https://img.tapflow.work/tapflow-07.jpg)

Another established option is the Elgato Stream Deck: physical keys with tiny screens. Works well, priced from three figures.

![Stream Deck XL](https://img.tapflow.work/tapflow-08.jpg)

My approach was to solve one small problem with the lightest possible thing, then grow with real needs. So I made this:

![Tapflow](https://img.tapflow.work/tapflow-01.jpg)

## Tapflow — your personal control layer

Tapflow isn't a keyboard replacement — it works alongside keyboard and mouse: common actions become visible buttons, reducing what you have to memorize.

![panel](https://img.tapflow.work/tapflow-10.jpg)

![panel](https://img.tapflow.work/tapflow-11.jpg)

A fully customizable input surface. **No app to install on the iPad** — a small server runs on your Mac, the iPad connects through the browser, that's it. There's a web-based editor:

![editor](https://img.tapflow.work/tapflow-12.jpg)

Drag out buttons in the editor; each gets its own name, color, size, position. Change a function and the label updates instantly — see it, use it, nothing to memorize.

## Some scenarios

### 🎤 Voice activation for vibe coding

![voice button](https://img.tapflow.work/tapflow-13.jpg)

You're vibe coding in Claude Code / Cursor and need to dictate the next prompt. On Tapflow there's a button labeled "🎤 Talk". Tap and speak — no hunting for the voice-input shortcut.

### 🕹️ Window tiling as a gamepad joystick

![Window Swipe](https://img.tapflow.work/tapflow-14.jpg)

![Window Swipe animation](https://img.tapflow.work/tapflow-window-swiper.gif)

macOS window snapping is powerful, but triggering it usually means shortcuts or dragging to screen edges. Tapflow's Window Swipe turns it into a joystick: swipe up for fullscreen, left for left-half, down-right for bottom corner; tap to maximize, long-press for fullscreen.

### 🖼️ Window thumbnails at a glance

![Window Switcher](https://img.tapflow.work/tapflow-15.jpg)

⌘Tab shows app icons, not window contents — with three VS Code windows open you have to guess. Window Switcher lays out live thumbnails of every window, grouped by app, swipeable: see exactly what's inside, tap to switch.

### 📱 Your Dock, on the tablet

![Dock Panel](https://img.tapflow.work/tapflow-16.jpg)

The macOS Dock eats a row of screen space. Hide it and it's annoying; keep it and it's in the way. Put the Dock Panel on your iPad — launch and quit apps from the tablet, hide the Mac's Dock entirely. Every inch of screen goes to your work.

### 🔊 Switch audio devices in one tap

![Audio Out](https://img.tapflow.work/tapflow-17.jpg)

AirPods in a meeting, speakers in the studio, headset for gaming. The usual path: System Settings → Sound → Output → find the device. Tapflow's Audio Out widget: one tap pops the device list, long-press cycles.

### ⌨️ The whole iPad as a keyboard

![full panel](https://img.tapflow.work/tapflow-18.jpg)

A tablet screen is big enough. Cover it with keys, a trackpad area, gesture zones, the window joystick — your iPad becomes an input panel designed entirely around *your* habits.

You can even watch your DeepSeek API balance right on the panel:

![balance widget](https://img.tapflow.work/tapflow-19.jpg)

Buttons that update in real time aren't just inputs — they're outputs too.

## Try it

macOS only for now: [https://github.com/Alienwang1980/tapflow](https://github.com/Alienwang1980/tapflow) — the package ships with 2 preset profiles, import them in the editor and you're up in ~5 minutes.

This is only part of what's built. To be clear: it was never meant to replace the keyboard — for typing, a keyboard is still the right tool. Tapflow is designed to work alongside keyboard and mouse, taking over high-frequency actions. Some users report barely touching their keyboard in certain scenarios — that's an incidental use case, not the design goal.

![outro](https://img.tapflow.work/tapflow-20.jpg)

Feedback, especially the critical kind, is very welcome. *Full disclosure: I'm the developer of Tapflow.*


---

> Posting notes: r/macapps allows maker posts with disclosure (already included at the end). Check each sub's self-promo rules before posting. Use the Markdown editor.
