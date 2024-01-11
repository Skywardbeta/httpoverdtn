const Proxy = require('http-mitm-proxy').Proxy;
const proxy = new Proxy();
const axios = require('axios'); // For HTTP requests to the control server (axiosのライブラリはnpm install axiosでインストール)

// Define a function to fetch configurations or commands from the control server (制御サーバーから設定やコマンドを取得する関数を定義)
async function fetchControlServerCommands() {
  try {
    const response = await axios.get('http://localhost:8080/control/commands');
    // 受け取ったレスポンスを処理してプロキシの挙動を更新
    // 例：レスポンスに基づいてURLフィルタリングを更新
  } catch (error) {
    console.error(`Error fetching commands from control server: ${error}`);
  }
}

// Periodically fetch commands from the control server (制御サーバーからコマンドを定期的に取得)
setInterval(fetchControlServerCommands, 10000); // (10秒ごとにコマンドを取得)

proxy.onError((ctx, err, errorKind) => {
  const url = (ctx && ctx.clientToProxyRequest) ? ctx.clientToProxyRequest.url : '';
  console.error(`[${errorKind}] ${url} : ${err}`);
  // Optionally, report this error back to the control server (必要に応じて制御サーバーにエラー報告)
});

proxy.onRequest((ctx, callback) => {
  const url = ctx.clientToProxyRequest.url;
  console.log(`Received request for ${url}`);

  // Implement dynamic request handling based on control server commands (制御サーバーのコマンドに基づいて動的にリクエストを処理)
  // ...

  return callback(); // Continue with normal proxy processing (通常のプロキシ処理を続行)
});

//startProxyServerは、プロキシサーバーを起動するための関数です。startProxyServerはPromiseを返し、proxy.listenを使用して指定されたポート（8080）でサーバーを起動します。
//サーバーが正常に起動した場合、Promiseは解決されます。エラーが発生した場合、Promiseはそのエラーで拒否されます。
const startProxyServer = () => {
  return new Promise((resolve, reject) => {
    proxy.listen({ port: 8080 }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

startProxyServer()
  .then(() => {
    console.log('Proxy server listening on port 8080');
  })
  .catch((err) => {
    console.error('Error starting proxy server:', err);
  });
