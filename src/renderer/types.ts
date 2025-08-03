export interface EnvVar {
  key: string
  value: string
  source?: string
  isEdited?: boolean
}

export interface ShellConfig {
  name: string
  path: string
  description: string
  exists: boolean
}

export interface ShellConfigData {
  success: boolean
  envVars?: Record<string, string>
  nonEnvLines?: string[]
  totalLines?: number
  error?: string
}

export interface ElectronAPI {
  // Shell configuration management
  getShellConfigs: () => Promise<ShellConfig[]>
  readShellConfig: (configName: string) => Promise<ShellConfigData>
  writeShellConfig: (configName: string, envVars: Record<string, string>, nonEnvLines: string[]) => Promise<{ success: boolean; error?: string }>
  backupShellConfig: (configName: string) => Promise<{ success: boolean; backupPath?: string; error?: string }>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}