import React, { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Typography,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material'
import {
  Save as SaveIcon,
  Backup as BackupIcon,
  Warning as WarningIcon
} from '@mui/icons-material'
import { EnvVar, ShellConfig, ShellConfigData, AppSettings } from '../types'
import EnvVarList from './EnvVarList'
import EnvVarEditor from './EnvVarEditor'

interface ShellConfigManagerProps {
  selectedConfig: ShellConfig | null
  onShowNotification: (message: string, severity: 'success' | 'error' | 'info') => void
}

const ShellConfigManager: React.FC<ShellConfigManagerProps> = ({
  selectedConfig,
  onShowNotification
}) => {
  const [envVars, setEnvVars] = useState<EnvVar[]>([])
  const [selectedVar, setSelectedVar] = useState<EnvVar | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [fileLines, setFileLines] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [settings, setSettings] = useState<AppSettings>({
    commentOnDelete: true,
    showCommentedVars: true
  })

  const loadConfigData = async () => {
    if (!selectedConfig || !selectedConfig.exists) {
      setEnvVars([])
      setFileLines([])
      return
    }

    setIsLoading(true)
    try {
      const [configResult, settingsResult] = await Promise.all([
        window.electronAPI.readShellConfig(selectedConfig.name),
        window.electronAPI.getSettings()
      ])
      
      if (configResult.success && configResult.envVars) {
        setEnvVars(configResult.envVars.sort((a, b) => a.key.localeCompare(b.key)))
        setFileLines(configResult.fileLines || [])
        setHasChanges(false)
      } else {
        onShowNotification(`读取配置文件失败: ${configResult.error}`, 'error')
      }
      
      setSettings(settingsResult)
    } catch (error) {
      console.error('Error loading config data:', error)
      onShowNotification('读取配置文件时发生错误', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveVar = (envVar: EnvVar) => {
    if (!envVar.key.trim()) return

    // 检查是否是修改现有变量（有id且能找到对应的变量）
    const existingVar = envVar.id ? envVars.find(v => v.id === envVar.id) : null
    
    if (existingVar && existingVar.lineNumber !== undefined) {
      // 修改现有环境变量：直接在原行修改
      const originalLineNumber = existingVar.lineNumber
      const newLine = formatEnvVarLine(envVar)
      
      // 直接替换原有行
      setFileLines(prev => {
        const newLines = [...prev]
        if (originalLineNumber < newLines.length) {
          newLines[originalLineNumber] = newLine
        }
        return newLines
      })
      
      // 更新环境变量状态，保持原有行号和ID
      const updatedVar = { 
        ...envVar, 
        id: existingVar.id, // 确保保持原有ID
        lineNumber: originalLineNumber, 
        isEdited: true 
      }
      
      setEnvVars(prev => 
        prev.map(v => v.id === existingVar.id ? updatedVar : v)
      )
    } else {
      // 添加新环境变量
      const newVar = { 
        ...envVar, 
        id: `${envVar.key}_new_${Date.now()}`,
        isEdited: true 
      }
      
      const newLine = formatEnvVarLine(newVar)
      
      setFileLines(prev => {
        const newLines = [...prev]
        newLines.push(newLine)
        newVar.lineNumber = newLines.length - 1
        return newLines
      })
      
      setEnvVars(prev => 
        [...prev, newVar].sort((a, b) => a.key.localeCompare(b.key))
      )
    }
    
    setSelectedVar(null)
    setHasChanges(true)
    onShowNotification('环境变量已修改（未保存）', 'info')
  }

  const handleDeleteVar = (id: string) => {
    const envVar = envVars.find(v => v.id === id)
    if (!envVar) return

    if (settings.commentOnDelete && envVar.lineNumber !== undefined) {
      // 注释而不是删除
      const newVar = { ...envVar, isCommented: true, isEdited: true }
      setEnvVars(prev => 
        prev.map(v => v.id === id ? newVar : v)
      )
      commentLineInFile(envVar)
      onShowNotification(`已注释环境变量: ${envVar.key}（未保存）`, 'info')
    } else {
      // 完全删除
      setEnvVars(prev => prev.filter(v => v.id !== id))
      if (envVar.lineNumber !== undefined) {
        removeLineFromFile(envVar)
      }
      onShowNotification(`已删除环境变量: ${envVar.key}（未保存）`, 'info')
    }
    
    if (selectedVar && selectedVar.id === id) {
      setSelectedVar(null)
    }
    setHasChanges(true)
  }

  const handleRestoreVar = (id: string) => {
    const envVar = envVars.find(v => v.id === id)
    if (!envVar || !envVar.isCommented) return

    // 取消注释
    const restoredVar = { ...envVar, isCommented: false, isEdited: true }
    setEnvVars(prev => 
      prev.map(v => v.id === id ? restoredVar : v)
    )
    
    // 在文件中取消注释
    if (envVar.lineNumber !== undefined) {
      setFileLines(prev => {
        const newLines = [...prev]
        if (envVar.lineNumber !== undefined && envVar.lineNumber < newLines.length) {
          const line = newLines[envVar.lineNumber]
          if (line.trim().startsWith('#')) {
            // 移除注释符号
            newLines[envVar.lineNumber] = line.replace(/^#\s*/, '')
          }
        }
        return newLines
      })
    }
    
    setHasChanges(true)
    onShowNotification(`已恢复环境变量: ${envVar.key}（未保存）`, 'info')
  }

  const handleAddVar = () => {
    const newVar: EnvVar = {
      key: '',
      value: '',
      source: selectedConfig?.name,
      isEdited: true
    }
    setSelectedVar(newVar)
  }

  const commentLineInFile = (envVar: EnvVar) => {
    if (envVar.lineNumber === undefined) return
    
    setFileLines(prev => {
      const newLines = [...prev]
      if (envVar.lineNumber !== undefined && envVar.lineNumber < newLines.length) {
        const line = newLines[envVar.lineNumber]
        if (!line.trim().startsWith('#')) {
          newLines[envVar.lineNumber] = `# ${line}`
        }
      }
      return newLines
    })
  }

  const removeLineFromFile = (envVar: EnvVar) => {
    if (envVar.lineNumber === undefined) return
    
    setFileLines(prev => {
      const newLines = [...prev]
      if (envVar.lineNumber !== undefined && envVar.lineNumber < newLines.length) {
        newLines.splice(envVar.lineNumber, 1)
        // 更新其他环境变量的行号
        setEnvVars(currentVars => 
          currentVars.map(v => ({
            ...v,
            lineNumber: v.lineNumber !== undefined && v.lineNumber > envVar.lineNumber! 
              ? v.lineNumber - 1 
              : v.lineNumber
          }))
        )
      }
      return newLines
    })
  }

  const formatEnvVarLine = (envVar: EnvVar): string => {
    const { key, value } = envVar
    if (value.includes(' ') || value.includes('"') || value.includes("'") || value.includes('$')) {
      return `export ${key}="${value.replace(/"/g, '\\"')}"`
    }
    return `export ${key}=${value}`
  }

  const handleSaveToFile = async () => {
    if (!selectedConfig) return

    try {
      // 创建备份
      const backupResult = await window.electronAPI.backupShellConfig(selectedConfig.name)
      if (!backupResult.success) {
        onShowNotification(`创建备份失败: ${backupResult.error}`, 'error')
        return
      }

      // 保存文件行
      const result = await window.electronAPI.writeShellConfig(
        selectedConfig.name,
        fileLines
      )

      if (result.success) {
        setHasChanges(false)
        setEnvVars(prev => prev.map(v => ({ ...v, isEdited: false })))
        onShowNotification(`成功保存到 ${selectedConfig.name}`, 'success')
      } else {
        onShowNotification(`保存失败: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('Save error:', error)
      onShowNotification('保存过程中发生错误', 'error')
    }
    setShowSaveDialog(false)
  }

  const filteredVars = envVars.filter(envVar => {
    // 根据设置决定是否显示注释的变量
    if (envVar.isCommented && !settings.showCommentedVars) {
      return false
    }
    
    return envVar.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
           envVar.value.toLowerCase().includes(searchQuery.toLowerCase())
  })

  useEffect(() => {
    loadConfigData()
    setSelectedVar(null)
    setSearchQuery('')
  }, [selectedConfig])

  if (!selectedConfig) {
    return (
      <Box
        sx={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'text.secondary'
        }}
      >
        <Typography variant="h6">
          请选择一个shell配置文件
        </Typography>
      </Box>
    )
  }

  if (!selectedConfig.exists) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" icon={<WarningIcon />}>
          <Typography variant="h6">文件不存在</Typography>
          <Typography>
            配置文件 {selectedConfig.path} 不存在。
            您可以通过添加环境变量并保存来创建此文件。
          </Typography>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleAddVar}
            sx={{ mt: 2 }}
          >
            添加第一个环境变量
          </Button>
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">{selectedConfig.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedConfig.description}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {hasChanges && (
              <Chip label="有未保存的更改" color="warning" size="small" />
            )}
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={() => setShowSaveDialog(true)}
              disabled={!hasChanges}
            >
              保存到文件
            </Button>
          </Box>
        </Box>
      </Box>

      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        <Box sx={{ width: '50%', borderRight: '1px solid', borderColor: 'divider' }}>
          <EnvVarList
            envVars={filteredVars}
            selectedVar={selectedVar}
            onSelectVar={setSelectedVar}
            onDeleteVar={handleDeleteVar}
            onRestoreVar={handleRestoreVar}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={isLoading}
            onAddVar={handleAddVar}
          />
        </Box>

        <Box sx={{ width: '50%' }}>
          <EnvVarEditor
            envVar={selectedVar}
            onSave={handleSaveVar}
            onCancel={() => setSelectedVar(null)}
          />
        </Box>
      </Box>

      <Dialog open={showSaveDialog} onClose={() => setShowSaveDialog(false)}>
        <DialogTitle>保存到配置文件</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography>
              即将保存 {envVars.length} 个环境变量到 {selectedConfig.name}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              原文件将自动备份，确认要继续吗？
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSaveDialog(false)}>取消</Button>
          <Button onClick={handleSaveToFile} variant="contained" autoFocus>
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ShellConfigManager