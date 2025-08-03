# Shell环境变量管理器

一个专门用于管理Shell配置文件中环境变量的图形化工具，基于 Electron + React + TypeScript 开发，专为 macOS 设计。

## 功能特性

### 核心功能
- ✅ 图形化编辑Shell配置文件中的环境变量
- ✅ 添加、修改、删除环境变量
- ✅ 实时搜索和过滤
- ✅ 现代化的Material-UI界面
- ✅ 窗口可拖拽，用户体验优良

### Shell配置文件管理 🔥
- ✅ 管理 `~/.zshrc` 配置文件
- ✅ 管理 `~/.zprofile` 配置文件
- ✅ 管理 `~/.zshenv` 配置文件
- ✅ 管理 `~/.local/bin/env` 配置文件
- ✅ 自动备份原配置文件
- ✅ 智能解析环境变量语句
- ✅ 保留非环境变量内容

### 安全特性
- 📄 **自动备份**: 修改配置文件前自动创建带时间戳的备份
- 🧠 **智能解析**: 识别 `export VAR=value` 和 `VAR=value` 格式
- 💾 **内容保护**: 保留配置文件中的注释、别名和其他非环境变量内容
- ⚠️ **确认对话框**: 保存到文件前显示确认对话框

## 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式运行
```bash
npm run dev
```

### 构建应用
```bash
npm run build
```

### 打包为macOS应用
```bash
npm run dist
```

## 使用说明

### 主界面布局
- **左侧面板**: Shell配置文件选择器，显示可用的配置文件及其状态
- **中间面板**: 环境变量列表，支持搜索和筛选
- **右侧面板**: 环境变量编辑器，用于添加和修改变量

### 操作流程
1. **选择配置文件**: 在左侧面板选择要管理的shell配置文件
2. **查看状态**: 显示文件是否存在以及描述信息
3. **创建备份**: 点击备份按钮为配置文件创建备份
4. **编辑变量**: 在中间面板查看现有环境变量，点击"添加"按钮或选择变量进行编辑
5. **保存到文件**: 修改后点击"保存到文件"按钮写入配置文件

### 支持的配置文件
- **~/.zshrc**: Zsh shell配置文件，包含别名、函数和环境变量
- **~/.zprofile**: Zsh登录shell配置，在用户登录时执行
- **~/.zshenv**: Zsh环境变量文件，在每次shell启动时执行
- **~/.local/bin/env**: 用户本地环境脚本

### 快捷键
- `Ctrl+Enter`: 保存编辑
- `Esc`: 取消编辑

## 技术栈

- **主框架**: Electron 28
- **前端**: React 18 + TypeScript
- **UI库**: Material-UI 5
- **构建工具**: Vite
- **打包工具**: electron-builder

## 文件结构

```
src/
├── main/           # Electron主进程代码
│   ├── main.ts     # 主进程入口
│   └── preload.ts  # 预加载脚本
└── renderer/       # React渲染进程代码
    ├── main.tsx    # React入口
    ├── App.tsx     # 主应用组件
    ├── types.ts    # TypeScript类型定义
    └── components/ # React组件
        ├── EnvVarList.tsx          # 环境变量列表
        ├── EnvVarEditor.tsx        # 环境变量编辑器
        ├── ShellConfigSelector.tsx # Shell配置文件选择器
        └── ShellConfigManager.tsx  # Shell配置文件管理器
```

## 示例

### Shell配置文件示例
工具会正确解析和管理以下格式的环境变量：
```bash
# ~/.zshrc 示例
export PATH="/usr/local/bin:$PATH"
export NODE_ENV="development"
export DATABASE_URL="postgres://localhost/myapp"

# 其他配置（会被保留）
alias ll="ls -la"
alias gs="git status"

function mkcd() {
    mkdir -p "$1" && cd "$1"
}
```

### 编辑后的效果
```bash
# ~/.zshrc (修改后)
# 原有的注释和别名被保留
alias ll="ls -la"
alias gs="git status"

function mkcd() {
    mkdir -p "$1" && cd "$1"
}

# Environment variables managed by Environment Manager
export PATH="/usr/local/bin:$PATH"
export NODE_ENV="production"
export DATABASE_URL="postgres://localhost/myapp"
export NEW_VAR="added via manager"
```

## 特色功能

### 智能备份
- 每次保存前自动创建备份
- 备份文件名包含时间戳，方便识别
- 支持手动创建备份

### 内容保护
- 自动识别和保护非环境变量内容
- 保留注释、别名、函数定义
- 在文件末尾统一管理环境变量

### 用户体验
- 窗口支持拖拽移动
- 简洁专注的界面设计
- 实时操作反馈和通知

## 注意事项

1. **备份重要**: 建议在首次使用前手动备份重要的shell配置文件
2. **重启生效**: 修改shell配置文件后需要重启终端或执行 `source ~/.zshrc` 生效
3. **权限检查**: 确保应用有读写用户目录文件的权限
4. **格式支持**: 目前支持 `export VAR=value` 和 `VAR=value` 两种格式

## 安装

下载 `Shell Environment Manager-1.0.0-arm64.dmg` 文件并安装。

## 许可证

MIT License