#!/usr/bin/env python3
"""预览页本地服务: 静态文件 + POST /save 保存 mapping.json + GET /thumb 缩略图。

用法: python3 save_server.py [端口]   (默认 8092)
缩略图: GET /thumb/<key> 从图床拉原图,本地缩放到 .thumbs/ 缓存;启动时后台预热。
"""
import io
import json
import os
import sys
import threading
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer

from PIL import Image

from parse_source import parse_source

DIR = os.path.dirname(os.path.abspath(__file__))
THUMB_DIR = os.path.join(DIR, '.thumbs')
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8092
THUMB_SIZE = (240, 240)


def manifest_keys():
    return set(json.load(open(os.path.join(DIR, 'manifest.json'), encoding='utf-8')))


def make_thumb(key):
    """拉取图床原图并缩放缓存;返回缩略图路径,失败返回 None。原子写,并发安全。"""
    os.makedirs(THUMB_DIR, exist_ok=True)
    out = os.path.join(THUMB_DIR, 'thumb-' + key + '.jpg')
    if os.path.isfile(out):
        return out
    try:
        req = urllib.request.Request(
            f'https://img.tapflow.work/{key}',
            headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
                                   'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'})
        data = urllib.request.urlopen(req, timeout=20).read()
        im = Image.open(io.BytesIO(data))
        im.thumbnail(THUMB_SIZE)
        if im.mode in ('RGBA', 'P', 'LA'):
            im = im.convert('RGB')
        tmp = out + '.tmp'
        im.save(tmp, 'JPEG', quality=82)
        os.replace(tmp, out)
        return out
    except Exception as e:
        print(f'thumb failed {key}: {e}', flush=True)
        return None


def prewarm():
    for k in sorted(manifest_keys()):
        make_thumb(k)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # 安静模式

    def do_GET(self):
        if self.path == '/structure':
            body = json.dumps(parse_source(), ensure_ascii=False).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if self.path.startswith('/thumb/'):
            key = urllib.parse.unquote(self.path[len('/thumb/'):])
            if key not in manifest_keys():  # 白名单校验,防路径穿越
                self.send_error(404)
                return
            out = make_thumb(key)
            if not out:
                self.send_error(502)
                return
            body = open(out, 'rb').read()
            self.send_response(200)
            self.send_header('Content-Type', 'image/jpeg')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        path = 'preview.html' if self.path == '/' else self.path.lstrip('/')
        # 防目录穿越
        full = os.path.realpath(os.path.join(DIR, path))
        if not full.startswith(os.path.realpath(DIR) + os.sep) or not os.path.isfile(full):
            self.send_error(404)
            return
        ext = os.path.splitext(full)[1]
        ctype = {'html': 'text/html; charset=utf-8', 'json': 'application/json; charset=utf-8',
                 'txt': 'text/plain; charset=utf-8', 'md': 'text/plain; charset=utf-8',
                 'js': 'text/javascript'}.get(ext.lstrip('.'), 'application/octet-stream')
        body = open(full, 'rb').read()
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != '/save':
            self.send_error(404)
            return
        try:
            length = int(self.headers.get('Content-Length', 0))
            data = json.loads(self.rfile.read(length))
            # 校验: 必须是 {slot: 文件名} 的扁平对象
            assert isinstance(data, dict)
            for k, v in data.items():
                assert isinstance(k, str) and isinstance(v, str)
                assert '/' not in v and '..' not in v
            tmp = os.path.join(DIR, 'mapping.json.tmp')
            with open(tmp, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            os.replace(tmp, os.path.join(DIR, 'mapping.json'))
            body = json.dumps({'ok': True}).encode()
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        except Exception as e:
            body = json.dumps({'ok': False, 'error': str(e)}).encode()
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)


if __name__ == '__main__':
    print(f'serving {DIR} on http://localhost:{PORT}', flush=True)
    threading.Thread(target=prewarm, daemon=True).start()
    HTTPServer(('127.0.0.1', PORT), Handler).serve_forever()
