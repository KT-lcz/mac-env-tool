import React from 'react'
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  TextField,
  Typography,
  Chip,
  CircularProgress,
  InputAdornment,
  Button
} from '@mui/material'
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material'
import { EnvVar } from '../types'

interface EnvVarListProps {
  envVars: EnvVar[]
  selectedVar: EnvVar | null
  onSelectVar: (envVar: EnvVar) => void
  onDeleteVar: (key: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  isLoading: boolean
  onAddVar: () => void
}

const EnvVarList: React.FC<EnvVarListProps> = ({
  envVars,
  selectedVar,
  onSelectVar,
  onDeleteVar,
  searchQuery,
  onSearchChange,
  isLoading,
  onAddVar
}) => {
  const handleDeleteClick = (event: React.MouseEvent, key: string) => {
    event.stopPropagation()
    onDeleteVar(key)
  }

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="搜索环境变量..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            共 {envVars.length} 个环境变量
          </Typography>
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddVar}
            variant="outlined"
          >
            添加
          </Button>
        </Box>
      </Box>

      <List sx={{ flexGrow: 1, overflow: 'auto', py: 0 }}>
        {envVars.map((envVar) => (
          <ListItem
            key={envVar.key}
            button
            selected={selectedVar?.key === envVar.key}
            onClick={() => onSelectVar(envVar)}
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': { borderBottom: 'none' }
            }}
          >
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle2" noWrap sx={{ fontFamily: 'monospace' }}>
                    {envVar.key}
                  </Typography>
                  {envVar.source && (
                    <Chip
                      label={envVar.source}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: '20px' }}
                    />
                  )}
                  {envVar.isEdited && (
                    <Chip
                      label="已修改"
                      size="small"
                      color="warning"
                      sx={{ fontSize: '0.7rem', height: '20px' }}
                    />
                  )}
                </Box>
              }
              secondary={
                <Typography
                  variant="body2"
                  color="text.secondary"
                  noWrap
                  sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                >
                  {envVar.value}
                </Typography>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                size="small"
                onClick={(e) => handleDeleteClick(e, envVar.key)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
    </Box>
  )
}

export default EnvVarList