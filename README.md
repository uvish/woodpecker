# WoodPecker <img src="./assets/icon.png" alt= “” width="30px">
API Load Test tool written in Javascript (Electron JS).

![Screenshot](./assets/screen.png)

## Installation
Get the latest binary from [releases](https://github.com/uvish/woodpecker/releases/tag/1.0.0).

### Running from source (requires NodeJS v14+)

Clone the repository

```shell
git clone https://github.com/uvish/woodpecker.git
cd woodpecker
npm start
```
### Building from source
Clone the repository and run make included in electron forge template

```js
npm run make
```

### Running a Test API server
A sample api server written in golang is present in test-server directory.

To run ,
1. install golang
2. On windows or linux run:
```shell
go run main.go
```
3. In MacOS we can use the above command or directly run the file
```shell
./server
```