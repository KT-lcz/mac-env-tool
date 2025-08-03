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
  isCustom?: boolean
}

interface EnvVar {
  id?: string // 唯一标识符
  key: string
  value: string
  isCommented?: boolean
  lineNumber?: number
  originalLine?: string
}

interface AppSettings {
  commentOnDelete: boolean
  showCommentedVars: boolean
  customConfigs: ShellConfig[]
}

const DEFAULT_SHELL_CONFIGS: ShellConfig[] = [
  { name: '.zshrc', path: path.join(homedir(), '.zshrc'), description: 'Zsh shell configuration' },
  { name: '.zprofile', path: path.join(homedir(), '.zprofile'), description: 'Zsh profile (login shell)' },
  { name: '.zshenv', path: path.join(homedir(), '.zshenv'), description: 'Zsh environment variables' },
  { name: '.local/bin/env', path: path.join(homedir(), '.local/bin/env'), description: 'Local environment script' }
]

const SETTINGS_PATH = path.join(homedir(), '.shell-env-manager-settings.json')

let currentSettings: AppSettings = {
  commentOnDelete: true,
  showCommentedVars: true,
  customConfigs: []
}

function loadSettings(): AppSettings {
  try {
    if (existsSync(SETTINGS_PATH)) {
      const content = readFileSync(SETTINGS_PATH, 'utf8')
      return { ...currentSettings, ...JSON.parse(content) }
    }
  } catch (error) {
    console.error('Error loading settings:', error)
  }
  return currentSettings
}

function saveSettingsToFile(settings: AppSettings): void {
  try {
    writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2))
    currentSettings = settings
  } catch (error) {
    console.error('Error saving settings:', error)
    throw error
  }
}

function getAllShellConfigs(): ShellConfig[] {
  return [...DEFAULT_SHELL_CONFIGS, ...currentSettings.customConfigs]
}

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

app.whenReady().then(() => {
  currentSettings = loadSettings()
  createWindow()
})

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
  return getAllShellConfigs().map(config => ({
    ...config,
    exists: existsSync(config.path)
  }))
})

ipcMain.handle('add-custom-shell-config', async (_, filePath: string, name: string, description: string) => {
  try {
    if (!existsSync(filePath)) {
      return { success: false, error: 'File does not exist' }
    }
    
    const newConfig: ShellConfig = {
      name,
      path: filePath,
      description,
      isCustom: true
    }
    
    const updatedSettings = {
      ...currentSettings,
      customConfigs: [...currentSettings.customConfigs, newConfig]
    }
    
    saveSettingsToFile(updatedSettings)
    return { success: true }
  } catch (error) {
    console.error('Error adding custom shell config:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('remove-custom-shell-config', async (_, name: string) => {
  try {
    const updatedSettings = {
      ...currentSettings,
      customConfigs: currentSettings.customConfigs.filter(config => config.name !== name)
    }
    
    saveSettingsToFile(updatedSettings)
    return { success: true }
  } catch (error) {
    console.error('Error removing custom shell config:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('get-settings', async () => {
  return currentSettings
})

ipcMain.handle('save-settings', async (_, settings: AppSettings) => {
  try {
    saveSettingsToFile(settings)
    return { success: true }
  } catch (error) {
    console.error('Error saving settings:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('read-shell-config', async (_, configName: string) => {
  try {
    const config = getAllShellConfigs().find(c => c.name === configName)
    if (!config || !existsSync(config.path)) {
      return { success: false, error: 'File not found' }
    }
    
    const content = readFileSync(config.path, 'utf8')
    const fileLines = content.split('\n')
    const envVars: EnvVar[] = []
    
    fileLines.forEach((line, index) => {
      const trimmedLine = line.trim()
      
      // 检测注释的环境变量（只检测带有 export 的注释行）
      if (trimmedLine.startsWith('#') && trimmedLine.includes('export ')) {
        const uncommentedLine = trimmedLine.substring(1).trim()
        const envVar = parseEnvLine(uncommentedLine, index, line)
        if (envVar) {
          envVar.isCommented = true
          envVar.id = `${envVar.key}_${index}_commented` // 基于key、行号和状态生成唯一ID
          envVars.push(envVar)
        }
      }
      // 检测正常的环境变量
      else {
        const envVar = parseEnvLine(line, index, line)
        if (envVar) {
          envVar.isCommented = false
          envVar.id = `${envVar.key}_${index}_active` // 基于key、行号和状态生成唯一ID
          envVars.push(envVar)
        }
      }
    })
    
    return {
      success: true,
      envVars,
      fileLines,
      totalLines: fileLines.length
    }
  } catch (error) {
    console.error('Error reading shell config:', error)
    return { success: false, error: error.message }
  }
})

function parseEnvLine(line: string, lineNumber: number, originalLine: string): EnvVar | null {
  const trimmedLine = line.trim()
  
  // 只检测 export VAR=value 格式，忽略简单的 VAR=value 格式
  if (trimmedLine.startsWith('export ') && trimmedLine.includes('=')) {
    const exportContent = trimmedLine.substring(7) // 移除 "export "
    const [key, ...valueParts] = exportContent.split('=')
    if (key && key.trim()) {
      let value = valueParts.join('=')
      // 移除引号
      value = value.replace(/^["']|["']$/g, '')
      return {
        key: key.trim(),
        value,
        lineNumber,
        originalLine
      }
    }
  }
  
  return null
}

ipcMain.handle('write-shell-config', async (_, configName: string, fileLines: string[]) => {
  try {
    const config = getAllShellConfigs().find(c => c.name === configName)
    if (!config) {
      return { success: false, error: 'Configuration not found' }
    }
    
    // 创建备份
    if (existsSync(config.path)) {
      const backupPath = `${config.path}.backup.${Date.now()}`
      const originalContent = readFileSync(config.path, 'utf8')
      writeFileSync(backupPath, originalContent)
    }
    
    // 写入新内容
    const newContent = fileLines.join('\n')
    writeFileSync(config.path, newContent)
    
    return { success: true }
  } catch (error) {
    console.error('Error writing shell config:', error)
    return { success: false, error: error.message }
  }
})

ipcMain.handle('backup-shell-config', async (_, configName: string) => {
  try {
    const config = getAllShellConfigs().find(c => c.name === configName)
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