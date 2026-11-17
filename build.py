# src.html에 engine.js / fx.js / deck.json을 끼워 넣어 index.html 한 장으로 만든다.
# GitHub Pages는 파일을 그대로 보내므로 문서 골격(doctype, viewport, 공유 미리보기)을 여기서 붙인다.
s = open('src.html', encoding='utf-8').read()
out = (s.replace('__ENGINE__', open('engine.js', encoding='utf-8').read())
        .replace('__FX__', open('fx.js', encoding='utf-8').read())
        .replace('__DECK__', open('deck.json', encoding='utf-8').read().replace('</', '<\\/')))
head = '\n'.join([
    '<!doctype html>',
    '<html lang="ko">',
    '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
    '<meta name="description" content="라이더-웨이트 78장 타로, 만세력 사주, 궁합, 별자리·수비학을 전통 계산법으로 보는 운세">',
    '<meta property="og:title" content="쪼꼬미 운세">',
    '<meta property="og:description" content="오늘의 카드, 타로 리딩, 사주팔자, 궁합, 별자리">',
    '<meta property="og:image" content="cards/back.webp">',
    '<link rel="icon" href="cards/back.webp">',
    '',
])
out = head + out.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '', 1)
open('index.html', 'w', encoding='utf-8').write(out)
print('index.html', len(out))
