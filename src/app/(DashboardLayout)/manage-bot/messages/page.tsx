'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Grid, Typography, TextField, Chip, Avatar, IconButton,
  Stack, Paper, Badge, Tooltip, Button, Divider, LinearProgress,
  InputAdornment, Select, MenuItem, FormControl, AvatarGroup,
  ToggleButtonGroup, ToggleButton, CircularProgress,
} from '@mui/material';
import {
  IconSearch, IconFilter, IconSend, IconUserCheck, IconRobot,
  IconBrandWhatsapp, IconMoodSmile, IconMoodNeutral, IconMoodSad,
  IconStar, IconBolt, IconTrendingUp, IconAlertTriangle,
  IconMessageCircle, IconPhone, IconCircleCheck, IconClock,
  IconRefresh, IconChevronRight, IconBrain, IconTarget,
  IconArrowUp, IconArrowDown, IconMinus, IconSparkles,
  IconHandStop, IconX, IconDots,
} from '@tabler/icons-react';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';

// ─── Types ────────────────────────────────────────────────────────────────────

type Sentiment = 'positive' | 'neutral' | 'negative';
type Status    = 'active' | 'resolved' | 'escalated' | 'waiting';

interface AIInsight {
  sentiment: Sentiment;
  satisfactionScore: number;    // 0–100, AI's predicted customer happiness
  topics: string[];             // auto-detected conversation topics
  intent: string;               // primary customer intent
  urgency: 'low' | 'medium' | 'high';
  predictedOutcome: string;     // e.g. "Likely to purchase", "At risk of churn"
  responseQuality: number;      // how well the bot answered, 0–100
  summaryLine: string;          // one-line AI summary of what this chat is about
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isRead: boolean;
}

