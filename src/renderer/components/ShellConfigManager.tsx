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
import { EnvVar, ShellConfig, ShellConfigData } from '../types'
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
  const [nonEnvLines, setNonEnvLines] = useState<string[]>([])
  const [hasChanges, setHasChanges] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)

  const loadConfigData = async () => {
    if (!selectedConfig || !selectedConfig.exists) {
      setEnvVars([])
      setNonEnvLines([])
      return
    }

    setIsLoading(true)
    try {
      const result = await window.electronAPI.readShellConfig(selectedConfig.name)
      if (result.success && result.envVars) {
        const vars: EnvVar[] = Object.entries(result.envVars).map(([key, value]) => ({
          key,
          value,
          source: selectedConfig.name
        }))
        setEnvVars(vars.sort((a, b) => a.key.localeCompare(b.key)))
        setNonEnvLines(result.nonEnvLines || [])
        setHasChanges(false)
      } else {
        onShowNotification(`读取配置文件失败: ${result.error}`, 'error')
      }
    } catch (error) {
      console.error('Error loading config data:', error)
      onShowNotification('读取配置文件时发生错误', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveVar = (envVar: EnvVar) => {
    if (!envVar.key.trim()) return

    setEnvVars(prev => {
      const existingIndex = prev.findIndex(v => v.key === envVar.key)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = { ...envVar, isEdited: true }
        return updated
      } else {
        return [...prev, { ...envVar, isEdited: true }].sort((a, b) => a.key.localeCompare(b.key))
      }
    })
    setSelectedVar(null)
    setHasChanges(true)
    onShowNotification('环境变量已修改（未保存）', 'info')
  }

  const handleDeleteVar = (key: string) => {
    setEnvVars(prev => prev.filter(v => v.key !== key))
    if (selectedVar && selectedVar.key === key) {
      setSelectedVar(null)
    }
    setHasChanges(true)
    onShowNotification(`已删除环境变量: ${key}（未保存）`, 'info')
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

  const handleSaveToFile = async () => {
    if (!selectedConfig) return

    try {
      // 创建备份
      const backupResult = await window.electronAPI.backupShellConfig(selectedConfig.name)
      if (!backupResult.success) {
        onShowNotification(`创建备份失败: ${backupResult.error}`, 'error')
        return
      }

      // 保存到文件
      const envVarsObject = envVars.reduce((acc, env) => {
        acc[env.key] = env.value
        return acc
      }, {} as Record<string, string>)

      const result = await window.electronAPI.writeShellConfig(
        selectedConfig.name,
        envVarsObject,
        nonEnvLines
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

  const filteredVars = envVars.filter(envVar =>
    envVar.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
    envVar.value.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            isLoading={isLoading}
            showAddButton={true}
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