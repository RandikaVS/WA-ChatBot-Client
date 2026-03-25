'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box, Stack, Typography, Button, TextField, Paper, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, MenuItem,
  Select, FormControl, InputLabel, InputAdornment, Tooltip, Alert,
  CircularProgress, Skeleton, TablePagination, Divider, Switch,
  FormControlLabel, alpha,
} from '@mui/material';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconUpload,
  IconPackage, IconX, IconCheck, IconDownload, IconRefresh,
  IconFilter, IconCurrencyDollar, IconBox, IconTag,
} from '@tabler/icons-react';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Product {
  id: string;
  tenant_id: string;
  name: string;
  sku: string | null;
  description: string | null;
  category: string | null;
  price: number | null;
  currency: string;
  stock_quantity: number;
  is_available: boolean;
  sizes_available: string | null;
  colors_available: string | null;
  updated_at: string;
}

interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  category: string;
  price: string;
  currency: string;
  stock_quantity: string;
  is_available: boolean;
  sizes_available: string;
  colors_available: string;
}

const EMPTY_FORM: ProductFormData = {
  name: '', sku: '', description: '', category: '',
  price: '', currency: 'LKR', stock_quantity: '0',
  is_available: true, sizes_available: '', colors_available: '',
};

const CURRENCIES = ['LKR', 'USD', 'EUR', 'GBP', 'AUD', 'SGD'];

const CATEGORIES = [
  'Sneakers', 'Formal', 'Sandals', 'Sports', 'Casual',
  'Kids', 'Accessories', 'Electronics', 'Clothing', 'Other',
];

// ─── API Service ─────────────────────────────────────────────────────────────
// All API calls centralized here — easy to update if endpoints change

