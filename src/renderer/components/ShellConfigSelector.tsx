import React, { useState, useEffect } from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
  Tooltip,
  Divider,
  Alert,
  Button,
  Menu,
  MenuItem
} from '@mui/material'
import {
  Terminal as TerminalIcon,
  Settings as SettingsIcon,
  Backup as BackupIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material'
import { ShellConfig } from '../types'
import AddConfigDialog from './AddConfigDialog'

interface ShellConfigSelectorProps {
  onSelectConfig: (config: ShellConfig) => void
  selectedConfig: ShellConfig | null
  onShowNotification: (message: string, severity: 'success' | 'error' | 'info') => void
}

const ShellConfigSelector: React.FC<ShellConfigSelectorProps> = ({
  onSelectConfig,
  selectedConfig,
  onShowNotification
}) => {
  const [configs, setConfigs] = useState<ShellConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [selectedConfigForMenu, setSelectedConfigForMenu] = useState<ShellConfig | null>(null)

  const loadConfigs = async () => {
    setIsLoading(true)
    try {
      const shellConfigs = await window.electronAPI.getShellConfigs()
      setConfigs(shellConfigs)
    } catch (error) {
      console.error('Failed to load shell configs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackup = async (event: React.MouseEvent, config: ShellConfig) => {
    event.stopPropagation()
    try {
      const result = await window.electronAPI.backupShellConfig(config.name)
      if (result.success) {
        onShowNotification(`备份已创建: ${result.backupPath}`, 'success')
      } else {
        onShowNotification(result.error || '备份失败', 'error')
      }
    } catch (error) {
      console.error('Backup failed:', error)
      onShowNotification('备份失败', 'error')
    }
  }

  const handleAddConfig = async (path: string, name: string, description: string) => {
    try {
      const result = await window.electronAPI.addCustomShellConfig(path, name, description)
      if (result.success) {
        onShowNotification('自定义配置已添加', 'success')
        loadConfigs()
      } else {
        onShowNotification(result.error || '添加配置失败', 'error')
      }
    } catch (error) {
      console.error('Add config failed:', error)
      onShowNotification('添加配置失败', 'error')
    }
  }

  const handleRemoveConfig = async (config: ShellConfig) => {
    if (!config.isCustom) {
      onShowNotification('无法删除内置配置文件', 'error')
      return
    }

    try {
      const result = await window.electronAPI.removeCustomShellConfig(config.name)
      if (result.success) {
        onShowNotification('自定义配置已移除', 'success')
        if (selectedConfig?.name === config.name) {
          onSelectConfig(configs.find(c => !c.isCustom) || configs[0])
        }
        loadConfigs()
      } else {
        onShowNotification(result.error || '移除配置失败', 'error')
      }
    } catch (error) {
      console.error('Remove config failed:', error)
      onShowNotification('移除配置失败', 'error')
    }
    setMenuAnchor(null)
  }

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, config: ShellConfig) => {
    event.stopPropagation()
    setMenuAnchor(event.currentTarget)
    setSelectedConfigForMenu(config)
  }

  const handleMenuClose = () => {
    setMenuAnchor(null)
    setSelectedConfigForMenu(null)
  }

  const getConfigIcon = (config: ShellConfig) => {
    if (config.isCustom) return <TerminalIcon />
    if (config.name === '.zshrc') return <TerminalIcon />
    if (config.name === '.zprofile') return <SettingsIcon />
    if (config.name === '.zshenv') return <SettingsIcon />
    return <TerminalIcon />
  }

  useEffect(() => {
    loadConfigs()
  }, [])

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography>加载配置文件...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6">Shell 配置文件</Typography>
          <Button
            startIcon={<AddIcon />}
            size="small"
            onClick={() => setAddDialogOpen(true)}
          >
            添加
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          选择要管理的配置文件
        </Typography>
      </Box>

      <Alert severity="info" sx={{ m: 2 }}>
        修改配置文件前会自动创建备份，建议先备份重要文件
      </Alert>

      <List sx={{ flexGrow: 1, overflow: 'auto', py: 0 }}>
        {configs.map((config) => (
          <React.Fragment key={config.name}>
            <ListItem
              button
              selected={selectedConfig?.name === config.name}
              onClick={() => onSelectConfig(config)}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  color: 'primary.contrastText',
                  '&:hover': {
                    backgroundColor: 'primary.main',
                  }
                }
              }}
            >
              <ListItemIcon>
                {getConfigIcon(config)}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontFamily: 'monospace' }}>
                      {config.name}
                    </Typography>
                    {config.isCustom && (
                      <Chip
                        label="自定义"
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    )}
                    {config.exists ? (
                      <Chip
                        icon={<CheckIcon />}
                        label="存在"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        icon={<ErrorIcon />}
                        label="不存在"
                        size="small"
                        color="error"
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    {config.description}
                  </Typography>
                }
              />
              {config.exists && (
                <ListItemSecondaryAction>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="创建备份">
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => handleBackup(e, config)}
                      >
                        <BackupIcon />
                      </IconButton>
                    </Tooltip>
                    {config.isCustom && (
                      <Tooltip title="更多选项">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => handleMenuOpen(e, config)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </ListItemSecondaryAction>
              )}
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          提示: 点击文件名选择配置文件，点击备份图标创建备份
        </Typography>
      </Box>

      <AddConfigDialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        onAddConfig={handleAddConfig}
      />

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedConfigForMenu && handleRemoveConfig(selectedConfigForMenu)}>
          <DeleteIcon sx={{ mr: 1 }} />
          删除配置
        </MenuItem>
      </Menu>
    </Box>
  )
}

export default ShellConfigSelector