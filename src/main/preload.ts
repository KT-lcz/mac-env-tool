import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  // Shell configuration management
  getShellConfigs: () => ipcRenderer.invoke('get-shell-configs'),
  readShellConfig: (configName: string) => ipcRenderer.invoke('read-shell-config', configName),
  writeShellConfig: (configName: string, envVars: Record<string, string>, nonEnvLines: string[]) =>
    ipcRenderer.invoke('write-shell-config', configName, envVars, nonEnvLines),
  backupShellConfig: (configName: string) => ipcRenderer.invoke('backup-shell-config', configName)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)