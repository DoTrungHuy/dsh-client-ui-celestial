# dsh-client-ui-celestial

DeepSeek Harness 的 profile 插件：在官方界面上叠加羊皮纸 / 星空配色、背景插画和粒子。

不改官方仓库。装上之后由包自己的 `cordis.patch.yml` 写入 Loader 行，客户端包走官方模块系统，重启即生效。

## 预览

浅色：

![浅色主题](docs/light.png)

深色：

![深色主题](docs/dark.png)

## 安装

桌面版应用引导 **desktop** profile，`dsh web` 引导 **web** profile。给桌面版安装：

```sh
dsh plugin --profile desktop add github:DoTrungHuy/dsh-client-ui-celestial
```

只跑浏览器版时，把 `desktop` 换成 `web`。

`lib/` 已经提交，安装时不跑构建脚本，不会被 pnpm 的 allowBuilds 拦住。

**如果之前装过别的版本**（例如链接到本机的 `@local/dsh-client-ui-celestial`），先卸载再装。同一个 `ui-celestial` Loader 行出现两次会让组合树进入未知状态：

```sh
dsh plugin --profile desktop remove @local/dsh-client-ui-celestial
```

装完完全退出再打开 DeepSeek Harness。皮肤默认开启，不需要在设置里再点一次。

卸载本插件：

```sh
dsh plugin --profile desktop remove dsh-client-ui-celestial
```

然后重新启动。

## 开发

```sh
pnpm install
pnpm run build
```

`lib/` 是 Host 入口和浏览器包，安装时会用到。改源码后重新 build 并提交，再重启 Host。
