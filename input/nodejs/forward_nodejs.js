const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const fileDirectory = '/nodejs';
const clientConnections = new Map();

// 解析されたHTTPレスポンスを保存する変数
let savedHttpResponse = '';

// bprecvfile コマンドを実行する関数
function executeBprecvfile() {
  const command = `cd ${fileDirectory} && bprecvfile ipn:149.1 1`;
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`[${new Date().toLocaleString()}] Error executing bprecvfile: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`[${new Date().toLocaleString()}] bprecvfile stderr: ${stderr}`);
    }
    console.log(`[${new Date().toLocaleString()}] bprecvfile executed: ${stdout}`);
  });
}

const server = http.createServer((req, res) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`Received request from ${clientIp}`);

  let requestBody = '';
  req.on('data', chunk => {
    requestBody += chunk.toString();
  });

  req.on('end', () => {
    const timestamp = new Date().toISOString();
    const filename = `request_${timestamp.replace(/:/g, '-')}.txt`;
    const filePath = path.join(fileDirectory, filename);

    // 8桁の乱数IDを生成する関数
    function generateRandomId() {
      return Math.floor(Math.random() * 100000000).toString().padStart(7, '0');
    }
    const randomId = generateRandomId();

    // ヘッダーからホスト名を取得し、URLを構築
    const hostHeader = req.headers['host'];
    const fullUrl = `http://${hostHeader}${req.url}`;
    const requestDetails = `incoming request=${fullUrl}\n${requestBody}\nid= ${randomId}`;

    fs.writeFile(filePath, requestDetails, error => {
      if (error) {
        console.error(`Error writing file for ${clientIp}: ${error.message}`);
      } else {
        console.log(`Request from ${clientIp} written to file ${filename}`);
      }
    });

    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(savedHttpResponse || `Received request at ${new Date().toISOString()}`);
    }, 100); // 例えば1秒待つ
  });

  req.on('error', error => {
    console.error(`Request error from ${clientIp}: ${error.message}`);
  });

  res.on('error', error => {
    console.error(`Response error to ${clientIp}: ${error.message}`);
  });

  clientConnections.set(clientIp, res);

  req.on('close', () => {
    clientConnections.delete(clientIp);
    console.log(`Closed connection from ${clientIp}`);
  });
});

server.listen(90, '0.0.0.0', () => {
  console.log('Server listening on port 90');
});

fs.watch(fileDirectory, (eventType, filename) => {
  if (eventType === 'rename') {
    if (filename.startsWith('testfile')) {
      const filePath = path.join(fileDirectory, filename);
      const newFilename = `response_${Date.now()}.txt`;
      const newFilePath = path.join(fileDirectory, newFilename);

      fs.rename(filePath, newFilePath, (renameError) => {
        if (renameError) {
          console.error(`Error renaming file: ${renameError}`);
          return;
        }

        fs.readFile(newFilePath, 'utf8', (readError, data) => {
          if (readError) {
            console.error(`Error reading file: ${readError}`);
            return;
          }

          const idMatch = data.match(/id=\s*(\d+)/); // id= の後のスペースを許容
          const responseMatch = data.match(/incoming response, id=\d+,\s*\n([\s\S]+)/); // レスポンスボディ前のスペースや改行を許容

          if (idMatch && responseMatch) {
            const id = idMatch[1];
            const responseBody = responseMatch[1].trim(); // 念のため前後の空白をトリム
            console.log(`[${new Date().toLocaleString()}] ID: ${id}, Response Body: ${responseBody}`);

            // 保存するレスポンスを更新
            savedHttpResponse = responseBody;
          } else {
            console.error(`[${new Date().toLocaleString()}] Invalid response format in file: ${newFilename}`);
          }
        });
      });
    } else if (filename.startsWith('request_')) {
      const filePath = path.join(fileDirectory, filename);
      console.log(`New request file detected: ${filename}`);

      exec(`bpsendfile ipn:149.1 ipn:150.1 ${filePath}`, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing bpsendfile for ${filename}: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`bpsendfile stderr for ${filename}: ${stderr}`);
        }
        console.log(`bpsendfile command executed for ${filename}: ${stdout}`);
        executeBprecvfile();
      });
    }
  }
});

// Web server to control the proxy
const controlServer = http.createServer((req, res) => {
  const { method, url } = req;

  if (method === 'POST' && url === '/control') {
    let requestBody = '';
    req.on('data', chunk => {
      requestBody += chunk.toString();
    });

    req.on('end', () => {
      // ここでリクエストボディを解析
      // 例: JSON形式のリクエストボディを解析
      try {
        const controlRequest = JSON.parse(requestBody);
        // ここで制御コマンドに応じたアクションを実行
        // 例: controlRequest.action に応じた処理
        // ...

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Control request processed');
      } catch (error) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Invalid request');
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

controlServer.listen(8080, '0.0.0.0', () => {
  console.log('Control server listening on port 8080');
});

