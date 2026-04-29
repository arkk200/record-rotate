# record-rotate

![record rotate](https://record-rotate.arkk200.workers.dev/?width=900&title=on&albums=Travis%20Scott:Utopia,Kanye%20West:Graduation,Sweet%20Trip:You%Will%Never%20Know%20Why)

앨범 제목을 작성하면 iTunes Search API로 커버를 찾아 GitHub 프로필용 SVG 슬라이드를 만들어줍니다.

## Usage

```md
![record rotate](https://record-rotate.<your-subdomain>.workers.dev/?albums=Travis%20Scott:Rodeo,Kanye%20West:Graduation,Kendrick%20Lamar:DAMN.)
```

`albums`는 쉼표로 구분합니다. 최대 7개까지 처리합니다. 앨범명만 넣어도 되지만, 검색 정확도를 위해 `Artist:Album` 또는 `Artist - Album` 형식을 권장합니다. `albums`가 없으면 앨범 커버는 표시하지 않습니다.

```txt
?albums=Travis Scott:Rodeo,Kanye West:Graduation,Kendrick Lamar:DAMN.
```

**콜론**(`:`) 또는 **공백을 포함한 하이픈**(` - `)을 쓰면 앞은 아티스트명, 뒤는 앨범명으로 나눠서 인식합니다.

```txt
?albums=Travis Scott - Rodeo,Kanye West - Graduation,Kendrick Lamar - DAMN.
```

`width`로 SVG 크기를 조절할 수 있습니다. 높이는 고정 비율로 자동 계산됩니다.

`title=1`을 추가하면 중앙 앨범의 제목과 아티스트명을 함께 표시합니다. 생략하거나 `title=false`로 두면 앨범 커버만 보여줍니다.

```md
![record rotate](https://record-rotate.arkk200.workers.dev/?width=900&title=1&albums=Travis%20Scott:Rodeo,Kanye%20West:Graduation)
```

URL에서는 공백을 `%20`으로 인코딩해야 합니다.

- `width`: 360~1200, 기본값 760
- `albums`: 쉼표로 구분, **최대 7개**
- `title`: `1`, `true`, `yes`, `on`이면 중앙 앨범 제목 표시, 기본값 꺼짐
- 비율: 760:280

## Development

```sh
npm install
npm run dev
```

## Deploy

```sh
npm run deploy
```
