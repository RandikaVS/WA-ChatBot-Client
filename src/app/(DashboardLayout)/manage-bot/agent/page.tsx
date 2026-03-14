'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, Switch, FormControlLabel,
  Select, MenuItem, FormControl, InputLabel, Slider, Chip, Avatar,
  IconButton, Divider, Alert, Tooltip, CircularProgress, Button,
  Card, CardContent, Stack, LinearProgress, Badge,
} from '@mui/material';
import {
  IconRobot, IconSend, IconRefresh, IconDeviceFloppy,
  IconBrandWhatsapp, IconCircleCheck, IconCircleX,
  IconSparkles, IconMessage, IconTrash, IconInfoCircle,
  IconChevronDown, IconBolt,
} from '@tabler/icons-react';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import DashboardCard from '@/app/(DashboardLayout)/components/shared/DashboardCard';
import { useAgentContext } from '@/app/context/agent-context/agent-context';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AgentConfig {
  isActive: boolean;
  businessName: string;
  systemPrompt: string;
  welcomeMessage: string;
  model: string;
  language: string;
  temperature: number;
  maxTokens: number;
  replyDelay: number; // seconds before replying (feels more human)
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AI_MODELS = [
  { value: 'gemini-2.0-flash',      label: 'Gemini 2.0 Flash',      badge: 'Recommended', speed: 95, quality: 82 },
  { value: 'gemini-1.5-pro',        label: 'Gemini 1.5 Pro',        badge: 'High Quality', speed: 70, quality: 94 },
  { value: 'gemini-2.5-flash-preview', label: 'Gemini 2.5 Flash',   badge: 'Latest',      speed: 90, quality: 88 },
  { value: 'gpt-4o-mini',           label: 'GPT-4o Mini',           badge: 'OpenAI',      speed: 88, quality: 80 },
  { value: 'gpt-4o',                label: 'GPT-4o',                badge: 'OpenAI Pro',  speed: 72, quality: 96 },
];

const LANGUAGES = [
  { value: 'en',    label: 'English' },
  { value: 'si',    label: 'Sinhala (සිංහල)' },
  { value: 'ta',    label: 'Tamil (தமிழ்)' },
  { value: 'ar',    label: 'Arabic (عربي)' },
  { value: 'hi',    label: 'Hindi (हिन्दी)' },
  { value: 'auto',  label: 'Auto-detect (match customer language)' },
];

const PROMPT_TEMPLATES = [
  {
    label: 'E-commerce Support',
    prompt: `You are a helpful customer support agent for {{business_name}}.
    
Your role is to help customers with:
- Product availability and pricing
- Order tracking and delivery questions  
- Returns and exchanges
- General product recommendations

Always be friendly, concise, and professional. Reply in the same language the customer uses.
If you cannot answer something, offer to connect them with a human agent.`,
  },
  {
    label: 'Restaurant / Food',
    prompt: `You are a friendly assistant for {{business_name}}, a restaurant.

Help customers with:
- Menu items and daily specials
- Reservations and table bookings
- Delivery orders and estimated times
- Dietary requirements and allergen info

Keep replies short and warm. Always confirm orders clearly.`,
  },
  {
    label: 'Service Business',
    prompt: `You are a professional assistant for {{business_name}}.

Your job is to:
- Answer questions about our services and pricing
- Schedule appointments and consultations
- Follow up on existing service requests
- Provide business hours and location information

Be professional and helpful. For complex issues, escalate to a human.`,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/**
 * Status indicator that shows whether the bot is active and
 * the WhatsApp connection health. Green = all good, red = action needed.
 */
const StatusBanner = ({
  isActive,
  onToggle,
  waConnected,
}: {
  isActive: boolean;
  onToggle: () => void;
  waConnected: boolean;
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 2.5,
      mb: 3,
      border: '1px solid',
      borderColor: isActive ? 'success.light' : 'divider',
      borderRadius: 3,
      background: isActive
        ? 'linear-gradient(135deg, rgba(76,175,80,0.06) 0%, rgba(76,175,80,0.02) 100%)'
        : 'background.paper',
      transition: 'all 0.3s ease',
    }}
  >
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" alignItems="center" gap={2}>
        {/* Animated pulse dot when active */}
        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Box
            sx={{
              width: 12, height: 12, borderRadius: '50%',
              bgcolor: isActive ? 'success.main' : 'text.disabled',
              ...(isActive && {
                '&::after': {
                  content: '""', position: 'absolute',
                  inset: -4, borderRadius: '50%',
                  border: '2px solid', borderColor: 'success.main',
                  animation: 'pulse 1.8s ease-in-out infinite',
                  '@keyframes pulse': {
                    '0%': { opacity: 0.8, transform: 'scale(1)' },
                    '100%': { opacity: 0, transform: 'scale(2.2)' },
                  },
                },
              }),
            }}
          />
        </Box>
        <Box>
          <Typography fontWeight={600} fontSize={15} color={isActive ? 'success.dark' : 'text.primary'}>
            {isActive ? 'Agent is Live' : 'Agent is Paused'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isActive
              ? 'Responding to all incoming messages automatically'
              : 'Bot is silent — messages arrive but no auto-reply'}
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" alignItems="center" gap={3}>
        {/* WhatsApp connection status badge */}
        <Chip
          size="small"
          icon={
            waConnected
              ? <IconCircleCheck size={14} />
              : <IconCircleX size={14} />
          }
          label={waConnected ? 'WhatsApp Connected' : 'WhatsApp Not Connected'}
          color={waConnected ? 'success' : 'error'}
          variant="outlined"
          sx={{ fontSize: 12 }}
        />

        {/* Master on/off toggle */}
        <FormControlLabel
          control={
            <Switch
              checked={isActive}
              onChange={onToggle}
              color="success"
              sx={{ '& .MuiSwitch-thumb': { boxShadow: '0 2px 6px rgba(0,0,0,0.2)' } }}
            />
          }
          label={<Typography fontSize={13} fontWeight={500}>{isActive ? 'On' : 'Off'}</Typography>}
          labelPlacement="start"
        />
      </Stack>
    </Stack>
  </Paper>
);


/**
 * A single model option in the model selector showing speed vs quality bars.
 * These visual indicators help non-technical clients make an informed choice.
 */
const ModelCard = ({
  model,
  selected,
  onSelect,
}: {
  model: typeof AI_MODELS[0];
  selected: boolean;
  onSelect: () => void;
}) => (
  <Paper
    onClick={onSelect}
    elevation={0}
    sx={{
      p: 2, cursor: 'pointer', borderRadius: 2,
      border: '1.5px solid',
      borderColor: selected ? 'primary.main' : 'divider',
      background: selected ? 'rgba(82,130,255,0.05)' : 'background.paper',
      transition: 'all 0.2s',
      '&:hover': { borderColor: 'primary.light', background: 'rgba(82,130,255,0.03)' },
    }}
  >
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
      <Typography fontWeight={selected ? 600 : 500} fontSize={13}>
        {model.label}
      </Typography>
      <Chip label={model.badge} size="small"
        color={model.badge === 'Recommended' ? 'primary' : 'default'}
        sx={{ fontSize: 10, height: 18 }}
      />
    </Stack>
    <Stack gap={0.5}>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography variant="caption" color="text.secondary" sx={{ width: 48, fontSize: 10 }}>Speed</Typography>
        <LinearProgress variant="determinate" value={model.speed}
          sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': { bgcolor: 'success.main' } }} />
        <Typography variant="caption" sx={{ fontSize: 10, width: 28, textAlign: 'right' }}>{model.speed}%</Typography>
      </Stack>
      <Stack direction="row" alignItems="center" gap={1}>
        <Typography variant="caption" color="text.secondary" sx={{ width: 48, fontSize: 10 }}>Quality</Typography>
        <LinearProgress variant="determinate" value={model.quality}
          sx={{ flex: 1, height: 4, borderRadius: 2, bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': { bgcolor: 'primary.main' } }} />
        <Typography variant="caption" sx={{ fontSize: 10, width: 28, textAlign: 'right' }}>{model.quality}%</Typography>
      </Stack>
    </Stack>
  </Paper>
);


/**
 * The live test chat panel. Clients type a message here and see exactly
 * how their bot will respond with the current system prompt and settings.
 * This is the most important UX feature of the whole page — it builds
 * confidence before the client goes live with real customers.
 */
const TestChat = ({ config }: { config: AgentConfig }) => {

  const {
    testMessage,
  } = useAgentContext();
  const [messages, setMessages]   = useState<ChatMessage[]>([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendTestMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Call your FastAPI backend — passes the current config so the AI
      // uses the system prompt the client has written but NOT yet saved.
      // This "preview before save" UX is what makes this feature valuable.
      // const response = await fetch('/api/agent/test', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     message: userMsg.content,
      //     system_prompt: config.systemPrompt,
      //     model: config.model,
      //     language: config.language,
      //     temperature: config.temperature,
      //   }),
      // });
      const payload = {
          message: userMsg.content,
          systemPrompt: config.systemPrompt,
          model: config.model,
          language: config.language,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
      }
      const data = await testMessage(payload);
      // const data = await response.json();
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data?.reply || 'No response received.',
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ Could not connect to AI. Check your API key in settings.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520 }}>

      {/* Chat header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between"
        sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: 16 }}>
            <IconRobot size={20} />
          </Avatar>
          <Box>
            <Typography fontWeight={600} fontSize={14}>{config.businessName || 'Your Bot'}</Typography>
            <Typography variant="caption" color="success.main" fontSize={11}>
              ● Preview mode
            </Typography>
          </Box>
        </Stack>
        <Tooltip title="Clear conversation">
          <IconButton size="small" onClick={() => setMessages([])}>
            <IconTrash size={16} />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Message area */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 1.5,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 28px, rgba(0,0,0,0.015) 28px, rgba(0,0,0,0.015) 29px)',
      }}>

        {/* Empty state hint */}
        {messages.length === 0 && (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 2, py: 4, opacity: 0.5 }}>
            <IconMessage size={40} strokeWidth={1} />
            <Typography fontSize={13} color="text.secondary" textAlign="center">
              Type a message to preview<br />how your bot will respond
            </Typography>
            {/* Quick test prompts */}
            <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="center">
              {['Hello!', 'What are your prices?', 'I need help'].map(q => (
                <Chip key={q} label={q} size="small" onClick={() => setInput(q)}
                  sx={{ cursor: 'pointer', fontSize: 11 }} />
              ))}
            </Stack>
          </Box>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <Avatar sx={{ width: 28, height: 28, mr: 1, mt: 0.5, bgcolor: 'primary.main', fontSize: 13, flexShrink: 0 }}>
                <IconRobot size={15} />
              </Avatar>
            )}
            <Box sx={{
              maxWidth: '78%',
              px: 1.8, py: 1.2,
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              bgcolor: msg.role === 'user' ? 'primary.main' : 'background.default',
              border: msg.role === 'assistant' ? '1px solid' : 'none',
              borderColor: 'divider',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}>
              <Typography
                fontSize={13.5} lineHeight={1.55}
                color={msg.role === 'user' ? 'white' : 'text.primary'}
                sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
              >
                {msg.content}
              </Typography>
              <Typography fontSize={10} color={msg.role === 'user' ? 'rgba(255,255,255,0.65)' : 'text.disabled'}
                textAlign="right" mt={0.5}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          </Box>
        ))}

        {/* Typing indicator */}
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 13 }}>
              <IconRobot size={15} />
            </Avatar>
            <Box sx={{ px: 2, py: 1.5, bgcolor: 'background.default', borderRadius: '18px 18px 18px 4px',
              border: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" gap={0.5} alignItems="center">
                {[0, 1, 2].map(i => (
                  <Box key={i} sx={{
                    width: 6, height: 6, borderRadius: '50%', bgcolor: 'text.disabled',
                    animation: 'bounce 1.2s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`,
                    '@keyframes bounce': {
                      '0%, 60%, 100%': { transform: 'translateY(0)' },
                      '30%': { transform: 'translateY(-5px)' },
                    },
                  }} />
                ))}
              </Stack>
            </Box>
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>

      {/* Input area */}
      <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" gap={1} alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            maxRows={3}
            size="small"
            placeholder="Type a test message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTestMessage(); } }}
            sx={{ '& fieldset': { borderRadius: 3 } }}
          />
          <IconButton
            onClick={sendTestMessage}
            disabled={!input.trim() || loading}
            sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 2.5,
              width: 38, height: 38, flexShrink: 0,
              '&:hover': { bgcolor: 'primary.dark' },
              '&:disabled': { bgcolor: 'action.disabledBackground' },
            }}>
            {loading ? <CircularProgress size={16} color="inherit" /> : <IconSend size={17} />}
          </IconButton>
        </Stack>
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block', textAlign: 'center', fontSize: 10 }}>
          This is a preview — changes take effect after saving
        </Typography>
      </Box>
    </Box>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const MyAgentPage = () => {

  const {
    config, stats,
    configLoading, statsLoading,
    saving, error,
    fetchConfig, saveConfig, testMessage, fetchStats,
  } = useAgentContext();


  const [localConfig, setLocalConfig] = useState<AgentConfig | null>(null);
  const [saved, setSaved]= useState(false);

  useEffect(() => {
    if (config) setLocalConfig({ ...config });
  }, [config]);

  // Fetch data when the page mounts
  useEffect(() => {
    fetchConfig();
    fetchStats();
  }, [fetchConfig, fetchStats]);

  const updateLocal = (key: keyof AgentConfig, value: unknown) => {
    setLocalConfig(prev => prev ? { ...prev, [key]: value } : prev);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!localConfig) return;
    // saveConfig returns true/false so we know whether to show "Saved!"
    const success = await saveConfig(localConfig);
    if (success) setSaved(true);
  };

  const applyTemplate = (prompt: string) => {
    const filled = prompt.replace('{{business_name}}', config?.businessName ?? '');
    updateLocal('systemPrompt', filled);
  };

  // Show a loading skeleton while config is fetching
  if (configLoading || !localConfig) {
    return <PageContainer title="My Agent"><CircularProgress /></PageContainer>;
  }

  return (
    <PageContainer title="My Agent" description="Configure your WhatsApp AI assistant">

      {/* Page header with Save button */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconRobot size={26} />
            My Agent
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Configure your AI assistant's personality, knowledge, and behaviour
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <IconDeviceFloppy size={18} />}
          onClick={handleSave}
          disabled={saving}
          color={saved ? 'success' : 'primary'}
          sx={{ borderRadius: 2.5, px: 3, fontWeight: 600 }}
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
        </Button>
      </Stack>

      {/* Status banner — most visible element on the page */}
      <StatusBanner
        isActive={config?.isActive??false}
        onToggle={() => updateLocal('isActive', !config?.isActive)}
        waConnected={true} // replace with real connection check from your API
      />

      <Grid container spacing={3}>

        {/* ── LEFT COLUMN: Configuration ─────────────────────────── */}
        <Grid size={{ xs: 12, lg: 7 }} >
          <Stack gap={3}>

            {/* ── Card 1: Personality ──────────────────────────────── */}
            <DashboardCard
              title="Personality & Knowledge"
              action={
                <Tooltip title="This is the most important setting. It tells the AI who it is, what it knows, and how to behave.">
                  <IconInfoCircle size={18} style={{ cursor: 'help', opacity: 0.5 }} />
                </Tooltip>
              }
            >
              <Stack gap={2.5}>

                <TextField
                  label="Business Name"
                  value={config?.businessName}
                  onChange={e => updateLocal('businessName', e.target.value)}
                  size="small"
                  fullWidth
                  helperText="Used to personalise your bot's introduction"
                />

                {/* System Prompt — the core of the whole product */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      System Prompt
                    </Typography>
                    {/* Quick template picker */}
                    <Stack direction="row" gap={0.5}>
                      {PROMPT_TEMPLATES.map(t => (
                        <Chip
                          key={t.label}
                          label={t.label}
                          size="small"
                          variant="outlined"
                          onClick={() => applyTemplate(t.prompt)}
                          icon={<IconSparkles size={12} />}
                          sx={{ fontSize: 11, cursor: 'pointer' }}
                        />
                      ))}
                    </Stack>
                  </Stack>

                  <TextField
                    multiline
                    rows={10}
                    fullWidth
                    value={config?.systemPrompt}
                    onChange={e => updateLocal('systemPrompt', e.target.value)}
                    placeholder="Describe your business, what the bot should help with, what it should NOT say, and what tone to use..."
                    sx={{ '& textarea': { fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6 } }}
                  />

                  {/* Prompt health indicator */}
                  {(() => {
                    // Define max prompt length and calculate char count and health
                    const PROMPT_MAX = 1200;
                    const charCount = config?.systemPrompt?.length ?? 0;
                    let promptHealth: 'good' | 'too_short' | 'too_long' = 'good';
                    if (charCount < 120) promptHealth = 'too_short';
                    else if (charCount > PROMPT_MAX) promptHealth = 'too_long';

                    return (
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
                        <Box sx={{ flex: 1, mr: 2 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((charCount / PROMPT_MAX) * 100, 100)}
                            sx={{
                              height: 4, borderRadius: 2,
                              bgcolor: 'action.hover',
                              '& .MuiLinearProgress-bar': {
                                bgcolor: promptHealth === 'good' ? 'success.main'
                                  : promptHealth === 'too_short' ? 'warning.main'
                                  : 'error.main'
                              },
                            }}
                          />
                        </Box>
                        <Typography variant="caption" color={
                          promptHealth === 'good' ? 'success.main'
                            : promptHealth === 'too_short' ? 'warning.main' : 'error.main'
                        } fontSize={11}>
                          {charCount} / {PROMPT_MAX} chars
                          {promptHealth === 'too_short' && ' — too short, add more detail'}
                          {promptHealth === 'too_long' && ' — consider shortening'}
                          {promptHealth === 'good' && ' — good length'}
                        </Typography>
                      </Stack>
                    );
                  })()}
                </Box>

                <TextField
                  label="Welcome Message"
                  value={config?.welcomeMessage}
                  onChange={e => updateLocal('welcomeMessage', e.target.value)}
                  size="small"
                  fullWidth
                  helperText="Sent automatically when a new customer starts a conversation"
                />

              </Stack>
            </DashboardCard>

            {/* ── Card 2: AI Model ─────────────────────────────────── */}
            <DashboardCard title="AI Model">
              <Stack gap={2}>
                <Alert severity="info" sx={{ py: 0.5, fontSize: 12 }}>
                  <strong>Gemini 2.0 Flash</strong> is recommended for most businesses — fast replies with good quality.
                  Upgrade to a Pro model if accuracy is critical.
                </Alert>
                <Grid container spacing={1.5}>
                  {AI_MODELS.map(m => (
                    <Grid size={{ xs: 12, sm: 6 }} key={m.value}>
                      <ModelCard
                        model={m}
                        selected={config?.model === m.value}
                        onSelect={() => updateLocal('model', m.value)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </DashboardCard>

            {/* ── Card 3: Behaviour Settings ───────────────────────── */}
            <DashboardCard title="Behaviour Settings">
              <Grid container spacing={3}>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Reply Language</InputLabel>
                    <Select
                      value={config?.language}
                      label="Reply Language"
                      onChange={e => updateLocal('language', e.target.value)}
                    >
                      {LANGUAGES.map(l => (
                        <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                    Auto-detect matches the customer's language
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }} >
                  <FormControl fullWidth size="small">
                    <InputLabel>Reply Delay</InputLabel>
                    <Select
                      value={config?.replyDelay}
                      label="Reply Delay"
                      onChange={e => updateLocal('replyDelay', e.target.value)}
                    >
                      <MenuItem value={0}>Instant (0 seconds)</MenuItem>
                      <MenuItem value={2}>2 seconds — feels natural</MenuItem>
                      <MenuItem value={5}>5 seconds — seems human</MenuItem>
                      <MenuItem value={10}>10 seconds — very human-like</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                    A small delay makes the bot feel less robotic
                  </Typography>
                </Grid>

                {/* Creativity slider — temperature in AI terms */}
                <Grid size={{ xs: 12, sm: 6 }} >
                  <Typography variant="subtitle2" gutterBottom>
                    Creativity
                    <Chip label={(config?.temperature ?? 0.5) <= 0.3 ? 'Precise' : (config?.temperature ?? 0.5) <= 0.7 ? 'Balanced' : 'Creative'}
                      size="small" sx={{ ml: 1, fontSize: 10, height: 18 }}
                      color={(config?.temperature ?? 0.5) <= 0.3 ? 'info' : (config?.temperature ?? 0.5) <= 0.7 ? 'success' : 'warning'}
                    />
                  </Typography>
                  <Slider
                    value={config?.temperature}
                    onChange={(_, v) => updateLocal('temperature', v)}
                    min={0.1} max={1.0} step={0.1}
                    marks={[
                      { value: 0.1, label: 'Strict' },
                      { value: 0.5, label: 'Balanced' },
                      { value: 1.0, label: 'Creative' },
                    ]}
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Lower = consistent, factual replies. Higher = varied, conversational tone.
                  </Typography>
                </Grid>

                {/* Max reply length */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Max Reply Length
                    <Chip label={`~${Math.round((config?.maxTokens ?? 400) * 0.75)} words`}
                      size="small" sx={{ ml: 1, fontSize: 10, height: 18 }} />
                  </Typography>
                  <Slider
                    value={config?.maxTokens}
                    onChange={(_, v) => updateLocal('maxTokens', v)}
                    min={100} max={800} step={50}
                    marks={[
                      { value: 100, label: 'Short' },
                      { value: 400, label: 'Medium' },
                      { value: 800, label: 'Long' },
                    ]}
                    sx={{ mt: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Keep short for WhatsApp — long replies look like essays on mobile.
                  </Typography>
                </Grid>

              </Grid>
            </DashboardCard>

          </Stack>
        </Grid>

        {/* ── RIGHT COLUMN: Test Chat + Stats ────────────────────── */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Box sx={{ position: { lg: 'sticky' }, top: { lg: 24 } }}>
            <Stack gap={3}>

              {/* Live test chat */}
              <DashboardCard title="Test Your Agent"
                action={
                  <Chip
                    icon={<IconBolt size={12} />}
                    label="Live Preview"
                    size="small"
                    color="primary"
                    sx={{ fontSize: 11, height: 20 }}
                  />
                }
              >
                {config && <TestChat config={config} />}
              </DashboardCard>

              {/* Quick stats */}
              <DashboardCard title="This Month">
                <Grid container spacing={2}>
                  {[
                    { label: 'Conversations', value: '248', change: '+12%', color: 'primary.main' },
                    { label: 'Messages Handled', value: '1,847', change: '+8%', color: 'success.main' },
                    { label: 'Escalations', value: '23', change: '-5%', color: 'warning.main' },
                    { label: 'Avg. Response', value: '1.4s', change: '-0.2s', color: 'info.main' },
                  ].map(stat => (
                    <Grid size={{ xs: 6 }} key={stat.label}>
                      <Paper elevation={0}
                        sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2,
                          borderLeft: '3px solid', borderLeftColor: stat.color }}>
                        <Typography fontSize={22} fontWeight={700} lineHeight={1}>
                          {stat.value}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                          {stat.label}
                        </Typography>
                        <Typography variant="caption"
                          color={stat.change.startsWith('+') ? 'success.main' : 'error.main'}
                          fontWeight={600} fontSize={11}>
                          {stat.change} vs last month
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </DashboardCard>

            </Stack>
          </Box>
        </Grid>

      </Grid>
    </PageContainer>
  );
};

export default MyAgentPage;