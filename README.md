# bebop2自律飛行検証

## 自律飛行内容
1. 人の顔を見つけ、定められた位置（目の前、顔を見下ろせる位置）になるまで、微調整
2. 定められた位置（目の前、顔を見下ろせる位置）になったら、前進し、頭上を飛行
3. 頭上を通り過ぎたら、静止し、速やかに着陸

## 必要なもの
### ハード
* Parrot Bebop2
* PS4コントローラー
* Mac

### ソフト
* Opencv 2.4
* npm

## セットアップ方法
1. このリポジトリをgit clone
2. `npm install`でモジュールインストール
3. node_module/node-gamepad/controllers/ps4/dualshock4.jsonをhttps://github.com/misu007/bebop2_test/blob/master/node_modules/node-gamepad/controllers/ps4/dualshock4.json
の内容に変更する。

## 起動方法
1. `node b1005.js`
2. PS4コントローラーの三角マークボタンで離陸  
(左スティック、右スティックがプロポのモード２に対応, 丸ボタンで着陸)
3. PS4コントローラーのL1ボタンで自律飛行に切替
(マニュアルモードに戻る場合はL2ボタン)
4. -- 自律飛行 --
5. 着陸した後は、必ずPS4コントローラーのshareボタンを2回おして終了します。


