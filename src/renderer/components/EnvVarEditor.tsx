import React, { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  Alert
} from '@mui/material'
import {
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material'
import { EnvVar } from '../types'

interface EnvVarEditorProps {
  envVar: EnvVar | null
  onSave: (envVar: EnvVar) => void
  onCancel: () => void
}

const EnvVarEditor: React.FC<EnvVarEditorProps> = ({
  envVar,
  onSave,
  onCancel
}) => {
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (envVar) {
      setKey(envVar.key)
      setValue(envVar.value)
      setError('')
    } else {
      setKey('')
      setValue('')
      setError('')
    }
  }, [envVar])

  const handleSave = () => {
    if (!key.trim()) {
      setError('环境变量名称不能为空')
      return
    }

    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
      setError('环境变量名称只能包含字母、数字和下划线，且不能以数字开头')
      return
    }

    onSave({
      key: key.trim(),
      value: value,
      source: envVar?.source || 'custom',
      isEdited: true
    })
  }

  const handleCancel = () => {
    setKey('')
    setValue('')
    setError('')
    onCancel()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && event.ctrlKey) {
      handleSave()
    } else if (event.key === 'Escape') {
      handleCancel()
    }
  }

  if (!envVar) {
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
          选择一个环境变量进行编辑
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6">
          {envVar.key ? '编辑环境变量' : '添加新环境变量'}
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Stack spacing={3}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <TextField
            label="变量名称"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            required
            error={!!error}
            helperText="环境变量名称，如: PATH, NODE_ENV"
            sx={{ fontFamily: 'monospace' }}
          />

          <TextField
            label="变量值"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            multiline
            rows={4}
            helperText="环境变量的值"
            sx={{ fontFamily: 'monospace' }}
          />

          {envVar.source && (
            <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
              <Typography variant="body2" color="text.secondary">
                <strong>来源:</strong> {envVar.source}
              </Typography>
            </Paper>
          )}

          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={!key.trim()}
            >
              保存 (Ctrl+Enter)
            </Button>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
            >
              取消 (Esc)
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary">
            提示: 使用 Ctrl+Enter 快速保存，Esc 取消编辑
          </Typography>
        </Stack>
      </Box>
    </Box>
  )
}

export default EnvVarEditor