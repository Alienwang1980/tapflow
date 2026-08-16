#!/usr/bin/env python3
"""Touchpad gesture state machine tests via CDP multi-touch sequences.

Runs headless Chrome against the dev server (8099), injects a fake WebSocket
that records messages (no real server contact, no real mouse events), and
asserts gesture -> message sequences for the signature-based touchpad FSM.

Usage: dev server must be running on 127.0.0.1:8099 first.
"""
import json, os, subprocess, sys, time, urllib.request
import websocket

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
DEBUG_PORT = 9222
DEV_URL = "http://127.0.0.1:8099/"
PROFILE_PATH = os.path.expanduser("~/Library/Application Support/Tapflow/profiles/Keyboard.json")

def cdp_connect():
    for _ in range(60):
        try:
            targets = json.load(urllib.request.urlopen(f"http://127.0.0.1:{DEBUG_PORT}/json"))
            pages = [t for t in targets if t["type"] == "page"]
            if pages:
                return pages[0]["webSocketDebuggerUrl"]
        except Exception:
            pass
        time.sleep(0.25)
    raise RuntimeError("no CDP page target")

class CDP:
    def __init__(self, url):
        self.ws = websocket.create_connection(url, timeout=10)
        self.i = 0
    def call(self, method, params=None):
        self.i += 1
        self.ws.send(json.dumps({"id": self.i, "method": method, "params": params or {}}))
        while True:
            msg = json.loads(self.ws.recv())
            if msg.get("id") == self.i:
                if "error" in msg:
                    raise RuntimeError(msg["error"])
                return msg.get("result", {})
    def eval(self, expr):
        r = self.call("Runtime.evaluate", {"expression": expr, "returnByValue": True})
        return r.get("result", {}).get("value")