const ProductAPI = {
  list: () =>
    axios.get('https://bizassist-meta-service-872504844378.us-west2.run.app/api/products/list'),

  create: (data: Partial<Product>) =>
    axios.post('https://bizassist-meta-service-872504844378.us-west2.run.app/api/products/add', data),

  update: (id: string, data: Partial<Product>) =>
    axios.put(`https://bizassist-meta-service-872504844378.us-west2.run.app/api/products/${id}`, data),

  delete: (id: string) =>
    axios.delete(`https://bizassist-meta-service-872504844378.us-west2.run.app/api/products/${id}`),

  uploadCSV: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return axios.post('https://bizassist-meta-service-872504844378.us-west2.run.app/api/products/upload-csv', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  downloadTemplate: () =>
    axios.get('https://bizassist-meta-service-872504844378.us-west2.run.app/api/products/csv-template', { responseType: 'blob' }),
};

// ─── Stat Cards ──────────────────────────────────────────────────────────────

const StatCards = ({ products }: { products: Product[] }) => {
  const total     = products.length;
  const available = products.filter(p => p.is_available).length;
  const outOfStock = products.filter(p => p.stock_quantity === 0).length;
  const totalValue = products.reduce((s, p) => s + (p.price || 0) * p.stock_quantity, 0);

  const stats = [
    { label: 'Total Products',  value: total,                      color: '#3b82f6', icon: <IconPackage size={18} /> },
    { label: 'Available',       value: available,                  color: '#22c55e', icon: <IconCheck size={18} /> },
    { label: 'Out of Stock',    value: outOfStock,                 color: '#ef4444', icon: <IconBox size={18} /> },
    { label: 'Catalog Value',   value: `LKR ${totalValue.toLocaleString()}`, color: '#f59e0b', icon: <IconCurrencyDollar size={18} /> },
  ];

  return (
    <Stack direction="row" gap={2} mb={3} sx={{ overflowX: 'auto' }}>
      {stats.map((s, i) => (
        <Paper key={i} elevation={0} sx={{
          p: 2, minWidth: 150, flex: 1,
          border: '1px solid', borderColor: 'divider',
          borderTop: '3px solid', borderTopColor: s.color,
          borderRadius: 3,
        }}>
          <Box sx={{ color: s.color, mb: 1 }}>{s.icon}</Box>
          <Typography fontWeight={700} fontSize={22} lineHeight={1}>{s.value}</Typography>
          <Typography variant="caption" color="text.secondary" fontSize={11}>{s.label}</Typography>
        </Paper>
      ))}
    </Stack>
  );
};

// ─── Product Form Dialog ──────────────────────────────────────────────────────

const ProductFormDialog = ({
  open, onClose, onSave, product, saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: ProductFormData) => Promise<void>;
  product: Product | null;
  saving: boolean;
}) => {
  const [form, setForm] = useState<ProductFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<ProductFormData>>({});
  const isEdit = !!product;

  // Populate form when editing
  useEffect(() => {
    if (product) {
      setForm({
        name:             product.name             || '',
        sku:              product.sku              || '',
        description:      product.description      || '',
        category:         product.category         || '',
        price:            product.price?.toString() || '',
        currency:         product.currency         || 'LKR',
        stock_quantity:   product.stock_quantity?.toString() || '0',
        is_available:     product.is_available,
        sizes_available:  product.sizes_available  || '',
        colors_available: product.colors_available || '',
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
  }, [product, open]);

  const update = (key: keyof ProductFormData, val: any) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const e: Partial<ProductFormData> = {};
    if (!form.name.trim())              e.name = 'Product name is required';
    if (form.price && isNaN(+form.price)) e.price = 'Price must be a number';
    if (isNaN(+form.stock_quantity))    e.stock_quantity = 'Must be a number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    await onSave(form);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" gap={1.5}>
            <Box sx={{ p: 1, bgcolor: 'primary.main', borderRadius: 2, color: 'white', display: 'flex' }}>
              <IconPackage size={18} />
            </Box>
            <Typography fontWeight={700} fontSize={16}>
              {isEdit ? 'Edit Product' : 'Add New Product'}
            </Typography>
          </Stack>
          <IconButton size="small" onClick={onClose}><IconX size={16} /></IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        <Grid container spacing={2}>

          {/* Name */}
          <Grid size={{xs:12}}>
            <TextField
              label="Product Name *"
              fullWidth size="small"
              value={form.name}
              onChange={e => update('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              placeholder="e.g. Nike Air Max 270"
            />
          </Grid>

          {/* SKU + Category */}
          <Grid size={{xs:6}}>
            <TextField
              label="SKU"
              fullWidth size="small"
              value={form.sku}
              onChange={e => update('sku', e.target.value)}
              placeholder="NK-AM270-BLK"
              InputProps={{
                startAdornment: <InputAdornment position="start"><IconTag size={14} /></InputAdornment>
              }}
            />
          </Grid>
          <Grid size={{xs:6}}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select value={form.category} label="Category"
                onChange={e => update('category', e.target.value)}>
                <MenuItem value=""><em>None</em></MenuItem>
                {CATEGORIES.map(c => <MenuItem key={c} value={c.toLowerCase()}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Price + Currency */}
          <Grid size={{xs:6}}>
            <TextField
              label="Price"
              fullWidth size="small"
              value={form.price}
              onChange={e => update('price', e.target.value)}
              error={!!errors.price}
              helperText={errors.price}
              placeholder="1500.00"
              InputProps={{
                startAdornment: <InputAdornment position="start"><IconCurrencyDollar size={14} /></InputAdornment>
              }}
            />
          </Grid>
          <Grid size={{xs:6}}>
            <FormControl fullWidth size="small">
              <InputLabel>Currency</InputLabel>
              <Select value={form.currency} label="Currency"
                onChange={e => update('currency', e.target.value)}>
                {CURRENCIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Stock + Availability */}
          <Grid size={{xs:6}}>
            <TextField
              label="Stock Quantity"
              fullWidth size="small"
              value={form.stock_quantity}
              onChange={e => update('stock_quantity', e.target.value)}
              error={!!errors.stock_quantity}
              helperText={errors.stock_quantity}
              placeholder="0"
            />
          </Grid>
          <Grid size={{xs:6}} sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.is_available}
                  onChange={e => update('is_available', e.target.checked)}
                  color="success"
                />
              }
              label={
                <Typography fontSize={13} fontWeight={500}>
                  {form.is_available ? 'Available' : 'Unavailable'}
                </Typography>
              }
            />
          </Grid>

          {/* Sizes */}
          <Grid size={{xs:6}}>
            <TextField
              label="Sizes Available"
              fullWidth size="small"
              value={form.sizes_available}
              onChange={e => update('sizes_available', e.target.value)}
              placeholder="36,38,40,42,44"
              helperText="Comma separated — e.g. 36,38,40,42"
            />
          </Grid>

          {/* Colors */}
          <Grid size={{xs:6}}>
            <TextField
              label="Colors Available"
              fullWidth size="small"
              value={form.colors_available}
              onChange={e => update('colors_available', e.target.value)}
              placeholder="Black,White,Red"
              helperText="Comma separated — e.g. Black,White,Blue"
            />
          </Grid>

          {/* Description */}
          <Grid size={{xs:6}}>
            <TextField
              label="Description"
              fullWidth size="small"
              multiline rows={3}
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="Brief product description..."
            />
          </Grid>

        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <IconCheck size={16} />}
          sx={{ borderRadius: 2, minWidth: 120 }}
        >
          {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Product'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

const DeleteDialog = ({
  open, product, onClose, onConfirm, deleting,
}: {
  open: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  deleting: boolean;
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
    PaperProps={{ sx: { borderRadius: 3 } }}>
    <DialogTitle>
      <Typography fontWeight={700}>Delete Product</Typography>
    </DialogTitle>
    <DialogContent>
      <Alert severity="error" sx={{ mb: 2 }}>
        This action cannot be undone.
      </Alert>
      <Typography fontSize={14} color="text.secondary">
        Are you sure you want to delete{' '}
        <strong style={{ color: 'inherit' }}>{product?.name}</strong>?
        This will remove it from your catalog and the AI will no longer
        mention it to customers.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
      <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        color="error"
        disabled={deleting}
        startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : <IconTrash size={16} />}
        sx={{ borderRadius: 2 }}
      >
        {deleting ? 'Deleting...' : 'Delete'}
      </Button>
    </DialogActions>
  </Dialog>
);

// ─── CSV Upload Dialog ────────────────────────────────────────────────────────

const CSVUploadDialog = ({
  open, onClose, onUpload,
}: {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}) => {
  const [file, setFile]         = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult]     = useState<{ added: number; errors: string[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
      setResult({ added: 0, errors: [] }); // real result comes from parent
      setFile(null);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight={700}>Import Products via CSV</Typography>
          <IconButton size="small" onClick={handleClose}><IconX size={16} /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Alert severity="info" sx={{ mb: 2, fontSize: 12 }}>
          CSV must have these columns:<br />
          <strong>name, sku, description, category, price, currency, stock_quantity, sizes_available, colors_available</strong>
        </Alert>

        {/* Drop zone */}
        <Box
          onClick={() => inputRef.current?.click()}
          sx={{
            border: '2px dashed',
            borderColor: file ? 'success.main' : 'divider',
            borderRadius: 3, p: 4, textAlign: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
            bgcolor: file ? alpha('#22c55e', 0.05) : 'action.hover',
            '&:hover': { borderColor: 'primary.main', bgcolor: alpha('#3b82f6', 0.05) },
          }}
        >
          <input
            ref={inputRef} type="file" accept=".csv" hidden
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          {file ? (
            <Stack alignItems="center" gap={1}>
              <IconCheck size={32} color="#22c55e" />
              <Typography fontWeight={600} fontSize={14}>{file.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {(file.size / 1024).toFixed(1)} KB — click to change
              </Typography>
            </Stack>
          ) : (
            <Stack alignItems="center" gap={1}>
              <IconUpload size={32} strokeWidth={1.5} color="gray" />
              <Typography fontWeight={500} fontSize={14}>Click to select CSV file</Typography>
              <Typography variant="caption" color="text.secondary">
                or drag and drop here
              </Typography>
            </Stack>
          )}
        </Box>

        {/* Template download */}
        <Stack direction="row" alignItems="center" justifyContent="center" mt={2}>
          <Typography variant="caption" color="text.secondary">
            Don't have a CSV?{' '}
          </Typography>
          <Button
            size="small" variant="text"
            startIcon={<IconDownload size={13} />}
            sx={{ fontSize: 12, ml: 0.5 }}
            onClick={async () => {
              const res = await ProductAPI.downloadTemplate();
              const url = URL.createObjectURL(new Blob([res.data]));
              const a   = document.createElement('a');
              a.href    = url;
              a.download = 'product_template.csv';
              a.click();
            }}
          >
            Download template
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} variant="outlined" sx={{ borderRadius: 2 }}>Cancel</Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!file || uploading}
          startIcon={uploading ? <CircularProgress size={14} color="inherit" /> : <IconUpload size={16} />}
          sx={{ borderRadius: 2 }}
        >
          {uploading ? 'Uploading...' : 'Import Products'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Products Page ───────────────────────────────────────────────────────

const ProductsPage = () => {
  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterAvail, setFilterAvail] = useState('all');
  const [page, setPage]           = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog state
  const [formOpen, setFormOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [csvOpen, setCSVOpen]     = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);

  // Operation state
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [toast, setToast]         = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // ── Fetch products ──────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ProductAPI.list();
      setProducts(res.data.products || []);
    } catch {
      showToast('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Filter logic ────────────────────────────────────────────
  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase());
    const matchCat   = filterCat   === 'all' || p.category === filterCat;
    const matchAvail = filterAvail === 'all' ||
      (filterAvail === 'available'   &&  p.is_available) ||
      (filterAvail === 'unavailable' && !p.is_available) ||
      (filterAvail === 'outofstock'  &&  p.stock_quantity === 0);
    return matchSearch && matchCat && matchAvail;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // ── CRUD operations ─────────────────────────────────────────

  const handleSave = async (formData: ProductFormData) => {
    setSaving(true);
    try {
      const payload = {
        name:             formData.name.trim(),
        sku:              formData.sku.trim()              || null,
        description:      formData.description.trim()      || null,
        category:         formData.category.trim()         || null,
        price:            formData.price ? +formData.price : null,
        currency:         formData.currency,
        stock_quantity:   +formData.stock_quantity,
        is_available:     formData.is_available,
        sizes_available:  formData.sizes_available.trim()  || null,
        colors_available: formData.colors_available.trim() || null,
      };

      if (editProduct) {
        await ProductAPI.update(editProduct.id, payload);
        showToast(`"${payload.name}" updated successfully`, 'success');
      } else {
        await ProductAPI.create(payload);
        showToast(`"${payload.name}" added to catalog`, 'success');
      }

      setFormOpen(false);
      setEditProduct(null);
      await fetchProducts();
    } catch {
      showToast('Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      await ProductAPI.delete(deleteProduct.id);
      showToast(`"${deleteProduct.name}" deleted`, 'success');
      setDeleteOpen(false);
      setDeleteProduct(null);
      await fetchProducts();
    } catch {
      showToast('Failed to delete product', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleCSVUpload = async (file: File) => {
    const res = await ProductAPI.uploadCSV(file);
    const { products_added, errors } = res.data;
    showToast(`${products_added} products imported successfully`, 'success');
    setCSVOpen(false);
    await fetchProducts();
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setFormOpen(true);
  };

  const openDelete = (p: Product) => {
    setDeleteProduct(p);
    setDeleteOpen(true);
  };

  const openAdd = () => {
    setEditProduct(null);
    setFormOpen(true);
  };

  // ── Unique categories for filter ────────────────────────────
  const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];

  return (
    <PageContainer title="Products" description="Manage your product catalog">

      {/* Toast notification */}
      {toast && (
        <Alert
          severity={toast.type}
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setToast(null)}
        >
          {toast.msg}
        </Alert>
      )}

      {/* Page header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700}
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconPackage size={26} />
            Products
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage your catalog — the AI reads this to answer customer questions
          </Typography>
        </Box>

        <Stack direction="row" gap={1.5}>
          <Button
            variant="outlined"
            startIcon={<IconUpload size={16} />}
            onClick={() => setCSVOpen(true)}
            sx={{ borderRadius: 2.5 }}
          >
            Import CSV
          </Button>
          <Button
            variant="outlined"
            startIcon={<IconRefresh size={16} />}
            onClick={fetchProducts}
            sx={{ borderRadius: 2.5, minWidth: 0, px: 2 }}
          />
          <Button
            variant="contained"
            startIcon={<IconPlus size={16} />}
            onClick={openAdd}
            sx={{ borderRadius: 2.5, fontWeight: 600 }}
          >
            Add Product
          </Button>
        </Stack>
      </Stack>

      {/* Stat cards */}
      {!loading && <StatCards products={products} />}

      {/* Table card */}
      <DashboardCard title="">
        {/* Search + filters */}
        <Stack direction="row" gap={2} mb={2.5} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search by name, SKU, category..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>,
              endAdornment: search ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setSearch('')}><IconX size={14} /></IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{ width: 280, '& fieldset': { borderRadius: 2.5 } }}
          />

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select value={filterCat} onChange={e => { setFilterCat(e.target.value); setPage(0); }}
              displayEmpty sx={{ borderRadius: 2.5 }}>
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select value={filterAvail} onChange={e => { setFilterAvail(e.target.value); setPage(0); }}
              displayEmpty sx={{ borderRadius: 2.5 }}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="unavailable">Unavailable</MenuItem>
              <MenuItem value="outofstock">Out of Stock</MenuItem>
            </Select>
          </FormControl>

          <Typography variant="caption" color="text.secondary"
            sx={{ ml: 'auto', alignSelf: 'center', fontSize: 12 }}>
            {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            {(search || filterCat !== 'all' || filterAvail !== 'all') && ' (filtered)'}
          </Typography>
        </Stack>

        {/* Table */}
        <TableContainer component={Paper} elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Sizes / Colors', 'Status', 'Actions']
                  .map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, py: 1.5 }}>{h}</TableCell>
                  ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton height={20} /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Stack alignItems="center" gap={1.5} sx={{ opacity: 0.5 }}>
                      <IconPackage size={40} strokeWidth={1} />
                      <Typography color="text.secondary" fontSize={14}>
                        {search || filterCat !== 'all' || filterAvail !== 'all'
                          ? 'No products match your filters'
                          : 'No products yet — add your first product or import a CSV'}
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map(product => (
                  <TableRow key={product.id} hover
                    sx={{ '&:last-child td': { border: 0 } }}>

                    {/* Product name + description */}
                    <TableCell sx={{ maxWidth: 220 }}>
                      <Typography fontWeight={600} fontSize={13} noWrap>
                        {product.name}
                      </Typography>
                      {product.description && (
                        <Typography variant="caption" color="text.secondary" noWrap
                          display="block" sx={{ maxWidth: 200 }}>
                          {product.description}
                        </Typography>
                      )}
                    </TableCell>

                    {/* SKU */}
                    <TableCell>
                      <Typography fontSize={12} fontFamily="monospace"
                        color="text.secondary">
                        {product.sku || '—'}
                      </Typography>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      {product.category ? (
                        <Chip label={product.category} size="small"
                          sx={{ fontSize: 11, height: 20, textTransform: 'capitalize' }} />
                      ) : '—'}
                    </TableCell>

                    {/* Price */}
                    <TableCell>
                      {product.price != null ? (
                        <Typography fontSize={13} fontWeight={600}>
                          {product.currency} {product.price.toLocaleString()}
                        </Typography>
                      ) : '—'}
                    </TableCell>

                    {/* Stock */}
                    <TableCell>
                      <Typography fontSize={13} fontWeight={600}
                        color={
                          product.stock_quantity === 0 ? 'error.main' :
                          product.stock_quantity <= 5 ? 'warning.main' : 'text.primary'
                        }>
                        {product.stock_quantity}
                        {product.stock_quantity <= 5 && product.stock_quantity > 0 && (
                          <Typography component="span" fontSize={10} color="warning.main"> low</Typography>
                        )}
                      </Typography>
                    </TableCell>

                    {/* Sizes / Colors */}
                    <TableCell sx={{ maxWidth: 160 }}>
                      <Stack gap={0.5}>
                        {product.sizes_available && (
                          <Typography fontSize={11} color="text.secondary" noWrap>
                            Sizes: {product.sizes_available}
                          </Typography>
                        )}
                        {product.colors_available && (
                          <Typography fontSize={11} color="text.secondary" noWrap>
                            Colors: {product.colors_available}
                          </Typography>
                        )}
                        {!product.sizes_available && !product.colors_available && '—'}
                      </Stack>
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          !product.is_available ? 'Unavailable' :
                          product.stock_quantity === 0 ? 'Out of Stock' : 'In Stock'
                        }
                        color={
                          !product.is_available ? 'default' :
                          product.stock_quantity === 0 ? 'error' : 'success'
                        }
                        sx={{ fontSize: 11, height: 22, fontWeight: 600 }}
                      />
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <Stack direction="row" gap={0.5}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(product)}
                            sx={{ '&:hover': { color: 'primary.main' } }}>
                            <IconEdit size={15} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => openDelete(product)}
                            sx={{ '&:hover': { color: 'error.main' } }}>
                            <IconTrash size={15} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>

                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {filtered.length > rowsPerPage && (
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={e => { setRowsPerPage(+e.target.value); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50]}
            sx={{ mt: 1, borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </DashboardCard>

      {/* Dialogs */}
      <ProductFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditProduct(null); }}
        onSave={handleSave}
        product={editProduct}
        saving={saving}
      />

      <DeleteDialog
        open={deleteOpen}
        product={deleteProduct}
        onClose={() => { setDeleteOpen(false); setDeleteProduct(null); }}
        onConfirm={handleDelete}
        deleting={deleting}
      />

      <CSVUploadDialog
        open={csvOpen}
        onClose={() => setCSVOpen(false)}
        onUpload={handleCSVUpload}
      />

    </PageContainer>
  );
};

export default ProductsPage;