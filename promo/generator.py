#!/usr/bin/env python3
"""从 source.md(唯一源文件)+ mapping.json 生成各平台帖子。

用法: python3 generator.py
生成: v2ex.md(中文) zfrontier.md(中文) reddit.md(英文) hn.txt(英文)
语言规则: 中文平台用 zh,英文平台用 en。
"""
import json
import os
import re

from parse_source import parse_source

BASE = 'https://img.tapflow.work'
DIR = os.path.dirname(os.path.abspath(__file__))

PENDING_CN = '> 📌 [待补充:新版本变更亮点 —— 把变更清单给 Claude 后插入到这里]'
PENDING_EN = '> 📌 [Pending: new-version highlights — send the changelog to Claude and it gets inserted here]'

V2EX_FOOTER = '\n---\n\n> 发布提示:发在 V2EX【分享创造】节点;正文发帖时选 Markdown 模式,图片链接才能显示。\n'
ZFRONTIER_FOOTER = ('\n\n---\n\n> 发布提示:zFrontier 装备前线社区;发帖前先看社区规则,选合适的圈子(外设/桌面装备相关);'
                   '若编辑器不支持外链图再退回本地上传;语气对键盘玩家友好,评论区被问"和键盘比如何"时按定位答:配合,不替代。\n')
REDDIT_FOOTER = ('\n\n---\n\n> Posting notes: r/macapps allows maker posts with disclosure '
                 '(already included at the end). Check each sub\'s self-promo rules before posting. '
                 'Use the Markdown editor.\n')
HN_HEADER = ('> Posting notes (from my channel research, verify before use):\n'
             '> - Show HN posts must link to something people can actually try — the GitHub repo has downloads.\n'
             '> - Submit between midnight–8am UTC for best exposure window; don\'t post mid-day US time.\n'
             '> - No images in the post body — HN strips them. The GitHub README is where visuals live.\n'
             '> - Respond to every comment. Don\'t mention voting or use multiple accounts.\n'
             '> - Title suggestion (80 chars max): "Show HN: Tapflow – turn an iPad into a custom control panel for macOS"\n'
             '\n---\n\n')


URL_RE = re.compile(r'https?://[^\s。，、;；!！"\'<>()\[\]{}]+')


def linkify(text):
    """裸 URL → Markdown 链接 [URL](URL)。"""
    return URL_RE.sub(lambda m: f'[{m.group(0)}]({m.group(0)})', text)


def load_mapping():
    return json.load(open(os.path.join(DIR, 'mapping.json'), encoding='utf-8'))


def render_blocks(blocks, mapping, lang):
    """lang: zh | en;输出 Markdown"""
    alt_key = 'alt_' + lang
    out = []
    for b in blocks:
        t = b['type']
        if t == 'text':
            out.append(linkify(b[lang]))
        elif t == 'img':
            url = f'{BASE}/{mapping[b["slot"]]}'
            out.append(f'![{b[alt_key]}]({url})')
        elif t == 'h2':
            out.append('## ' + b[lang])
        elif t == 'h3':
            out.append('### ' + b[lang])
    return '\n\n'.join(out)


def main():
    src = parse_source()
    mapping = load_mapping()

    v2ex = ['# ' + src['titles']['v2ex'], '', PENDING_CN, '',
            render_blocks(src['blocks'], mapping, 'zh'), V2EX_FOOTER]
    zfrontier = ['# ' + src['titles']['zfrontier'], '',
                 render_blocks(src['blocks'], mapping, 'zh'), ZFRONTIER_FOOTER]
    reddit = ['# ' + src['titles']['reddit'], '', PENDING_EN, '',
              render_blocks(src['blocks'], mapping, 'en'), REDDIT_FOOTER]
    hn = ['Show HN: Tapflow — turn an iPad into a custom control panel for macOS (no iPad app)',
          '', HN_HEADER + src['hn']]

    for name, parts in (('v2ex.md', v2ex), ('zfrontier.md', zfrontier), ('reddit.md', reddit), ('hn.txt', hn)):
        open(os.path.join(DIR, name), 'w', encoding='utf-8').write('\n'.join(parts))
    print('生成完毕: v2ex.md / zfrontier.md / reddit.md / hn.txt')


if __name__ == '__main__':
    # 自检: linkify + URL 参数完整性
    assert URL_RE.search('https://pan.baidu.com/s/1nMrRw4-q3FYKJQfGRo9nAA?pwd=qw3m 提取码')
    assert linkify('https://x.com/a') == '[https://x.com/a](https://x.com/a)'
    # ? 参数必须留在 URL 内
    assert linkify('https://pan.baidu.com/s/1?pwd=ab 提取码') == '[https://pan.baidu.com/s/1?pwd=ab](https://pan.baidu.com/s/1?pwd=ab) 提取码'
    main()
