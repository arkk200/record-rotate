# record-rotate

앨범 제목을 작성하면 iTunes Search API로 커버를 찾아 GitHub 프로필용 SVG 슬라이드를 만들어줍니다.

## Usage

```md
![record rotate](https://record-rotate.<your-subdomain>.workers.dev/?albums=Travis%20Scott%20-%20Rodeo,Kanye%20West%20-%20Graduation,Kendrick%20Lamar%20-%20DAMN.)
```

`albums`는 쉼표로 구분합니다. 앨범명만 넣어도 되지만, 검색 정확도를 위해 `Artist - Album` 형식을 권장합니다.

```txt
?albums=Travis Scott - Rodeo,Kanye West - Graduation,Kendrick Lamar - DAMN.
```

## Development

```sh
npm install
npm run dev
```

## Deploy

```sh
npm run deploy
```
