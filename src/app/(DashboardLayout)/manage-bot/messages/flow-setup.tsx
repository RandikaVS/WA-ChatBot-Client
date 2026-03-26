'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Stack, Typography, TextField, Button, Paper, Chip,
  Switch, FormControlLabel, IconButton, Divider, Alert,
  CircularProgress, Tooltip, Collapse, Badge, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import {
  IconDeviceFloppy, IconRefresh, IconChevronDown, IconChevronUp,
  IconGripVertical, IconPlus, IconTrash, IconInfoCircle,
  IconMessage, IconClick, IconList, IconCheck, IconX,
  IconAlertTriangle, IconRoute, IconBolt, IconEdit,
} from '@tabler/icons-react';
import axios from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FlowButton {
  id:    string;
  title: string;
}

interface FlowStep {
  step_key:     string;      // e.g. "main_menu"
  step_index:   number;      // 0, 1, 2 ...
  display_name: string;      // human-readable "Main Menu"
  is_enabled:   boolean;
  message:      string;      // the message sent at this step
  buttons:      FlowButton[]; // interactive buttons (max 3)
  description:  string;      // internal note — what this step does
}

// Default flow matching FLOW_STEPS_DICT in your settings
const DEFAULT_STEPS: FlowStep[] = [
  {
    step_index: 0, step_key: 'idle', display_name: 'Idle / Entry',
    is_enabled: true,
    description: 'Triggered when customer says hi/hello/start/help',
    message: 'Hi {{customer_name}}! 👋 Welcome to *{{business_name}}*!\n\nHow can I help you today?',
    buttons: [
      { id: 'flow_browse',  title: '🛍️ Browse Products' },
      { id: 'flow_order',   title: '📦 My Orders'        },
      { id: 'flow_support', title: '💬 Support'          },
    ],
  },
  {
    step_index: 1, step_key: 'main_menu', display_name: 'Main Menu',
    is_enabled: true,
    description: 'Routes customer to Browse, Orders, or Support',
    message: 'Please choose an option below:',
    buttons: [
      { id: 'flow_browse',  title: '🛍️ Browse Products' },
      { id: 'flow_order',   title: '📦 My Orders'        },
      { id: 'flow_support', title: '💬 Support'          },
    ],
  },
  {
    step_index: 2, step_key: 'browsing', display_name: 'Product Browser',
    is_enabled: true,
    description: 'Shows product list from your catalog as a WhatsApp list',
    message: 'Here are our available products 👇\n\nTap a product to see details and order.',
    buttons: [],
  },
  {
    step_index: 3, step_key: 'product_detail', display_name: 'Product Detail',
    is_enabled: true,
    description: 'Shows selected product details with Order / Back buttons',
    message: '{{product_details}}',
    buttons: [
      { id: 'flow_add_to_order', title: '✅ Order This'   },
      { id: 'flow_back',         title: '◀️ Back to List' },
      { id: 'flow_main_menu',    title: '🏠 Main Menu'    },
    ],
  },
  {
    step_index: 4, step_key: 'collect_quantity', display_name: 'Collect Quantity',
    is_enabled: true,
    description: 'Asks the customer how many units they want',
    message: 'Great choice! 🎉 You selected *{{product_name}}*.\n\nPlease enter the *quantity* you\'d like to order:',
    buttons: [],
  },
  {
    step_index: 5, step_key: 'collect_size', display_name: 'Collect Size',
    is_enabled: true,
    description: 'Asks the customer for their size preference',
    message: 'What *size* do you need? (e.g. 40, 42, 44)',
    buttons: [],
  },
  {
    step_index: 6, step_key: 'collect_address', display_name: 'Collect Address',
    is_enabled: true,
    description: 'Asks for the delivery address',
    message: '📍 What is your *delivery address*?',
    buttons: [],
  },
  {
    step_index: 7, step_key: 'confirm_order', display_name: 'Order Confirmation',
    is_enabled: true,
    description: 'Shows order summary and asks for confirmation',
    message: '📋 *Order Summary*\n\nProduct : {{product_name}}\nSize    : {{size}}\nQty     : {{quantity}}\nAddress : {{address}}\nTotal   : {{currency}} {{total}}\n\nDelivery in 2-3 business days. 🚚',
    buttons: [
      { id: 'flow_confirm', title: '✅ Confirm Order' },
      { id: 'flow_cancel',  title: '❌ Cancel'        },
    ],
  },
  {
    step_index: 8, step_key: 'support', display_name: 'AI Support Chat',
    is_enabled: true,
    description: 'Hands off to AI for free-text support conversation',
    message: '💬 *Support*\n\nTell me what you need help with and I\'ll assist you right away.',
    buttons: [],
  },
];

