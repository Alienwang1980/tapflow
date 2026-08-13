#!/usr/bin/env python3
"""解析 draft.md(用户唯一编辑文件,纯中文原稿)+ translations.json(Claude 维护的英文翻译)。

draft.md 格式(用户只改这一个文件):

    # 注释 / > 说明 —— 跳过
    [标题: v2ex]         ← 下一行是标题文本
    [正文]               ← 正文:普通段落 / ## 小节 / ### 小标题 / [图N] 图片占位
    [hn]                 ← HN 英文纯文本(Claude 维护,用户不改)

英文翻译不在此文件: translations.json 以中文原文为 key 存英文;用户改了某段后
key 失配,该段在英文平台输出 ⚠️[待翻译] 占位,提醒 Claude 重新翻译。
"""
import json
import os
import re

DIR = os.path.dirname(os.path.abspath(__file__))
IMG_RE = re.compile(r'^\[图(\d+)\]$')
SECTIONS = ('正文', 'hn')


def parse_draft(path=None):
    """draft.md → {titles, blocks, hn};blocks 内 text/h2/h3 只含 zh,img 只含 slot。"""
    path = path or os.path.join(DIR, 'draft.md')
    titles, hn_lines, blocks = {}, [], []
    section = None
    pending_title = None
    cur_lines = []  # 攒当前段落(空行/新块 flush)

    def flush():
        nonlocal cur_lines
        if cur_lines:
            blocks.append({'type': 'text', 'zh': '\n'.join(cur_lines)})
            cur_lines = []

    for raw in open(path, encoding='utf-8'):
        line = raw.rstrip('\n')
        s = line.strip()
        if s.startswith('[标题: ') and s.endswith(']'):
            pending_title = s[len('[标题: '):-1]
            continue
        if s.startswith('[') and s.endswith(']') and s[1:-1] in SECTIONS:
            section = s[1:-1]
            continue
        if section == 'hn':
            hn_lines.append(line)  # hn 空行也要保留
            continue
        if pending_title:
            titles[pending_title] = s
            pending_title = None
            continue
        if not s:
            flush()  # 正文空行分段
            continue
        if section != '正文':
            continue
        m = IMG_RE.match(s)
        if m:
            flush()
            blocks.append({'type': 'img', 'slot': f'img-{int(m.group(1)):02d}'})
            continue
        if s.startswith('### '):
            flush()
            blocks.append({'type': 'h3', 'zh': s[4:].strip()})
            continue
        if s.startswith('## '):
            flush()
            blocks.append({'type': 'h2', 'zh': s[3:].strip()})
            continue
        if s.startswith('#'):
            continue  # 正文内注释行(## / ### 已在上方处理)
        cur_lines.append(s)
    flush()
    return {'titles': titles, 'blocks': blocks, 'hn': '\n'.join(hn_lines).strip()}


def load_translations():
    p = os.path.join(DIR, 'translations.json')
    return json.load(open(p, encoding='utf-8')) if os.path.isfile(p) else {}


def parse_source(path=None):
    """draft + translations 组装:给每块注入 en(缺失 → ⚠️[待翻译] 占位)和图片 alt。"""
    draft = parse_draft(path)
    tr = load_translations()
    paras = tr.get('paragraphs', {})
    alts = tr.get('alt', {})
    for b in draft['blocks']:
        if b['type'] == 'img':
            alt = alts.get(b['slot'], {})
            b['alt_zh'] = alt.get('zh', b['slot'])
            b['alt_en'] = alt.get('en', b['slot'])
        else:
            b['en'] = paras.get(b['zh'], '⚠️[待翻译] ' + b['zh'])
    return draft


if __name__ == '__main__':
    r = parse_source()
    assert r['titles'].get('v2ex'), '缺少 v2ex 标题'
    assert r['titles'].get('zfrontier'), '缺少 zfrontier 标题'
    assert r['titles'].get('reddit'), '缺少 reddit 标题'
    assert r['blocks'], 'blocks 为空'
    assert r['hn'], 'hn 为空'
    missing = []
    for b in r['blocks']:
        if b['type'] == 'img':
            assert 'alt_zh' in b and 'alt_en' in b, f'img 块缺 alt: {b}'
        else:
            assert 'zh' in b and 'en' in b, f'{b["type"]} 块缺 zh/en: {b}'
            if b['en'].startswith('⚠️'):
                missing.append(b['zh'][:20])
    n_img = sum(1 for b in r['blocks'] if b['type'] == 'img')
    print(f'OK: {len(r["blocks"])} blocks ({n_img} 图片), hn {len(r["hn"])} 字符, 待翻译 {len(missing)} 段')
    if missing:
        print('待翻译段落:', *missing, sep='\n  ')
