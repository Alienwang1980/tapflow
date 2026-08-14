"""Safe osascript runner.

osascript can print its result and then never exit (observed 2026-08:
`get volume settings` prints `output volume:...` and hangs). A bare
subprocess.run without timeout blocks an anyio worker thread forever;
~40 stuck workers exhaust the thread pool and every module on the panel
goes blank. Always bound the wait here and kill the process on timeout,
keeping whatever output it printed before hanging.
"""

import subprocess

OSA_TIMEOUT = 3


def osa(script, timeout=OSA_TIMEOUT):
    """Run `osascript -e <script>`, bounded by `timeout` seconds.

    Returns a CompletedProcess. On timeout the process is killed and any
    output printed before the hang is preserved (returncode 0 iff it
    produced usable output), so callers still get real data instead of
    defaults.
    """
    proc = subprocess.Popen(
        ["osascript", "-e", script],
        stdout=subprocess.PIPE, stderr=subprocess.PIPE,
        text=True, encoding="utf-8", errors="replace")
    try:
        out, err = proc.communicate(timeout=timeout)
        return subprocess.CompletedProcess(proc.args, proc.returncode, out, err)
    except subprocess.TimeoutExpired:
        proc.kill()
        out, err = proc.communicate()
        return subprocess.CompletedProcess(
            proc.args, 0 if (out and out.strip()) else 1, out, err)