// Template variables reference
const TEMPLATE_VARS = [
  { token: '{{customer_name}}',  desc: 'Customer WhatsApp display name' },
  { token: '{{business_name}}',  desc: 'Your business name from settings' },
  { token: '{{product_name}}',   desc: 'Selected product name' },
  { token: '{{product_details}}', desc: 'Full product details block' },
  { token: '{{size}}',           desc: 'Customer-entered size' },
  { token: '{{quantity}}',       desc: 'Customer-entered quantity' },
  { token: '{{address}}',        desc: 'Customer-entered address' },
  { token: '{{currency}}',       desc: 'Product currency (LKR, USD...)' },
  { token: '{{total}}',          desc: 'Order total price' },
];

// ─── Button Editor ────────────────────────────────────────────────────────────

const ButtonEditor = ({
  buttons,
  onChange,
}: {
  buttons: FlowButton[];
  onChange: (btns: FlowButton[]) => void;
}) => {
  const addButton = () => {
    if (buttons.length >= 3) return;
    onChange([...buttons, { id: `btn_${Date.now()}`, title: '' }]);
  };

  const updateButton = (i: number, field: 'id' | 'title', val: string) => {
    const updated = buttons.map((b, idx) => idx === i ? { ...b, [field]: val } : b);
    onChange(updated);
  };

  const removeButton = (i: number) => {
    onChange(buttons.filter((_, idx) => idx !== i));
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
        <Typography fontSize={12} fontWeight={600} color="text.secondary">
          Quick Reply Buttons
          <Chip label={`${buttons.length}/3`} size="small"
            sx={{ ml: 1, fontSize: 10, height: 18 }} />
        </Typography>
        {buttons.length < 3 && (
          <Button size="small" startIcon={<IconPlus size={13} />}
            onClick={addButton} sx={{ fontSize: 11 }}>
            Add Button
          </Button>
        )}
      </Stack>

      {buttons.length === 0 && (
        <Typography fontSize={11} color="text.disabled" sx={{ fontStyle: 'italic' }}>
          No buttons — this step sends a plain text message
        </Typography>
      )}

      <Stack gap={1}>
        {buttons.map((btn, i) => (
          <Stack direction="row" gap={1} key={i} alignItems="center">
            <TextField
              size="small" placeholder="Button ID (flow_xxx)"
              value={btn.id}
              onChange={e => updateButton(i, 'id', e.target.value)}
              sx={{ flex: 1, '& input': { fontSize: 12, fontFamily: 'monospace' } }}
            />
            <TextField
              size="small" placeholder="Button label (max 20 chars)"
              value={btn.title}
              onChange={e => updateButton(i, 'title', e.target.value.slice(0, 20))}
              sx={{ flex: 2, '& input': { fontSize: 12 } }}
              helperText={btn.title.length > 16 ? `${btn.title.length}/20` : ''}
            />
            <IconButton size="small" onClick={() => removeButton(i)}
              sx={{ color: 'error.main', flexShrink: 0 }}>
              <IconX size={14} />
            </IconButton>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};

// ─── Single Flow Step Card ────────────────────────────────────────────────────

const FlowStepCard = ({
  step,
  index,
  total,
  onChange,
}: {
  step: FlowStep;
  index: number;
  total: number;
  onChange: (updated: FlowStep) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showVars, setShowVars] = useState(false);

  const update = (key: keyof FlowStep, value: any) => {
    onChange({ ...step, [key]: value });
  };

  const hasButtons  = step.buttons.length > 0;
  const isSupportStep = step.step_key === 'support';

  return (
    <Paper elevation={0} sx={{
      border: '1.5px solid',
      borderColor: expanded ? 'primary.light' : step.is_enabled ? 'divider' : 'action.disabled',
      borderRadius: 2.5,
      opacity: step.is_enabled ? 1 : 0.55,
      transition: 'all 0.2s',
    }}>
      {/* Step header — always visible */}
      <Stack direction="row" alignItems="center" gap={1.5} sx={{ p: 2 }}>
        {/* Step number badge */}
        <Box sx={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          bgcolor: step.is_enabled ? 'primary.main' : 'action.disabled',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Typography fontSize={12} fontWeight={700} color="white">{index}</Typography>
        </Box>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" alignItems="center" gap={1}>
            <Typography fontWeight={600} fontSize={14}>{step.display_name}</Typography>
            <Chip label={step.step_key} size="small"
              sx={{ fontSize: 10, height: 18, fontFamily: 'monospace',
                bgcolor: 'action.hover' }} />
            {hasButtons && (
              <Chip icon={<IconClick size={11} />}
                label={`${step.buttons.length} buttons`} size="small"
                sx={{ fontSize: 10, height: 18 }} />
            )}
            {isSupportStep && (
              <Chip icon={<IconBolt size={11} />} label="AI powered" size="small"
                color="primary" sx={{ fontSize: 10, height: 18 }} />
            )}
          </Stack>
          <Typography fontSize={11} color="text.secondary" noWrap>
            {step.description}
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" gap={0.5}>
          <Switch
            checked={step.is_enabled}
            onChange={e => update('is_enabled', e.target.checked)}
            size="small" color="success"
          />
          <IconButton size="small" onClick={() => setExpanded(p => !p)}>
            {expanded ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
          </IconButton>
        </Stack>
      </Stack>

      {/* Expanded editor */}
      <Collapse in={expanded}>
        <Divider />
        <Box sx={{ p: 2.5 }}>
          <Stack gap={2.5}>

            {/* Display name edit */}
            <TextField
              label="Display Name"
              size="small"
              fullWidth
              value={step.display_name}
              onChange={e => update('display_name', e.target.value)}
              helperText="Internal label — not shown to customers"
            />

            {/* Description */}
            <TextField
              label="Internal Description"
              size="small"
              fullWidth
              value={step.description}
              onChange={e => update('description', e.target.value)}
              helperText="Your own notes about what this step does"
            />

            {/* Message editor */}
            {!isSupportStep && (
              <Box>
                <Stack direction="row" justifyContent="space-between" mb={0.8}>
                  <Typography fontSize={12} fontWeight={600} color="text.secondary">
                    Message sent to customer
                  </Typography>
                  <Button size="small" sx={{ fontSize: 11 }}
                    startIcon={<IconInfoCircle size={13} />}
                    onClick={() => setShowVars(p => !p)}>
                    Variables
                  </Button>
                </Stack>

                {/* Template variables reference */}
                <Collapse in={showVars}>
                  <Paper elevation={0} sx={{ p: 1.5, mb: 1.5, bgcolor: 'action.hover',
                    borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Typography fontSize={11} fontWeight={700} mb={1}>
                      Available template variables:
                    </Typography>
                    <Stack gap={0.5}>
                      {TEMPLATE_VARS.map(v => (
                        <Stack key={v.token} direction="row" gap={1} alignItems="center">
                          <Typography fontSize={11} fontFamily="monospace"
                            sx={{ bgcolor: 'background.paper', px: 0.8, py: 0.2,
                              borderRadius: 1, border: '1px solid', borderColor: 'divider',
                              cursor: 'pointer', flexShrink: 0 }}
                            onClick={() => update('message', step.message + v.token)}>
                            {v.token}
                          </Typography>
                          <Typography fontSize={11} color="text.secondary">{v.desc}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Paper>
                </Collapse>

                <TextField
                  multiline
                  rows={5}
                  fullWidth
                  value={step.message}
                  onChange={e => update('message', e.target.value)}
                  placeholder="Type the message this step sends..."
                  sx={{
                    '& textarea': { fontSize: 13, lineHeight: 1.6, fontFamily: 'monospace' }
                  }}
                  helperText="Use *bold* for WhatsApp bold formatting. Click variable tokens above to insert them."
                />
              </Box>
            )}

            {isSupportStep && (
              <Alert severity="info" sx={{ fontSize: 12 }}>
                This step hands off to the AI using your system prompt from My Agent settings.
                No custom message needed — the AI generates responses automatically.
              </Alert>
            )}

            {/* Button editor */}
            {!isSupportStep && (
              <ButtonEditor
                buttons={step.buttons}
                onChange={btns => update('buttons', btns)}
              />
            )}

          </Stack>
        </Box>
      </Collapse>
    </Paper>
  );
};

// ─── Flow Preview Panel ───────────────────────────────────────────────────────

const FlowPreview = ({ steps }: { steps: FlowStep[] }) => {
  const enabled = steps.filter(s => s.is_enabled);

  return (
    <Paper elevation={0} sx={{
      p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2.5,
      position: 'sticky', top: 24,
    }}>
      <Typography fontSize={13} fontWeight={700} mb={2}>
        Flow Map
      </Typography>

      <Stack gap={0}>
        {enabled.map((step, i) => (
          <Box key={step.step_key}>
            <Stack direction="row" alignItems="center" gap={1.5}>
              <Box sx={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                bgcolor: 'primary.main',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Typography fontSize={10} fontWeight={700} color="white">{step.step_index}</Typography>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontSize={12} fontWeight={600}>{step.display_name}</Typography>
                {step.buttons.length > 0 && (
                  <Stack direction="row" gap={0.5} mt={0.3} flexWrap="wrap">
                    {step.buttons.map(b => (
                      <Chip key={b.id} label={b.title} size="small"
                        sx={{ fontSize: 9, height: 16 }} />
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
            {i < enabled.length - 1 && (
              <Box sx={{ ml: 1.5, pl: 1.5, borderLeft: '2px dashed',
                borderColor: 'divider', height: 16 }} />
            )}
          </Box>
        ))}
      </Stack>

      <Divider sx={{ my: 2 }} />
      <Typography fontSize={11} color="text.secondary">
        {enabled.length} of {steps.length} steps enabled
      </Typography>
    </Paper>
  );
};

// ─── Main Flow Setup Component ────────────────────────────────────────────────

export const FlowSetup = () => {
  const [steps, setSteps]     = useState<FlowStep[]>(DEFAULT_STEPS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [error, setError]     = useState<string | null>(null);

  // Fetch saved flow config from API
  const fetchFlow = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get('https://bizassist-meta-service-872504844378.us-west2.run.app/api/flow/config');
      
      if (res.data.steps && res.data.steps.length > 0) {
        setSteps(res.data.steps);
      }
    } catch {
      // If 404, no custom config saved yet — use defaults (already set)
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchFlow(); }, [fetchFlow]);

  const updateStep = (index: number, updated: FlowStep) => {
    setSteps(prev => prev.map((s, i) => i === index ? updated : s));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await axios.put('https://bizassist-meta-service-872504844378.us-west2.run.app/api/flow/config', { steps });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Failed to save flow configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSteps(DEFAULT_STEPS);
    setSaved(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="flex-start"
        justifyContent="space-between" mb={3}>
        <Box>
          <Stack direction="row" alignItems="center" gap={1}>
            <IconRoute size={22} />
            <Typography variant="h6" fontWeight={700}>Conversation Flow</Typography>
          </Stack>
          <Typography fontSize={13} color="text.secondary" mt={0.5}>
            Configure each step of your automated WhatsApp conversation.
            Changes affect all new conversations immediately after saving.
          </Typography>
        </Box>

        <Stack direction="row" gap={1.5}>
          <Button
            variant="outlined"
            startIcon={<IconRefresh size={15} />}
            onClick={handleReset}
            sx={{ borderRadius: 2, fontSize: 13 }}
          >
            Reset Defaults
          </Button>
          <Button
            variant="contained"
            startIcon={
              saving
                ? <CircularProgress size={14} color="inherit" />
                : <IconDeviceFloppy size={16} />
            }
            onClick={handleSave}
            disabled={saving}
            color={saved ? 'success' : 'primary'}
            sx={{ borderRadius: 2, fontWeight: 600, minWidth: 140 }}
          >
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Flow'}
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Info banner */}
      <Alert severity="info" icon={<IconInfoCircle size={16} />}
        sx={{ mb: 3, borderRadius: 2, fontSize: 12 }}>
        The flow triggers when a customer sends <strong>hi / hello / start / menu / help</strong>.
        Each step shows a message and optional quick-reply buttons.
        The <strong>AI Support</strong> step uses your system prompt from My Agent settings.
      </Alert>

      {/* Two column: steps editor + flow preview */}
      <Stack direction={{ xs: 'column', lg: 'row' }} gap={3} alignItems="flex-start">

        {/* Steps list */}
        <Stack gap={1.5} sx={{ flex: 1 }}>
          {steps.map((step, i) => (
            <FlowStepCard
              key={step.step_key}
              step={step}
              index={i}
              total={steps.length}
              onChange={updated => updateStep(i, updated)}
            />
          ))}
        </Stack>

        {/* Flow preview sidebar */}
        <Box sx={{ width: { lg: 260 }, flexShrink: 0 }}>
          <FlowPreview steps={steps} />
        </Box>
      </Stack>
    </Box>
  );
};