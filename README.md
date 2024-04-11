# sandbox-alb-nginx

ホストによって返すファイルを変える

# 動作確認
ALBのDNS名に `cdk deploy` 実行時に表示される `SandboxAlbNginxStack.LoadBalancerDnsName` の値を使って以下のコマンドを実行する

```shell
> curl http://<ALBのDNS名>:80/index.html
<h1><default</h1>

> curl -H 'Host:example.com' http://<ALBのDNS名>:80/index.html
<h1><example.com</h1>
```
