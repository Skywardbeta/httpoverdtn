# README

構成については[リンク](https://docs.google.com/presentation/d/1s6RoEiD2uDQnF-MFReFuGkJ7OVveUM_hERu6MnsehjY/edit#slide=id.g2ab59375451_0_1)のP13 


## 事前準備

1. 全てのコンテナでbash /container_networks.shを実行。これで全てのコンテナがスタティックルーティングで繋がる。
2. forward_proxyとreverse_proxyで `apt install nginx` を実行。オプションはy→n→6→79とかにすればいい。その後`nginx -t`で/etc/nginx/nginx.confに問題がないか確認。問題なければ`systemctl start nginx`で起動。
3. forward_nodejsコンテナにおいて、`ionstart -I /ion-open-source-4.1.2/host149.c`、reverse_nodeコンテナにおいて、`ionstart -I /ion-open-source-4.1.2/host150.c`を実行
4. forward_nodejsコンテナにおいて、nodejsディレクトリ**以外**で「request_」から始まる適当なテキストファイルを作る。今回はrequest_testという名前でやる。中身には、`incoming request http://192.168.4.3/dtn/dtn_data.html`などと記載する。このIPアドレスは今回はweb_serverのもので、最初のincoming requestはreverse_nodejsで処理の識別に用いてる。

## 実行方法

1. forward_nodejsで`node forward_nodejs.js`を実行。「Server listening on port 80」と出るはず。
2. reverse_nodejsで`node reverse_nodejs.js`を実行。
3. reverse_nodejsで`bprecvfile ipn:150.1 1`を実行。（別コンソール）
4. forward_nodejsでrequest_testを、/nodejsディレクトリに入れる。これがトリガーとなり、forward_nodejs.jsがbpsendfleを実行する。
5. 4まで終わったら、forward_nodejsで`bprecvfile ipn:149.1`を実行する。

## 結果

1. 実行方法1の画面には「New request file detected: request_test
bpsendfile command executed for request_test: Stopping bpsendfile.」と出るはず。また、実行方法3の画面には「Stopping bprecvfile.」と出るはず。これでちゃんとbpsendfileできたことがわかる
2. 実行方法2の画面には以下のような内容が出る。  
[1/2/2024, 4:33:35 PM] Processing new file: testfile1   
[1/2/2024, 4:33:35 PM] Response written to response_1704213215816.html  
[1/2/2024, 4:33:35 PM] HTTP response file received: response_1704213215816.html 
[1/2/2024, 4:33:35 PM] bpsendfile output: Stopping bpsendfile.  
一行目はbprecvfileに成功したこと、2行目はHTTPリクエストに成功しファイルにレスポンスを書き込んだこと、3行目は「response_」から始まる名前のファイルが/nodejsディレクトリに検知されたこと、4行目は（forward_nodejsに対する）bpsendfileが成功したことを示す。
1. 実行方法5をやると、testfile1がゲットできる。