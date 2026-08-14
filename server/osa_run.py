"""Safe osascript runner.

osascript can print its result and then never exit (observed 2026-08:
`get volume settings` prints `output volume:...` and hangs). A bare
subprocess.run without timeout blocks an anyio worker thread forever;
~40 stuck workers exhaust the thread pool and every module on the panel
goes blank. Always bound the wait here and kill the process on timeout,
keeping whatever output it printed before hanging.
"""

import signal
import subprocess

OSA_TIMEOUT = 2
# A hung osascript ignores SIGTERM; SIGKILL cannot be ignored. Even the
# post-kill communicate is bounded — a worker thread must NEVER wait on
# a dead process forever (that is how the panel went blank).
_KILL_GRACE = 1


def _reap(proc):
    """Kill then collect output, escalating SIGTERM → SIGKILL.
    Returns (out, err); empty strings if the process could not be reaped
    in time (leaves a zombie that init cleans up at exit — acceptable)."""
    try:
        proc.kill()
    except ProcessLookupError:
        pass  # already dead — no signal needed
    try:
        return proc.communicate(timeout=_KILL_GRACE)
    except subprocess.TimeoutExpired:
        proc.send_signal(signal.SIGKILL)
        try:
            return proc.communicate(timeout=_KILL_GRACE)
        except subprocess.TimeoutExpired:
            return "", ""


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
    except subprocess.TimeoutExpired as e:
        out, err = _reap(proc)
        # osascript prints its result BEFORE hanging (verified: the full
        # `get volume settings` line is in the partial buffer at timeout).
        # Merge it so callers still get real data. Note: TimeoutExpired
        # .stdout/.stderr are ALWAYS bytes, even with text=True.
        if not out and e.stdout:
            out = e.stdout.decode("utf-8", "replace") if isinstance(e.stdout, bytes) else e.stdout
        if not err and e.stderr:
            err = e.stderr.decode("utf-8", "replace") if isinstance(e.stderr, bytes) else e.stderr
        return subprocess.CompletedProcess(
            proc.args, 0 if (out and out.strip()) else 1, out, err)
