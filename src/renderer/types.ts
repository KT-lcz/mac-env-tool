export interface EnvVar {
  id?: string // 唯一标识符
  key: string
  value: string
  source?: string
  isEdited?: boolean
  isCommented?: boolean
  lineNumber?: number
  originalLine?: string
}

export interface ShellConfig {
  name: string
  path: string
  description: string
  exists: boolean
  isCustom?: boolean
}

export interface ShellConfigData {
  success: boolean
  envVars?: EnvVar[]
  fileLines?: string[]
  totalLines?: number
  error?: string
}

export interface AppSettings {
  commentOnDelete: boolean
  showCommentedVars: boolean
}

export interface ElectronAPI {
  // Shell configuration management
  getShellConfigs: () => Promise<ShellConfig[]>
  addCustomShellConfig: (path: string, name: string, description: string) => Promise<{ success: boolean; error?: string }>
  removeCustomShellConfig: (name: string) => Promise<{ success: boolean; error?: string }>
  readShellConfig: (configName: string) => Promise<ShellConfigData>
  writeShellConfig: (configName: string, fileLines: string[]) => Promise<{ success: boolean; error?: string }>
  backupShellConfig: (configName: string) => Promise<{ success: boolean; backupPath?: string; error?: string }>
  
  // Settings management
  getSettings: () => Promise<AppSettings>
  saveSettings: (settings: AppSettings) => Promise<{ success: boolean; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}