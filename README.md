# record-rotate

앨범 제목을 작성하면 iTunes Search API로 커버를 찾아 GitHub 프로필용 SVG 슬라이드를 만들어줍니다.

## Usage

```md
![record rotate](https://record-rotate.<your-subdomain>.workers.dev/?albums=Travis%20Scott:Rodeo,Kanye%20West:Graduation,Kendrick%20Lamar:DAMN.)
```

`albums`는 쉼표로 구분합니다. 앨범명만 넣어도 되지만, 검색 정확도를 위해 `Artist:Album` 또는 `Artist - Album` 형식을 권장합니다. `albums`가 없으면 앨범 커버는 표시하지 않습니다.

```txt
?albums=Travis Scott:Rodeo,Kanye West:Graduation,Kendrick Lamar:DAMN.
```

콜론(`:`) 또는 공백을 포함한 하이픈(` - `)을 쓰면 앞은 아티스트명, 뒤는 앨범명으로 나눠서 인식합니다.

```txt
?albums=Travis Scott - Rodeo,Kanye West - Graduation,Kendrick Lamar - DAMN.
```

`width`로 SVG 크기를 조절할 수 있습니다. 높이는 고정 비율로 자동 계산됩니다.

```md
![record rotate](https://record-rotate.arkk200.workers.dev/?width=900&albums=Travis%20Scott:Rodeo,Kanye%20West:Graduation)
```

- `width`: 360~1200, 기본값 760
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
