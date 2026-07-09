"""System audio capture → FFT → WebSocket broadcast."""
import json, logging, asyncio
try:
    import numpy as np
except ImportError:
    np = None

logger = logging.getLogger(__name__)

try:
    import sounddevice as sd
    HAVE_SD = True
except ImportError:
    HAVE_SD = False

class AudioCapture:
    def __init__(self):
        self.stream = None
        self.running = False
        self.samplerate = 44100
        self.blocksize = 2048
        self.num_bands = 16
        self._loop = None
        self._broadcast_fn = None

    def start(self, broadcast_fn):
        if not HAVE_SD:
            logger.warning("sounddevice not installed")
            return False
        if self.running:
            return True
        try:
            self._loop = asyncio.get_event_loop()
            self._broadcast_fn = broadcast_fn
            self.stream = sd.InputStream(
                callback=self._callback,
                samplerate=self.samplerate,
                blocksize=self.blocksize,
                channels=1,
            )
            self.stream.start()
            self.running = True
            logger.info(f"Audio capture: {self.samplerate}Hz {self.num_bands} bands")
            return True
        except Exception as e:
            logger.error(f"Audio capture error: {e}")
            return False

    def stop(self):
        self.running = False
        if self.stream:
            self.stream.stop()
            self.stream.close()
            self.stream = None

    def _callback(self, indata, frames, time, status):
        if status or not self.running:
            return
        audio = indata[:, 0]
        window = np.hanning(len(audio))
        fft = np.abs(np.fft.rfft(audio * window))
        bands = np.zeros(self.num_bands)
        n = len(fft)
        for i in range(self.num_bands):
            s = int(n * (i / self.num_bands) ** 1.8)
            e = int(n * ((i + 1) / self.num_bands) ** 1.8) + 1
            if e > s and e <= n:
                bands[i] = np.mean(fft[s:e])
        mx = np.max(bands)
        if mx > 1e-6:
            bands = bands / mx
        bands = np.clip(bands, 0, 1)
        data = {"type": "audio_spectrum", "bands": bands.tolist()}
        try:
            self._loop.call_soon_threadsafe(
                lambda d=data: asyncio.ensure_future(self._broadcast_fn(d))
            )
        except Exception:
            pass

audio_capture = AudioCapture()
