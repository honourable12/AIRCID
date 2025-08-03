import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  IconButton,
  Typography,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Study } from '@/types';
import { StudyService } from '@/services/studyService';

const StudyList: React.FC = () => {
  const navigate = useNavigate();
  const [studies, setStudies] = useState<Study[]>([]);
  const [filteredStudies, setFilteredStudies] = useState<Study[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedStudy, setSelectedStudy] = useState<Study | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Load studies from database
  const loadStudies = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Loading studies from database...');
      
      const response = await StudyService.getStudies(page + 1, rowsPerPage);
      console.log('Studies response:', response);
      
      if (response.success && response.data) {
        setStudies(response.data);
        setFilteredStudies(response.data);
        setTotalCount(response.totalCount || response.data.length);
      } else {
        console.error('Failed to load studies:', response.message);
        setError(response.message || 'Failed to load studies');
        setStudies([]);
        setFilteredStudies([]);
      }
    } catch (error) {
      console.error('Error loading studies:', error);
      setError(error instanceof Error ? error.message : 'Failed to load studies');
      setStudies([]);
      setFilteredStudies([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudies();
  }, [page, rowsPerPage]);

  useEffect(() => {
    const filtered = studies.filter(
      (study) =>
        study.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (study.description && study.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (study.principalInvestigator && study.principalInvestigator.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredStudies(filtered);
    if (page > 0) setPage(0); // Reset to first page when searching
  }, [searchTerm, studies]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, study: Study) => {
    setAnchorEl(event.currentTarget);
    setSelectedStudy(study);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedStudy(null);
  };

  const handleDelete = async () => {
    if (selectedStudy) {
      try {
        console.log('Deleting study:', selectedStudy.id);
        const response = await StudyService.deleteStudy(selectedStudy.id);
        
        if (response.success) {
          // Reload studies after successful deletion
          await loadStudies();
          setDeleteDialogOpen(false);
          handleMenuClose();
        } else {
          console.error('Failed to delete study:', response.message);
          alert('Failed to delete study: ' + response.message);
        }
      } catch (error) {
        console.error('Error deleting study:', error);
        alert('Error deleting study: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'warning';
      case 'completed':
        return 'info';
      case 'paused':
        return 'secondary';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Research Studies
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/studies/create')}
          size="large"
        >
          Create New Study
        </Button>
      </Box>

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search studies..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="studies table">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created By</TableCell>
              <TableCell>Enrollment</TableCell>
              <TableCell>Created Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudies
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((study) => (
                <TableRow
                  key={study.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    <Box>
                      <Typography variant="subtitle2" component="div">
                        {study.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {study.description}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={study.status}
                      color={getStatusColor(study.status) as any}
                      size="small"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </TableCell>
                  <TableCell>{study.principalInvestigator || 'N/A'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PeopleIcon fontSize="small" />
                      {study.enrollmentCount || 0}/{study.targetEnrollment || 'N/A'}
                    </Box>
                  </TableCell>
                  <TableCell>{formatDate(study.createdAt)}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, study)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={searchTerm ? filteredStudies.length : totalCount}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
        </>
      )}

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (selectedStudy) {
              navigate(`/studies/${selectedStudy.id}`);
              handleMenuClose();
            }
          }}
        >
          <VisibilityIcon sx={{ mr: 1 }} fontSize="small" />
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedStudy) {
              navigate(`/studies/${selectedStudy.id}/matches`);
              handleMenuClose();
            }
          }}
        >
          <PeopleIcon sx={{ mr: 1 }} fontSize="small" />
          Patient Matches
        </MenuItem>
        <MenuItem
          onClick={() => {
            // Navigate to edit page
            handleMenuClose();
          }}
        >
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          Edit Study
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialogOpen(true);
            handleMenuClose();
          }}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          Delete Study
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Study</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{selectedStudy?.title}"? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudyList;
