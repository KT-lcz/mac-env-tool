import React, { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper,
  Snackbar,
  Alert,
} from '@mui/material'
import ShellConfigSelector from './components/ShellConfigSelector'
import ShellConfigManager from './components/ShellConfigManager'
import { ShellConfig } from './types'

function App() {
  const [selectedShellConfig, setSelectedShellConfig] = useState<ShellConfig | null>(null)
  const [notification, setNotification] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info'
  }>({ open: false, message: '', severity: 'info' })

  const showNotification = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ open: true, message, severity })
  }

  return (
    <Box sx={{ flexGrow: 1, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Shell环境变量管理器
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}>
        <Paper
          sx={{
            width: '30%',
            height: '100%',
            borderRadius: 0,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <ShellConfigSelector
            onSelectConfig={setSelectedShellConfig}
            selectedConfig={selectedShellConfig}
          />
        </Paper>

        <Paper
          sx={{
            width: '70%',
            height: '100%',
            borderRadius: 0,
            borderLeft: '1px solid',
            borderColor: 'divider'
          }}
        >
          <ShellConfigManager
            selectedConfig={selectedShellConfig}
            onShowNotification={showNotification}
          />
        </Paper>
      </Box>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default App