interface Conversation {
  id: string;
  customerName: string;
  customerPhone: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: Date;
  messageCount: number;
  status: Status;
  isHumanTakeover: boolean;
  unreadCount: number;
  insight: AIInsight;
  messages: Message[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    customerName: 'Sahan Randika',
    customerPhone: '94750688759',
    lastMessage: 'Do you have size 42 Nike in black?',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 2),
    messageCount: 7,
    status: 'active',
    isHumanTakeover: false,
    unreadCount: 2,
    insight: {
      sentiment: 'positive',
      satisfactionScore: 82,
      topics: ['product inquiry', 'sizing', 'sneakers'],
      intent: 'Purchase Intent',
      urgency: 'medium',
      predictedOutcome: 'Likely to purchase',
      responseQuality: 91,
      summaryLine: 'Customer looking for Nike Air Max size 42, interested in black colorway',
    },
    messages: [
      { id: 'm1', role: 'user',      content: 'Hello!', timestamp: new Date(Date.now() - 8*60000), isRead: true },
      { id: 'm2', role: 'assistant', content: 'Hi! 👋 Welcome to ABC Shoes. How can I help you today?', timestamp: new Date(Date.now() - 7*60000), isRead: true },
      { id: 'm3', role: 'user',      content: 'I\'m looking for Nike Air Max 270', timestamp: new Date(Date.now() - 6*60000), isRead: true },
      { id: 'm4', role: 'assistant', content: 'Great choice! We have the Nike Air Max 270 in stock. Available in sizes 36–44, colors Black and White. Price is LKR 12,500 with free island-wide delivery on orders over LKR 5,000. Would you like to know more?', timestamp: new Date(Date.now() - 5*60000), isRead: true },
      { id: 'm5', role: 'user',      content: 'Yes! Do you have size 42 in black?', timestamp: new Date(Date.now() - 4*60000), isRead: true },
      { id: 'm6', role: 'assistant', content: 'Yes, size 42 in Black is available — 8 units in stock. Shall I help you place an order?', timestamp: new Date(Date.now() - 3*60000), isRead: true },
      { id: 'm7', role: 'user',      content: 'Do you have size 42 Nike in black?', timestamp: new Date(Date.now() - 2*60000), isRead: false },
    ],
  },
  {
    id: '2',
    customerName: 'Amara Silva',
    customerPhone: '94771234567',
    lastMessage: 'This is unacceptable. My order is 2 weeks late',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 15),
    messageCount: 14,
    status: 'escalated',
    isHumanTakeover: true,
    unreadCount: 0,
    insight: {
      sentiment: 'negative',
      satisfactionScore: 18,
      topics: ['complaint', 'delivery', 'order tracking'],
      intent: 'Complaint / Refund',
      urgency: 'high',
      predictedOutcome: 'At risk of churn',
      responseQuality: 44,
      summaryLine: 'Angry customer with delayed order #ORD-8821, escalated to human',
    },
    messages: [
      { id: 'm1', role: 'user',      content: 'My order ORD-8821 hasn\'t arrived yet', timestamp: new Date(Date.now() - 30*60000), isRead: true },
      { id: 'm2', role: 'assistant', content: 'I apologize for the inconvenience! Let me check your order status...', timestamp: new Date(Date.now() - 29*60000), isRead: true },
      { id: 'm3', role: 'user',      content: 'It\'s been 2 weeks already', timestamp: new Date(Date.now() - 20*60000), isRead: true },
      { id: 'm4', role: 'user',      content: 'This is unacceptable. My order is 2 weeks late', timestamp: new Date(Date.now() - 15*60000), isRead: true },
    ],
  },
  {
    id: '3',
    customerName: 'Kasun Perera',
    customerPhone: '94712345678',
    lastMessage: 'Thank you! I\'ll order now',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 45),
    messageCount: 5,
    status: 'resolved',
    isHumanTakeover: false,
    unreadCount: 0,
    insight: {
      sentiment: 'positive',
      satisfactionScore: 95,
      topics: ['purchase', 'formal shoes', 'checkout'],
      intent: 'Completed Purchase',
      urgency: 'low',
      predictedOutcome: 'Successfully converted',
      responseQuality: 97,
      summaryLine: 'Customer purchased Oxford Brogue size 43, happy with service',
    },
    messages: [
      { id: 'm1', role: 'user',      content: 'Do you have formal shoes for a wedding?', timestamp: new Date(Date.now() - 60*60000), isRead: true },
      { id: 'm2', role: 'assistant', content: 'Absolutely! Our Oxford Formal Brogue is perfect for weddings. Available in Brown and Black, sizes 40–44. LKR 18,500.', timestamp: new Date(Date.now() - 58*60000), isRead: true },
      { id: 'm3', role: 'user',      content: 'Looks great! Size 43 in Brown?', timestamp: new Date(Date.now() - 50*60000), isRead: true },
      { id: 'm4', role: 'assistant', content: 'Yes! Size 43 Brown is in stock — 4 units available. Want me to guide you through ordering?', timestamp: new Date(Date.now() - 48*60000), isRead: true },
      { id: 'm5', role: 'user',      content: 'Thank you! I\'ll order now', timestamp: new Date(Date.now() - 45*60000), isRead: true },
    ],
  },
  {
    id: '4',
    customerName: 'Dilnoza Yusupova',
    customerPhone: '94778901234',
    lastMessage: 'ok',
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 90),
    messageCount: 3,
    status: 'waiting',
    isHumanTakeover: false,
    unreadCount: 0,
    insight: {
      sentiment: 'neutral',
      satisfactionScore: 55,
      topics: ['pricing', 'sandals'],
      intent: 'Price Comparison',
      urgency: 'low',
      predictedOutcome: 'Undecided — may return',
      responseQuality: 73,
      summaryLine: 'Customer browsing sandal prices, no purchase decision made yet',
    },
    messages: [
      { id: 'm1', role: 'user',      content: 'How much are the sandals?', timestamp: new Date(Date.now() - 100*60000), isRead: true },
      { id: 'm2', role: 'assistant', content: 'Our Havaianas Slim sandals start from LKR 3,200. Available in Blue, Pink, and Yellow, sizes 35–40.', timestamp: new Date(Date.now() - 98*60000), isRead: true },
      { id: 'm3', role: 'user',      content: 'ok', timestamp: new Date(Date.now() - 90*60000), isRead: true },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatRelativeTime = (date: Date): string => {
  const diff = Date.now() - date.getTime();
  if (diff < 60000)    return 'just now';
  if (diff < 3600000)  return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
};

const getSentimentColor = (s: Sentiment) =>
  s === 'positive' ? '#22c55e' : s === 'negative' ? '#ef4444' : '#f59e0b';

const getSentimentIcon = (s: Sentiment, size = 14) =>
  s === 'positive' ? <IconMoodSmile size={size} /> :
  s === 'negative' ? <IconMoodSad   size={size} /> :
                     <IconMoodNeutral size={size} />;

const getStatusConfig = (status: Status) => ({
  active:    { label: 'Active',    color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  resolved:  { label: 'Resolved',  color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
  escalated: { label: 'Escalated', color: '#ef4444', bg: 'rgba(239,68,68,0.1)'  },
  waiting:   { label: 'Waiting',   color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
}[status]);

const getUrgencyColor = (u: string) =>
  u === 'high' ? 'error' : u === 'medium' ? 'warning' : 'success';

// Satisfaction score → ring color gradient
const getSatisfactionColor = (score: number) =>
  score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';

// ─── Summary Stats Bar ────────────────────────────────────────────────────────

const StatsBar = ({ conversations }: { conversations: Conversation[] }) => {
  const total     = conversations.length;
  const active    = conversations.filter(c => c.status === 'active').length;
  const escalated = conversations.filter(c => c.status === 'escalated').length;
  const avgSat    = Math.round(conversations.reduce((s, c) => s + c.insight.satisfactionScore, 0) / total);
  const avgQuality = Math.round(conversations.reduce((s, c) => s + c.insight.responseQuality, 0) / total);

  const stats = [
    { label: 'Total Conversations', value: total,        icon: <IconMessageCircle size={18} />, color: '#3b82f6', change: '+12%' },
    { label: 'Active Now',          value: active,       icon: <IconBolt          size={18} />, color: '#22c55e', change: '+2' },
    { label: 'Escalated',           value: escalated,    icon: <IconAlertTriangle size={18} />, color: '#ef4444', change: '-1' },
    { label: 'Avg Satisfaction',    value: `${avgSat}%`, icon: <IconStar          size={18} />, color: '#f59e0b', change: '+5%' },
    { label: 'AI Response Quality', value: `${avgQuality}%`, icon: <IconBrain size={18} />,    color: '#8b5cf6', change: '+3%' },
  ];

  return (
    <Stack direction="row" gap={2} mb={3} sx={{ overflowX: 'auto', pb: 0.5 }}>
      {stats.map((s, i) => (
        <Paper key={i} elevation={0} sx={{
          p: 2, minWidth: 160, flex: 1,
          border: '1px solid', borderColor: 'divider', borderRadius: 3,
          borderTop: '3px solid', borderTopColor: s.color,
          transition: 'box-shadow 0.2s',
          '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box sx={{ color: s.color }}>{s.icon}</Box>
            <Typography fontSize={11} fontWeight={600}
              color={s.change.startsWith('-') && s.label === 'Escalated' ? 'success.main' :
                     s.change.startsWith('+') ? 'success.main' : 'error.main'}>
              {s.change}
            </Typography>
          </Stack>
          <Typography fontWeight={700} fontSize={24} lineHeight={1.2} mt={1}>{s.value}</Typography>
          <Typography variant="caption" color="text.secondary" fontSize={11}>{s.label}</Typography>
        </Paper>
      ))}
    </Stack>
  );
};

// ─── Satisfaction Ring ────────────────────────────────────────────────────────
// A small circular score indicator used in both the list and chat panel.

const SatisfactionRing = ({ score, size = 40 }: { score: number; size?: number }) => {
  const color = getSatisfactionColor(score);
  const r     = (size / 2) - 4;
  const circ  = 2 * Math.PI * r;
  const dash  = (score / 100) * circ;

  return (
    <Tooltip title={`Predicted satisfaction: ${score}%`}>
      <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth={3.5} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3.5}
            strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round" />
        </svg>
        <Typography sx={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: size > 50 ? 13 : 10, fontWeight: 700, color,
        }}>
          {score}
        </Typography>
      </Box>
    </Tooltip>
  );
};

// ─── Conversation List Item ───────────────────────────────────────────────────

const ConvListItem = ({
  conv,
  selected,
  onClick,
}: {
  conv: Conversation;
  selected: boolean;
  onClick: () => void;
}) => {
  const statusCfg = getStatusConfig(conv.status);
  const sentColor = getSentimentColor(conv.insight.sentiment);

  return (
    <Box
      onClick={onClick}
      sx={{
        p: 2, cursor: 'pointer',
        borderRadius: 2, mb: 0.5,
        border: '1.5px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        background: selected ? 'rgba(82,130,255,0.05)' : 'transparent',
        transition: 'all 0.15s',
        '&:hover': { borderColor: 'primary.light', background: 'rgba(82,130,255,0.03)' },
        // Left accent bar — color encodes sentiment at a glance
        borderLeft: '4px solid',
        borderLeftColor: sentColor,
      }}
    >
      <Stack direction="row" gap={1.5} alignItems="flex-start">
        {/* Avatar with unread badge */}
        <Badge badgeContent={conv.unreadCount} color="error" overlap="circular"
          sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
          <Avatar sx={{ width: 40, height: 40, fontSize: 15, fontWeight: 600,
            bgcolor: selected ? 'primary.main' : 'action.selected' }}>
            {conv.customerName.slice(0, 2).toUpperCase()}
          </Avatar>
        </Badge>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.3}>
            <Typography fontWeight={conv.unreadCount > 0 ? 700 : 600} fontSize={13.5}
              noWrap sx={{ maxWidth: '60%' }}>
              {conv.customerName}
            </Typography>
            <Stack direction="row" alignItems="center" gap={0.8}>
              <Typography variant="caption" color="text.disabled" fontSize={10}>
                {formatRelativeTime(conv.lastMessageTime)}
              </Typography>
              {conv.isHumanTakeover && (
                <Tooltip title="Human agent active">
                  <Box sx={{ color: 'warning.main' }}><IconUserCheck size={13} /></Box>
                </Tooltip>
              )}
            </Stack>
          </Stack>

          <Typography variant="caption" color="text.secondary" noWrap display="block"
            fontWeight={conv.unreadCount > 0 ? 600 : 400} fontSize={12} mb={1}>
            {conv.lastMessage}
          </Typography>

          {/* Bottom row: status + sentiment + satisfaction + topics */}
          <Stack direction="row" alignItems="center" gap={0.8} flexWrap="wrap">
            <Chip
              label={statusCfg.label} size="small"
              sx={{ fontSize: 10, height: 18, bgcolor: statusCfg.bg, color: statusCfg.color,
                fontWeight: 600, border: 'none' }}
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3, color: sentColor }}>
              {getSentimentIcon(conv.insight.sentiment)}
            </Box>
            <SatisfactionRing score={conv.insight.satisfactionScore} size={28} />
            {conv.insight.topics.slice(0, 2).map(t => (
              <Chip key={t} label={t} size="small"
                sx={{ fontSize: 10, height: 16, bgcolor: 'action.hover', fontWeight: 500 }} />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

// ─── AI Insight Panel ─────────────────────────────────────────────────────────
// Shown on the right side of the chat view — the "intelligence layer"
// that makes this more than just a chat viewer.

const AIInsightPanel = ({ insight, conv }: { insight: AIInsight; conv: Conversation }) => {
  const sentColor = getSentimentColor(insight.sentiment);

  return (
    <Stack gap={2}>

      {/* Summary */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, bgcolor: 'action.hover',
        borderLeft: '3px solid', borderLeftColor: 'primary.main' }}>
        <Stack direction="row" gap={1} alignItems="flex-start">
          <IconBrain size={16} style={{ color: '#8b5cf6', flexShrink: 0, marginTop: 2 }} />
          <Box>
            <Typography fontSize={11} fontWeight={700} color="primary.main" mb={0.3}>
              AI Summary
            </Typography>
            <Typography fontSize={12} lineHeight={1.6} color="text.secondary">
              {insight.summaryLine}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Satisfaction score — the most important single number */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
        <Typography fontSize={11} fontWeight={700} color="text.secondary" mb={1.5} textTransform="uppercase">
          Predicted Satisfaction
        </Typography>
        <Stack direction="row" alignItems="center" gap={2}>
          <SatisfactionRing score={insight.satisfactionScore} size={56} />
          <Box>
            <Typography fontSize={22} fontWeight={800} color={getSatisfactionColor(insight.satisfactionScore)}>
              {insight.satisfactionScore}%
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              {insight.satisfactionScore >= 70 ? 'Customer is happy' :
               insight.satisfactionScore >= 40 ? 'Mixed sentiment' : 'Customer is frustrated'}
            </Typography>
          </Box>
        </Stack>
        <LinearProgress variant="determinate" value={insight.satisfactionScore}
          sx={{ mt: 1.5, height: 6, borderRadius: 3, bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': { bgcolor: getSatisfactionColor(insight.satisfactionScore) } }} />
      </Paper>

      {/* Sentiment + Urgency */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
        <Typography fontSize={11} fontWeight={700} color="text.secondary" mb={1.5} textTransform="uppercase">
          Signals
        </Typography>
        <Stack gap={1.2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontSize={12} color="text.secondary">Sentiment</Typography>
            <Chip
              icon={getSentimentIcon(insight.sentiment)}
              label={insight.sentiment.charAt(0).toUpperCase() + insight.sentiment.slice(1)}
              size="small"
              sx={{ fontSize: 11, height: 22, color: sentColor,
                bgcolor: `${sentColor}18`, fontWeight: 600 }}
            />
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontSize={12} color="text.secondary">Urgency</Typography>
            <Chip label={insight.urgency} size="small" color={getUrgencyColor(insight.urgency) as 'error' | 'warning' | 'success'}
              sx={{ fontSize: 11, height: 22, fontWeight: 600, textTransform: 'capitalize' }} />
          </Stack>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography fontSize={12} color="text.secondary">Intent</Typography>
            <Typography fontSize={12} fontWeight={600} color="text.primary">{insight.intent}</Typography>
          </Stack>
        </Stack>
      </Paper>

      {/* Predicted outcome */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid',
        borderColor: insight.satisfactionScore >= 50 ? 'success.light' : 'error.light',
        bgcolor: insight.satisfactionScore >= 50 ? 'rgba(34,197,94,0.04)' : 'rgba(239,68,68,0.04)',
      }}>
        <Stack direction="row" gap={1} alignItems="center">
          <IconTarget size={16} color={insight.satisfactionScore >= 50 ? '#22c55e' : '#ef4444'} />
          <Box>
            <Typography fontSize={11} fontWeight={700} color="text.secondary">Predicted Outcome</Typography>
            <Typography fontSize={13} fontWeight={700}
              color={insight.satisfactionScore >= 50 ? 'success.dark' : 'error.dark'}>
              {insight.predictedOutcome}
            </Typography>
          </Box>
        </Stack>
      </Paper>

      {/* Topics */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
        <Typography fontSize={11} fontWeight={700} color="text.secondary" mb={1.2} textTransform="uppercase">
          Topics Detected
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={0.8}>
          {insight.topics.map(t => (
            <Chip key={t} label={`# ${t}`} size="small"
              sx={{ fontSize: 11, bgcolor: 'rgba(82,130,255,0.08)', color: 'primary.main',
                fontWeight: 500, height: 22 }} />
          ))}
        </Stack>
      </Paper>

      {/* AI response quality */}
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2.5, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" mb={1}>
          <Typography fontSize={11} fontWeight={700} color="text.secondary" textTransform="uppercase">
            Bot Response Quality
          </Typography>
          <Typography fontSize={13} fontWeight={700}
            color={insight.responseQuality >= 70 ? 'success.main' : 'warning.main'}>
            {insight.responseQuality}%
          </Typography>
        </Stack>
        <LinearProgress variant="determinate" value={insight.responseQuality}
          sx={{ height: 6, borderRadius: 3, bgcolor: 'action.hover',
            '& .MuiLinearProgress-bar': {
              bgcolor: insight.responseQuality >= 70 ? 'success.main' : 'warning.main' } }} />
        <Typography variant="caption" color="text.secondary" mt={0.8} display="block" fontSize={11}>
          {insight.responseQuality >= 80 ? 'Bot handled this conversation excellently'
           : insight.responseQuality >= 60 ? 'Bot performed adequately — a few gaps'
           : 'Bot struggled — review training data'}
        </Typography>
      </Paper>

    </Stack>
  );
};

// ─── Chat View ────────────────────────────────────────────────────────────────

const ChatView = ({
  conv,
  onTakeover,
  onRelease,
}: {
  conv: Conversation;
  onTakeover: (id: string) => void;
  onRelease: (id: string) => void;
}) => {
  const [reply, setReply]   = useState('');
  const [tab, setTab]       = useState<'chat' | 'insights'>('chat');
  const bottomRef           = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conv.messages]);

  const statusCfg = getStatusConfig(conv.status);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Chat header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider',
        background: conv.isHumanTakeover ? 'rgba(245,158,11,0.05)' : 'transparent' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" gap={1.5} alignItems="center">
            <Avatar sx={{ width: 42, height: 42, fontWeight: 700,
              bgcolor: conv.status === 'escalated' ? 'error.light' : 'primary.light' }}>
              {conv.customerName.slice(0, 2).toUpperCase()}
            </Avatar>
            <Box>
              <Stack direction="row" alignItems="center" gap={1}>
                <Typography fontWeight={700} fontSize={15}>{conv.customerName}</Typography>
                <Chip label={statusCfg.label} size="small"
                  sx={{ fontSize: 10, height: 18, bgcolor: statusCfg.bg, color: statusCfg.color, fontWeight: 600 }} />
                {conv.isHumanTakeover && (
                  <Chip icon={<IconUserCheck size={11} />} label="Human Active" size="small"
                    color="warning" sx={{ fontSize: 10, height: 18 }} />
                )}
              </Stack>
              <Stack direction="row" alignItems="center" gap={0.8}>
                <IconPhone size={11} color="gray" />
                <Typography variant="caption" color="text.secondary" fontSize={11}>
                  +{conv.customerPhone}
                </Typography>
                <Typography variant="caption" color="text.disabled">·</Typography>
                <Typography variant="caption" color="text.secondary" fontSize={11}>
                  {conv.messageCount} messages
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" gap={1}>
            {/* Toggle between chat view and AI insights */}
            <ToggleButtonGroup size="small" value={tab} exclusive onChange={(_, v) => v && setTab(v)}>
              <ToggleButton value="chat"     sx={{ px: 1.5, fontSize: 11 }}>Chat</ToggleButton>
              <ToggleButton value="insights" sx={{ px: 1.5, fontSize: 11 }}>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <IconSparkles size={13} />
                  AI Insights
                </Stack>
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Human takeover toggle */}
            {conv.isHumanTakeover ? (
              <Button size="small" variant="outlined" color="success"
                startIcon={<IconRobot size={14} />}
                onClick={() => onRelease(conv.id)}
                sx={{ fontSize: 11, borderRadius: 2 }}>
                Resume Bot
              </Button>
            ) : (
              <Button size="small" variant="outlined" color="warning"
                startIcon={<IconHandStop size={14} />}
                onClick={() => onTakeover(conv.id)}
                sx={{ fontSize: 11, borderRadius: 2 }}>
                Take Over
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Body: either chat messages or AI insights */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

        {tab === 'chat' ? (
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Messages */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5, display: 'flex',
              flexDirection: 'column', gap: 1.5 }}>
              {conv.messages.map((msg) => (
                <Box key={msg.id} sx={{ display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {msg.role === 'assistant' && (
                    <Avatar sx={{ width: 28, height: 28, mr: 1, mt: 0.5, bgcolor: 'primary.main',
                      fontSize: 13, flexShrink: 0 }}>
                      <IconRobot size={15} />
                    </Avatar>
                  )}
                  <Box sx={{
                    maxWidth: '72%', px: 2, py: 1.2,
                    borderRadius: msg.role === 'user'
                      ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                    bgcolor: msg.role === 'user' ? 'primary.main' : 'background.default',
                    border: msg.role === 'assistant' ? '1px solid' : 'none',
                    borderColor: 'divider',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                  }}>
                    <Typography fontSize={13.5} lineHeight={1.6}
                      color={msg.role === 'user' ? 'white' : 'text.primary'}
                      sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {msg.content}
                    </Typography>
                    <Typography fontSize={10} mt={0.5} textAlign="right"
                      color={msg.role === 'user' ? 'rgba(255,255,255,0.6)' : 'text.disabled'}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.role === 'assistant' && ' · AI'}
                      {msg.role === 'user' && !msg.isRead && ' · Unread'}
                    </Typography>
                  </Box>
                  {msg.role === 'user' && (
                    <Avatar sx={{ width: 28, height: 28, ml: 1, mt: 0.5,
                      bgcolor: 'action.selected', fontSize: 11, flexShrink: 0 }}>
                      {conv.customerName.slice(0, 2)}
                    </Avatar>
                  )}
                </Box>
              ))}
              <div ref={bottomRef} />
            </Box>

            {/* Reply box — only shown during human takeover */}
            {conv.isHumanTakeover && (
              <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider',
                bgcolor: 'rgba(245,158,11,0.03)' }}>
                <Typography variant="caption" color="warning.main" fontWeight={600}
                  fontSize={11} display="block" mb={1}>
                  ⚡ Human Mode — you are replying as the business
                </Typography>
                <Stack direction="row" gap={1} alignItems="flex-end">
                  <TextField fullWidth multiline maxRows={3} size="small"
                    placeholder="Type your reply to the customer..."
                    value={reply} onChange={e => setReply(e.target.value)}
                    sx={{ '& fieldset': { borderRadius: 3 } }} />
                  <IconButton disabled={!reply.trim()}
                    sx={{ bgcolor: 'warning.main', color: 'white', borderRadius: 2.5,
                      width: 38, height: 38, flexShrink: 0,
                      '&:hover': { bgcolor: 'warning.dark' },
                      '&:disabled': { bgcolor: 'action.disabledBackground' } }}>
                    <IconSend size={16} />
                  </IconButton>
                </Stack>
              </Box>
            )}

            {/* When bot is active, show a passive indicator */}
            {!conv.isHumanTakeover && conv.status !== 'resolved' && (
              <Box sx={{ px: 2, py: 1.5, borderTop: '1px solid', borderColor: 'divider',
                bgcolor: 'rgba(34,197,94,0.03)' }}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main',
                    animation: 'pulse2 2s infinite',
                    '@keyframes pulse2': {
                      '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } } }} />
                  <Typography fontSize={12} color="success.main" fontWeight={500}>
                    AI agent is handling this conversation
                  </Typography>
                </Stack>
              </Box>
            )}
          </Box>
        ) : (
          // AI Insights tab
          <Box sx={{ flex: 1, overflowY: 'auto', p: 2.5 }}>
            <AIInsightPanel insight={conv.insight} conv={conv} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const ConversationsPage = () => {
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [selectedId, setSelectedId]       = useState<string | null>('1');
  const [search, setSearch]               = useState('');
  const [filterStatus, setFilterStatus]   = useState<string>('all');
  const [filterSentiment, setFilterSentiment] = useState<string>('all');

  const selected = conversations.find(c => c.id === selectedId) ?? null;

  const filtered = conversations.filter(c => {
    const matchSearch = !search ||
      c.customerName.toLowerCase().includes(search.toLowerCase()) ||
      c.customerPhone.includes(search) ||
      c.lastMessage.toLowerCase().includes(search.toLowerCase());
    const matchStatus    = filterStatus    === 'all' || c.status           === filterStatus;
    const matchSentiment = filterSentiment === 'all' || c.insight.sentiment === filterSentiment;
    return matchSearch && matchStatus && matchSentiment;
  });

  const handleTakeover = (id: string) =>
    setConversations(prev => prev.map(c => c.id === id ? { ...c, isHumanTakeover: true } : c));

  const handleRelease = (id: string) =>
    setConversations(prev => prev.map(c => c.id === id ? { ...c, isHumanTakeover: false } : c));

  return (
    <PageContainer title="Conversations" description="Customer conversation management">

      {/* Stats bar */}
      <StatsBar conversations={conversations} />

      {/* Main 3-column layout: filters/list | chat | (insights in chat tabs) */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider',
        borderRadius: 3, overflow: 'hidden', height: 'calc(100vh - 280px)', minHeight: 560,
        display: 'flex' }}>

        {/* ── LEFT: Conversation List ─────────────────────────────── */}
        <Box sx={{ width: 340, flexShrink: 0, borderRight: '1px solid',
          borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>

          {/* Search + filters */}
          <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <TextField
              fullWidth size="small"
              placeholder="Search by name, phone, message..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>,
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearch('')}><IconX size={14} /></IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{ mb: 1.5, '& fieldset': { borderRadius: 2.5 } }}
            />

            <Stack direction="row" gap={1}>
              <FormControl size="small" sx={{ flex: 1 }}>
                <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  sx={{ fontSize: 12, borderRadius: 2 }}>
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="escalated">Escalated</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="waiting">Waiting</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ flex: 1 }}>
                <Select value={filterSentiment} onChange={e => setFilterSentiment(e.target.value)}
                  sx={{ fontSize: 12, borderRadius: 2 }}>
                  <MenuItem value="all">All Sentiment</MenuItem>
                  <MenuItem value="positive">Positive</MenuItem>
                  <MenuItem value="neutral">Neutral</MenuItem>
                  <MenuItem value="negative">Negative</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Box>

          {/* Count */}
          <Box sx={{ px: 2, py: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.secondary" fontSize={11}>
              {filtered.length} conversation{filtered.length !== 1 ? 's' : ''}
              {filterStatus !== 'all' || filterSentiment !== 'all' ? ' (filtered)' : ''}
            </Typography>
          </Box>

          {/* List */}
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
            {filtered.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center', opacity: 0.5 }}>
                <IconMessageCircle size={32} strokeWidth={1} />
                <Typography variant="caption" display="block" mt={1}>No conversations found</Typography>
              </Box>
            ) : (
              filtered.map(c => (
                <ConvListItem
                  key={c.id}
                  conv={c}
                  selected={selectedId === c.id}
                  onClick={() => setSelectedId(c.id)}
                />
              ))
            )}
          </Box>
        </Box>

        {/* ── RIGHT: Chat View ────────────────────────────────────── */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {selected ? (
            <ChatView
              conv={selected}
              onTakeover={handleTakeover}
              onRelease={handleRelease}
            />
          ) : (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 2, opacity: 0.4 }}>
              <IconMessageCircle size={48} strokeWidth={1} />
              <Typography color="text.secondary">Select a conversation to view</Typography>
            </Box>
          )}
        </Box>

      </Paper>
    </PageContainer>
  );
};

export default ConversationsPage;