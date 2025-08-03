import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import * as path from 'path'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync, createWriteStream } from 'fs'
import { homedir } from 'os'

const isDev = process.env.NODE_ENV === 'development'

interface ShellConfig {
  name: string
  path: string
  description: string
}

const SHELL_CONFIGS: ShellConfig[] = [
  { name: '.zshrc', path: path.join(homedir(), '.zshrc'), description: 'Zsh shell configuration' },
  { name: '.zprofile', path: path.join(homedir(), '.zprofile'), description: 'Zsh profile (login shell)' },
  { name: '.zshenv', path: path.join(homedir(), '.zshenv'), description: 'Zsh environment variables' },
  { name: '.local/bin/env', path: path.join(homedir(), '.local/bin/env'), description: 'Local environment script' }
]

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    show: false
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

ipcMain.handle('get-shell-configs', async () => {
  return SHELL_CONFIGS.map(config => ({
    ...config,
    exists: existsSync(config.path)
  }))
})

ipcMain.handle('read-shell-config', async (_, configName: string) => {
  try {
    const config = SHELL_CONFIGS.find(c => c.name === configName)
    if (!config || !existsSync(config.path)) {
      return { success: false, error: 'File not found' }
    }
    
    const content = readFileSync(config.path, 'utf8')
    const envVars: Record<string, string> = {}
    const nonEnvLines: string[] = []
    
    content.split('\n').forEach((line, index) => {
      const trimmedLine = line.trim()
      
      // 检测环境变量导出语句
      if (trimmedLine.startsWith('export ') && trimmedLine.includes('=')) {
        const exportContent = trimmedLine.substring(7) // 移除 "export "
        const [key, ...valueParts] = exportContent.split('=')
        if (key) {
          let value = valueParts.join('=')
          // 移除引号
          value = value.replace(/^["']|["']$/g, '')
          envVars[key] = value
        }
      } else if (trimmedLine && !trimmedLine.startsWith('#') && trimmedLine.includes('=') && !trimmedLine.includes(' ')) {
        // 检测直接赋值语句 (VAR=value)
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && !key.includes(' ')) {
          let value = valueParts.join('=')
          value = value.replace(/^["']|["']$/g, '')
          envVars[key] = value
        } else {
          nonEnvLines.push(line)
        }
      } else {
        nonEnvLines.push(line)
      }
    })
    
    return {
      success: true,
      envVars,
      nonEnvLines,
      totalLines: content.split('\n').length
    }
  } catch (error) {
    console.error('Error reading shell config:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('write-shell-config', async (_, configName: string, envVars: Record<string, string>, nonEnvLines: string[]) => {
  try {
    const config = SHELL_CONFIGS.find(c => c.name === configName)
    if (!config) {
      return { success: false, error: 'Configuration not found' }
    }
    
    // 创建备份
    if (existsSync(config.path)) {
      const backupPath = `${config.path}.backup.${Date.now()}`
      const originalContent = readFileSync(config.path, 'utf8')
      writeFileSync(backupPath, originalContent)
    }
    
    // 生成新内容
    const envExports = Object.entries(envVars).map(([key, value]) => {
      if (value.includes(' ') || value.includes('"') || value.includes("'") || value.includes('$')) {
        return `export ${key}="${value.replace(/"/g, '\\"')}"`
      }
      return `export ${key}=${value}`
    })
    
    // 合并非环境变量行和环境变量行
    const newContent = [
      ...nonEnvLines,
      '',
      '# Environment variables managed by Environment Manager',
      ...envExports
    ].join('\n')
    
    writeFileSync(config.path, newContent)
    
    return { success: true }
  } catch (error) {
    console.error('Error writing shell config:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('backup-shell-config', async (_, configName: string) => {
  try {
    const config = SHELL_CONFIGS.find(c => c.name === configName)
    if (!config || !existsSync(config.path)) {
      return { success: false, error: 'File not found' }
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const backupPath = `${config.path}.backup.${timestamp}`
    const content = readFileSync(config.path, 'utf8')
    writeFileSync(backupPath, content)
    
    return { success: true, backupPath }
  } catch (error) {
    console.error('Error creating backup:', error)
    return { success: false, error: error.message }
  }
})