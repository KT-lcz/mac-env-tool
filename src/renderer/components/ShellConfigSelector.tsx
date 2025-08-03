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
  Alert
} from '@mui/material'
import {
  Terminal as TerminalIcon,
  Settings as SettingsIcon,
  Backup as BackupIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material'
import { ShellConfig } from '../types'

interface ShellConfigSelectorProps {
  onSelectConfig: (config: ShellConfig) => void
  selectedConfig: ShellConfig | null
}

const ShellConfigSelector: React.FC<ShellConfigSelectorProps> = ({
  onSelectConfig,
  selectedConfig
}) => {
  const [configs, setConfigs] = useState<ShellConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
        console.log(`Backup created: ${result.backupPath}`)
      }
    } catch (error) {
      console.error('Backup failed:', error)
    }
  }

  const getConfigIcon = (config: ShellConfig) => {
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
        <Typography variant="h6">Shell 配置文件</Typography>
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
                  <Tooltip title="创建备份">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleBackup(e, config)}
                    >
                      <BackupIcon />
                    </IconButton>
                  </Tooltip>
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
    </Box>
  )
}

export default ShellConfigSelector