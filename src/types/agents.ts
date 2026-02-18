/**
 * Agent type identifiers
 */
export type AgentType = 'ci' | 'podiya' | 'nastriy' | 'malya' | 'kazkar' | 'kalendar' | 'gallery';

/**
 * Message priority levels
 */
export type MessagePriority = 'low' | 'medium' | 'high' | 'critical';

/**
 * Message type identifiers
 */
export type MessageType = 'request' | 'response' | 'notification' | 'event' | 'command';

/**
 * Health status states
 */
export type HealthState = 'healthy' | 'degraded' | 'unhealthy';

/**
 * Inter-agent message protocol
 */
export interface AgentMessage {
  type: MessageType;
  from: AgentType;
  to: AgentType;
  payload: Record<string, unknown>;
  priority: MessagePriority;
  timestamp: number;
  id: string;
}

/**
 * Agent health status
 */
export interface HealthStatus {
  status: HealthState;
  message: string;
  timestamp: number;
  score: number;
  details?: Record<string, unknown>;
}

/**
 * Base agent state (all agents inherit)
 */
export interface BaseAgentState {
  initialized: boolean;
  lastActivity: number;
  messageCount: number;
  errorCount: number;
}

/**
 * Ci Agent state (orchestrator)
 */
export interface CiAgentState extends BaseAgentState {
  activeAgents: AgentType[];
  systemHealth: HealthState;
  lastHealthCheck: number;
}

/**
 * Podiya Agent state (events)
 */
export interface PodiyaAgentState extends BaseAgentState {
  events: Array<{ id: string; type: string; timestamp: number }>;
  activeListeners: number;
}

/**
 * Nastriy Agent state (moods)
 */
export interface NastriyAgentState extends BaseAgentState {
  currentMood: string;
  moodHistory: Array<{ mood: string; timestamp: number }>;
  moodScore: number;
}

/**
 * Malya Agent state (ideas)
 */
export interface MalyaAgentState extends BaseAgentState {
  ideas: Array<{ id: string; content: string; timestamp: number }>;
  activeIdeaCount: number;
}

/**
 * Kazkar Agent state (stories)
 */
export interface KazkarAgentState extends BaseAgentState {
  stories: Array<{ id: string; title: string; timestamp: number }>;
  totalStories: number;
}

/**
 * Kalendar Agent state (time)
 */
export interface KalendarAgentState extends BaseAgentState {
  scheduledEvents: Array<{ id: string; time: number; description: string }>;
  timezone: string;
}

/**
 * Gallery Agent state (media/R2)
 */
export interface GalleryAgentState extends BaseAgentState {
  mediaCount: number;
  totalSize: number;
  lastUpload: number;
}
