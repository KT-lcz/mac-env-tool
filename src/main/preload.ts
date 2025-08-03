import { contextBridge, ipcRenderer } from 'electron'

const electronAPI = {
  // Shell configuration management
  getShellConfigs: () => ipcRenderer.invoke('get-shell-configs'),
  addCustomShellConfig: (path: string, name: string, description: string) => 
    ipcRenderer.invoke('add-custom-shell-config', path, name, description),
  removeCustomShellConfig: (name: string) => 
    ipcRenderer.invoke('remove-custom-shell-config', name),
  readShellConfig: (configName: string) => ipcRenderer.invoke('read-shell-config', configName),
  writeShellConfig: (configName: string, fileLines: string[]) =>
    ipcRenderer.invoke('write-shell-config', configName, fileLines),
  backupShellConfig: (configName: string) => ipcRenderer.invoke('backup-shell-config', configName),
  
  // Settings management
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings: any) => ipcRenderer.invoke('save-settings', settings)
}

contextBridge.exposeInMainWorld('electronAPI', electronAPI)