def main():
    profile = json.load(open(PROFILE_PATH))
    assert any(k.get("action") == "touchpad"
               for pg in profile.get("pages", []) for k in pg.get("keys", [])), \
        "no touchpad key in profile"

    subprocess.Popen([CHROME, "--headless=new", f"--remote-debugging-port={DEBUG_PORT}",
                      "--remote-allow-origins=*",
                      "--no-first-run", "--user-data-dir=/tmp/tp_chrome", "about:blank"],
                     stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    cdp = CDP(cdp_connect())
    cdp.call("Page.enable")
    cdp.call("Runtime.enable")
    inject = (
        "window.__msgs=[];"
        f"window.__TP_PROFILE={json.dumps(profile)};"
        "window.WebSocket=class{"
        "static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;"
        "constructor(url){this.url=url;this.readyState=0;"
        "setTimeout(()=>{this.readyState=1;if(this.onopen)this.onopen({});"
        "if(this.onmessage)this.onmessage({data:JSON.stringify({type:'profile',profile:window.__TP_PROFILE,filename:'Keyboard.json'})})},80)}"
        "send(d){window.__msgs.push(d)}close(){}addEventListener(){}};"
    )
    cdp.call("Page.addScriptToEvaluateOnNewDocument", {"source": inject})
    cdp.call("Emulation.setTouchEmulationEnabled", {"enabled": True, "maxTouchPoints": 5})
    cdp.call("Page.navigate", {"url": DEV_URL})
    rect = None
    for _ in range(100):
        r = cdp.eval("(function(){var e=document.querySelector('.key-btn.touchpad');"
                     "if(!e)return null;var r=e.getBoundingClientRect();"
                     "return {x:r.x,y:r.y,w:r.width,h:r.height}})()")
        if r:
            rect = r
            break
        time.sleep(0.2)
    assert rect, "touchpad element not rendered"
    cx, cy = rect["x"] + rect["w"] / 2, rect["y"] + rect["h"] / 2
    print(f"touchpad rect: {rect} center=({cx:.0f},{cy:.0f})")

    def touch(kind, x, y, tid):
        cdp.call("Input.dispatchTouchEvent", {"type": kind, "touchPoints": [
            {"x": x, "y": y, "id": tid, "radiusX": 5, "radiusY": 5, "force": 1}]})
    def wait(ms):
        time.sleep(ms / 1000.0)
    def msgs():
        raw = cdp.eval("window.__msgs.slice()")
        if raw is None:
            raise RuntimeError("injection missing: window.__msgs is undefined")
        return [json.loads(m) for m in raw]
    def clear():
        cdp.eval("window.__msgs.length=0")

    def T(kind):
        return {"type": "touchpad", "action": kind}
    results = []
    def check(name, seq, expect):
        clear()
        for step in seq:
            step()
        got = msgs()
        ok = got == expect
        results.append((name, ok))
        if ok:
            print(f"PASS {name}")
        else:
            print(f"FAIL {name}\n  expect {json.dumps(expect)}\n  got    {json.dumps(got)}")

    ax, ay = cx - 15, cy          # anchor finger
    bx, by = cx + 15, cy          # moving finger
    # 1. single-finger tap -> left click
    check("single tap = left click",
          [lambda: touch("touchStart", ax, ay, 0), lambda: wait(150),
           lambda: touch("touchEnd", ax, ay, 0)],
          [{**T("click"), "button": "left"}])
    # 2. single-finger move -> plain move, no click
    check("single move = cursor move (no click)",
          [lambda: touch("touchStart", ax, ay, 0), lambda: wait(30),
           lambda: touch("touchMove", ax + 20, ay, 0),
           lambda: touch("touchEnd", ax + 20, ay, 0)],
          [{**T("move"), "dx": 20, "dy": 0}])
    # 3. two-finger quick tap -> right click
    check("two-finger tap = right click",
          [lambda: touch("touchStart", ax, ay, 0), lambda: wait(100),
           lambda: touch("touchStart", bx, by, 1), lambda: wait(150),
           lambda: touch("touchEnd", bx, by, 1),
           lambda: touch("touchEnd", ax, ay, 0)],
          [{**T("click"), "button": "right"}])
    # 4. two-finger sync scroll -> pure scroll, no mousedown
    check("two-finger sync move = scroll only",
          [lambda: touch("touchStart", ax, ay, 0), lambda: wait(50),
           lambda: touch("touchStart", bx, by, 1), lambda: wait(30),
           lambda: touch("touchMove", ax, ay + 10, 0),
           lambda: touch("touchMove", bx, by + 10, 1),
           lambda: touch("touchMove", ax, ay + 20, 0),
           lambda: touch("touchMove", bx, by + 20, 1),
           lambda: touch("touchMove", ax, ay + 30, 0),
           lambda: touch("touchMove", bx, by + 30, 1),
           lambda: touch("touchEnd", ax, ay + 30, 0),
           lambda: touch("touchEnd", bx, by + 30, 1)],
          [{**T("scroll"), "dx": 0, "dy": 5}] * 3)
    # 5. anchor + moving finger drag with finger swap -> mousedown/drag/mouseup
    check("anchor+move drag with finger swap",
          [lambda: touch("touchStart", ax, ay, 0), lambda: wait(100),
           lambda: touch("touchStart", bx, by, 1), lambda: wait(30),
           lambda: touch("touchMove", bx, by + 15, 1),
           lambda: touch("touchMove", bx, by + 30, 1),
           lambda: touch("touchEnd", bx, by + 30, 1), lambda: wait(30),
           lambda: touch("touchStart", bx + 30, by + 30, 2),
           lambda: touch("touchMove", bx + 30, by + 45, 2),
           lambda: touch("touchEnd", bx + 30, by + 45, 2),
           lambda: touch("touchEnd", ax, ay, 0)],
          [{**T("mousedown"), "button": "left"},
           {**T("move"), "dx": 0, "dy": 15, "drag": True},
           {**T("move"), "dx": 0, "dy": 15, "drag": True},
           {**T("move"), "dx": 0, "dy": 15, "drag": True},
           {**T("mouseup"), "button": "left"}])
    # 6. settle-window flip: second finger moves first then anchor moves -> scroll
    check("drag flip to scroll inside settle window",
          [lambda: touch("touchStart", ax, ay, 0), lambda: wait(100),
           lambda: touch("touchStart", bx, by, 1), lambda: wait(30),
           lambda: touch("touchMove", bx, by + 15, 1), lambda: wait(50),
           lambda: touch("touchMove", ax, ay + 15, 0),
           lambda: touch("touchMove", bx, by + 30, 1),
           lambda: touch("touchEnd", ax, ay + 15, 0),
           lambda: touch("touchEnd", bx, by + 30, 1)],
          [{**T("mousedown"), "button": "left"},
           {**T("move"), "dx": 0, "dy": 15, "drag": True},
           {**T("mouseup"), "button": "left"},
           {**T("scroll"), "dx": 0, "dy": 7.5}])
    # 7. slow two-finger hold (> TAP_TIME) -> no click at all
    check("slow two-finger hold = no tap",
          [lambda: touch("touchStart", ax, ay, 0), lambda: wait(100),
           lambda: touch("touchStart", bx, by, 1), lambda: wait(400),
           lambda: touch("touchEnd", bx, by, 1),
           lambda: touch("touchEnd", ax, ay, 0)],
          [])
    # 8. move then return to origin -> moves only, no click
    check("move back to origin = no click",
          [lambda: touch("touchStart", ax, ay, 0), lambda: wait(30),
           lambda: touch("touchMove", ax + 20, ay, 0),
           lambda: touch("touchMove", ax, ay, 0),
           lambda: touch("touchEnd", ax, ay, 0)],
          [{**T("move"), "dx": 20, "dy": 0},
           {**T("move"), "dx": -20, "dy": 0}])

    # 9. anchor drift after finger swap does NOT interrupt drag
    check("anchor drift after swap keeps drag",
          [lambda: touch("touchStart", ax, ay, 0), lambda: wait(100),
           lambda: touch("touchStart", bx, by, 1), lambda: wait(30),
           lambda: touch("touchMove", bx, by + 15, 1),
           lambda: touch("touchEnd", bx, by + 15, 1), lambda: wait(30),
           lambda: touch("touchStart", bx + 30, by + 15, 2),
           lambda: touch("touchMove", ax, ay + 10, 0), lambda: wait(30),
           lambda: touch("touchMove", bx + 30, by + 35, 2),
           lambda: touch("touchEnd", bx + 30, by + 35, 2),
           lambda: touch("touchEnd", ax, ay + 10, 0)],
          [{**T("mousedown"), "button": "left"},
           {**T("move"), "dx": 0, "dy": 15, "drag": True},
           {**T("move"), "dx": 0, "dy": 20, "drag": True},
           {**T("mouseup"), "button": "left"}])
    # 10. lifting second finger during scroll -> remaining finger moves cursor
    check("scroll then lift one finger = cursor move",
          [lambda: touch("touchStart", ax, ay, 0), lambda: wait(50),
           lambda: touch("touchStart", bx, by, 1), lambda: wait(30),
           lambda: touch("touchMove", ax, ay + 10, 0),
           lambda: touch("touchMove", bx, by + 10, 1),
           lambda: touch("touchEnd", bx, by + 10, 1), lambda: wait(30),
           lambda: touch("touchMove", ax, ay + 20, 0),
           lambda: touch("touchEnd", ax, ay + 20, 0)],
          [{**T("scroll"), "dx": 0, "dy": 5},
           {**T("move"), "dx": 0, "dy": 10}])

    npass = sum(1 for _, ok in results if ok)
    print(f"\n{npass}/{len(results)} PASS")
    sys.exit(0 if npass == len(results) else 1)

if __name__ == "__main__":
    main()
