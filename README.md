# TODO

# Shell环境变量管理器

一个专门用于管理Shell配置文件中环境变量的图形化工具，基于 Electron + React + TypeScript 开发，专为 macOS 设计。

## 功能特性

### 核心功能
- ✅ 图形化编辑Shell配置文件中的环境变量
- ✅ 添加、修改、删除环境变量
- ✅ 实时搜索和过滤
- ✅ 现代化的Material-UI界面
- ✅ 窗口可拖拽，用户体验优良
- 🆕 **原位编辑**: 在原始位置修改变量，保持文件结构
- 🆕 **注释变量**: 可选择注释而非删除变量
- 🆕 **显示注释变量**: 可查看和管理注释的环境变量

### Shell配置文件管理 🔥
- ✅ 管理 `~/.zshrc` 配置文件
- ✅ 管理 `~/.zprofile` 配置文件
- ✅ 管理 `~/.zshenv` 配置文件
- ✅ 管理 `~/.local/bin/env` 配置文件
- 🆕 **自定义配置文件**: 支持添加任意Shell配置文件
- ✅ 自动备份原配置文件
- ✅ 智能解析环境变量语句
- ✅ 保留非环境变量内容
- 🆕 **注释变量检测**: 自动识别注释的环境变量

### 安全特性
- 📄 **自动备份**: 修改配置文件前自动创建带时间戳的备份
- 🧠 **智能解析**: 识别 `export VAR=value` 和 `VAR=value` 格式以及注释的环境变量
- 💾 **内容保护**: 保留配置文件中的注释、别名和其他非环境变量内容
- 🆕 **原位修改**: 在原始行位置修改变量，而非追加到文件末尾
- ⚠️ **确认对话框**: 保存到文件前显示确认对话框
- 🆕 **设置持久化**: 用户偏好设置保存在本地配置文件中

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
- **左侧面板(30%)**: Shell配置文件选择器，显示可用的配置文件及其状态，支持添加/删除自定义配置
- **右侧面板(70%)**: 环境变量管理区域，包含环境变量列表和编辑器
- **设置对话框**: 通过顶部齿轮图标访问，管理应用设置
- **通知系统**: Material-UI Snackbar 提供操作反馈

### 操作流程
1. **选择配置文件**: 在左侧面板选择要管理的shell配置文件
2. **添加自定义配置**: 点击"添加自定义"按钮添加任意Shell配置文件
3. **查看状态**: 显示文件是否存在以及描述信息
4. **创建备份**: 点击备份按钮为配置文件创建备份
5. **编辑变量**: 在右侧面板查看现有环境变量，点击"添加"按钮或选择变量进行编辑
6. **管理注释变量**: 在设置中启用"显示注释变量"查看被注释的环境变量
7. **保存到文件**: 修改后点击"保存到文件"按钮写入配置文件

### 支持的配置文件
- **~/.zshrc**: Zsh shell配置文件，包含别名、函数和环境变量
- **~/.zprofile**: Zsh登录shell配置，在用户登录时执行
- **~/.zshenv**: Zsh环境变量文件，在每次shell启动时执行
- **~/.local/bin/env**: 用户本地环境脚本
- **自定义配置**: 用户可添加任意Shell配置文件进行管理

### 应用设置
- **删除时注释**: 开启后删除变量时会注释而非完全删除
- **显示注释变量**: 控制是否显示被注释的环境变量
- **自定义配置管理**: 添加和移除自定义Shell配置文件

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
│   ├── main.ts     # 主进程入口，IPC处理，解析逻辑
│   └── preload.ts  # 预加载脚本，安全桥接
└── renderer/       # React渲染进程代码
    ├── main.tsx    # React入口
    ├── App.tsx     # 主应用组件，布局和状态管理
    ├── types.ts    # TypeScript类型定义
    └── components/ # React组件
        ├── EnvVarList.tsx          # 环境变量列表，搜索过滤
        ├── EnvVarEditor.tsx        # 环境变量编辑器表单
        ├── ShellConfigSelector.tsx # Shell配置文件选择器
        ├── ShellConfigManager.tsx  # 主内容区域协调组件
        ├── AddConfigDialog.tsx     # 添加自定义配置对话框
        └── SettingsDialog.tsx      # 应用设置管理对话框
```

## 示例

### Shell配置文件示例
工具会正确解析和管理以下格式的环境变量：
```bash
# ~/.zshrc 示例
export PATH="/usr/local/bin:$PATH"
export NODE_ENV="development"
export DATABASE_URL="postgres://localhost/myapp"

# 注释的环境变量（也会被识别和管理）
# export DEBUG_MODE="true"
# export API_KEY="your-api-key"

# 其他配置（会被保留）
alias ll="ls -la"
alias gs="git status"

function mkcd() {
    mkdir -p "$1" && cd "$1"
}
```

### 编辑后的效果（原位修改）
```bash
# ~/.zshrc (修改后 - 变量在原始位置被修改)
export PATH="/usr/local/bin:/new/path:$PATH"  # 在原始行修改
export NODE_ENV="production"                  # 在原始行修改
export DATABASE_URL="postgres://localhost/myapp"

# 新添加的变量会在适当位置插入
export NEW_VAR="added via manager"

# 注释的环境变量（可以恢复或保持注释状态）
# export DEBUG_MODE="true"
export API_KEY="your-api-key"                 # 从注释状态恢复

# 其他配置（完全保留）
alias ll="ls -la"
alias gs="git status"

function mkcd() {
    mkdir -p "$1" && cd "$1"
}
```

## 特色功能

### 智能备份
- 每次保存前自动创建备份
- 备份文件名包含时间戳，方便识别
- 支持手动创建备份

### 增强的解析和编辑
- **原位编辑**: 变量在原始行位置被修改，保持文件结构完整
- **注释变量支持**: 识别和管理被注释的环境变量（如 `# export VAR=value`）
- **行号追踪**: 准确记录每个变量的行位置，确保精确修改
- **内容保护**: 自动识别和保护非环境变量内容

### 自定义配置管理
- **添加自定义配置**: 支持添加任意Shell配置文件路径
- **配置标识**: 自定义配置显示"自定义"标识
- **配置移除**: 可移除不需要的自定义配置（内置配置不可移除）

### 用户体验
- 窗口支持拖拽移动
- 简洁专注的界面设计
- 实时操作反馈和通知
- **设置持久化**: 用户偏好设置自动保存到 `~/.shell-env-manager-settings.json`
- **可视化指示**: 注释变量显示删除线和警告标识

## 注意事项

1. **备份重要**: 建议在首次使用前手动备份重要的shell配置文件
2. **重启生效**: 修改shell配置文件后需要重启终端或执行 `source ~/.zshrc` 生效
3. **权限检查**: 确保应用有读写用户目录文件的权限
4. **格式支持**: 支持 `export VAR=value`、`VAR=value` 和注释格式 `# export VAR=value`
5. **设置文件**: 应用设置保存在 `~/.shell-env-manager-settings.json`，可手动编辑
6. **自定义配置**: 添加的自定义配置文件路径会被验证，确保文件存在且可访问

## 安装

下载 `Shell Environment Manager-1.0.0-arm64.dmg` 文件并安装。

## 许可证

MIT License
