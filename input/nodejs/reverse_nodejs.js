const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const fileDirectory = '/nodejs';

// bprecvfile コマンドを実行する関数
function executeBprecvfile() {
    const command = `cd ${fileDirectory} && bprecvfile ipn:150.1 1`;
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

function sendHttpRequestViaCurl(url, filename, filePath, requestId) {
    const curlCommand = `curl -x 192.168.3.3:80 ${url}`;
    exec(curlCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`[${new Date().toLocaleString()}] Error executing curl for ${filename}: ${error.message}`);
            return;
        }

        if (stderr) {
            console.error(`[${new Date().toLocaleString()}] Curl stderr for ${filename}: ${stderr}`);
        }

        const responseText = `incoming response, id=${requestId}, \n${stdout}`;
        const responseFilename = `response_${Date.now()}.html`;
        const responseFilePath = path.join(fileDirectory, responseFilename);

        try {
            fs.writeFileSync(responseFilePath, responseText);
            console.log(`[${new Date().toLocaleString()}] Response written to ${responseFilename}`);

            // ファイル名を変更する
            const newFilename = `request_${Date.now()}`;
            const newFilePath = path.join(fileDirectory, newFilename);
            fs.renameSync(filePath, newFilePath);
            console.log(`[${new Date().toLocaleString()}] File renamed to ${newFilename}`);
        } catch (writeError) {
            console.error(`[${new Date().toLocaleString()}] Error writing response to file: ${writeError}`);
        }
    });
}

executeBprecvfile();

fs.watch(fileDirectory, (eventType, filename) => {
    if (eventType === 'rename') {
        if (filename.startsWith('response_')) {
            const filePath = path.join(fileDirectory, filename);
            console.log(`[${new Date().toLocaleString()}] Detected response file: ${filename}`);

            // bpsendfile コマンドの実行
            const bpsendfileCommand = `bpsendfile ipn:150.1 ipn:149.1 ${filePath}`;
            exec(bpsendfileCommand, (error, stdout, stderr) => {
                if (error) {
                    console.error(`[${new Date().toLocaleString()}] Error executing bpsendfile for ${filename}: ${error.message}`);
                    return;
                }
                if (stderr) {
                    console.error(`[${new Date().toLocaleString()}] bpsendfile stderr for ${filename}: ${stderr}`);
                }
                console.log(`[${new Date().toLocaleString()}] bpsendfile executed for ${filename}: ${stdout}`);
            });
            executeBprecvfile();
            console.log(`started new listning session`);
        } else if (filename.startsWith('testfile')) {
            const filePath = path.join(fileDirectory, filename);
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error(`[${new Date().toLocaleString()}] Error reading file: ${err}`);
                    return;
                }

                const lines = data.split('\n').map(line => line.trim());
                const requestLine = lines.find(line => line.startsWith("incoming request="));
                const idLine = lines.find(line => line.startsWith("id="));

                if (!requestLine || !idLine) {
                    console.error(`[${new Date().toLocaleString()}] Invalid file format in ${filename}`);
                    return;
                }

                const requestUrl = requestLine.substring("incoming request=".length).trim();
                const requestId = idLine.substring("id=".length).trim();

                console.log(`[${new Date().toLocaleString()}] Processing request: URL=${requestUrl}, ID=${requestId}`);
                sendHttpRequestViaCurl(requestUrl, filename, filePath, requestId); // requestId を渡す
            });
        }
    }
});
