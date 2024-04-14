# sandbox-alb-nginx

ホストによって返すファイルを変える

# 動作確認
- ACMで適当なパブリック証明書を作成し、その証明書のドメイン名とARNをメモする
  - パブリック証明書の作成方法は、 https://docs.aws.amazon.com/ja_jp/acm/latest/userguide/gs-acm-request-public.html を参照する
- 以下のコマンドを実行して、環境を構築する

```shell
> npm run cdk deploy -- -c domainName=<ドメイン名> -c certificateArn=<ACM証明書のARN>
# 例
# npm run cdk deploy -- -c domainName=example.com certificateArn=arn:aws:acm:XXX:XXX:certificate/XXX
```

- ALBのDNS名に `cdk deploy` 実行時に表示される `SandboxAlbNginxStack.LoadBalancerDnsName` の値を使って以下のコマンドを実行する
  - 以下の実行例は、domainNameがexample.comの場合の表示です。

```shell
> curl -k https://<ALBのDNS名>:443/index.html
<h1><default</h1>

> curl -k -H 'Host:example.com' https://<ALBのDNS名>:443/index.html
<h1><example.com</h1>

> curl -k -H 'Host:admin.example.com' https://<ALBのDNS名>:443/index.html
<h1>admin.example.com</h1>
```
