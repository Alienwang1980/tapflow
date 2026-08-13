#!/usr/bin/env python3
"""解析 source.md(唯一源文件)→ {titles, blocks, hn}。

source.md 格式(只改这一个文件,其他平台帖子由 generator.py 生成):

    [titles]
    v2ex: 中文标题
    reddit: English title

    [body]
    ## text
    zh: 中文段落(可多行,换行继续写即可)
    en: English paragraph

    ## h2
    zh: 小节标题
    en: Section heading

    ## h3
    zh: ...
    en: ...

    ## img
    slot: img-01
    alt_zh: 键盘
    alt_en: keyboard

    [hn]
    Show HN 纯文本正文(英文,原样保留,不支持图片)

语言规则: 中文平台(v2ex)渲染 zh,英文平台(reddit/hn)渲染 en。
"""
import os

DIR = os.path.dirname(os.path.abspath(__file__))
SECTIONS = ('titles', 'body', 'hn')
FIELDS = ('zh', 'en', 'slot', 'alt_zh', 'alt_en')
BLOCK_TYPES = ('text', 'h2', 'h3', 'img')


def parse_source(path=None):
    path = path or os.path.join(DIR, 'source.md')
    titles, blocks, hn_lines = {}, [], []
    section = None
    cur = None          # 当前 body block
    last_field = None   # 续行追加到哪个字段
    for raw in open(path, encoding='utf-8'):
        line = raw.rstrip('\n')
        s = line.strip()
        if s.startswith('[') and s.endswith(']') and s.count('[') == 1 \
                and s[1:-1] in SECTIONS:
            section = s[1:-1]
            cur = None
            last_field = None
            continue
        if section == 'titles':
            if ':' in s:
                k, v = s.split(':', 1)
                titles[k.strip()] = v.strip()
        elif section == 'body':
            if s.startswith('## '):
                btype = s[3:].strip().split()[0]
                assert btype in BLOCK_TYPES, f'未知块类型: {line}'
                cur = {'type': btype}
                blocks.append(cur)
                last_field = None
            elif cur is not None and s:
                for f in FIELDS:
                    if s.startswith(f + ':'):
                        cur[f] = s[len(f) + 1:].strip()
                        last_field = f
                        break
                else:  # 无前缀 → 续行,追加到上一个字段
                    if last_field:
                        cur[last_field] += '\n' + s
        elif section == 'hn':
            hn_lines.append(line)
    hn = '\n'.join(hn_lines).strip()
    return {'titles': titles, 'blocks': blocks, 'hn': hn}


if __name__ == '__main__':
    r = parse_source()
    assert r['titles'].get('v2ex'), '缺少 v2ex 标题'
    assert r['titles'].get('zfrontier'), '缺少 zfrontier 标题'
    assert r['titles'].get('reddit'), '缺少 reddit 标题'
    assert r['blocks'], 'blocks 为空'
    assert r['hn'], 'hn 为空'
    assert all(b['type'] in BLOCK_TYPES for b in r['blocks'])
    for b in r['blocks']:
        if b['type'] == 'img':
            assert 'slot' in b, f'img 块缺 slot: {b}'
            assert 'alt_zh' in b and 'alt_en' in b, f'img 块缺 alt: {b}'
        else:
            assert 'zh' in b and 'en' in b, f'{b["type"]} 块缺 zh/en: {b}'
    n_img = sum(1 for b in r['blocks'] if b['type'] == 'img')
    n_txt = len(r['blocks']) - n_img
    print(f'OK: {len(r["blocks"])} blocks ({n_txt} 文本/标题, {n_img} 图片), hn {len(r["hn"])} 字符')
