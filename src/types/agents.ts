/**
 * Agent Communication Protocol Types
 * Defines message structure, states, and interfaces for inter-agent communication
 */

// ============================================
// TYPE DEFINITIONS
// ============================================

/**
 * All available agent types in CIMEIKA
 */
export type AgentType =
  | 'ci'        // Центр (Orchestrator)
  | 'podiya'    // Подія (Event)
  | 'nastriy'   // Настрій (Mood)
  | 'malya'     // Маля (Ideas)
  | 'kazkar'    // Казкар (Stories)
  | 'kalendar'  // Календар (Calendar)
  | 'gallery';  // Галерея (Gallery)

/**
 * Agent operational status
 */
export type AgentStatus =
  | 'initializing'  // Starting up
  | 'ready'         // Ready to process messages
  | 'processing'    // Currently handling a message
  | 'error'         // Error state
  | 'sleeping';     // Inactive/dormant

/**
 * Message types for inter-agent communication
 */
export type MessageType =
  | 'command'   // Action instruction
  | 'query'     // Information request
  | 'state'     // State synchronization
  | 'action'    // Completed action notification
  | 'notify';   // General notification

/**
 * Message priority levels
 */
export type MessagePriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'critical';

// ============================================
// INTERFACES
// ============================================

/**
 * Current state of an agent
 * Updated continuously during agent runtime
 */
export interface AgentState {
  /** Unique agent instance ID */
  id: string;

  /** Display name (Українська) */
  name: string;

  /** Agent type */
  type: AgentType;

  /** Current operational status */
  status: AgentStatus;

  /** Version string (e.g., "0.1.0") */
  version: string;

  /** Seconds since agent started */
  uptime_seconds: number;

  /** Total messages processed */
  message_count: number;

  /** Total errors encountered */
  error_count: number;

  /** ISO timestamp of last activity */
  last_activity: string;

  /** ISO timestamp of next scheduled check */
  next_check: string;
}

/**
 * Message structure for inter-agent communication
 */
export interface AgentMessage {
  /** Message type (command, query, state, etc.) */
  type: MessageType;

  /** Sending agent type (optional) */
  from?: AgentType;

  /** Target agent type (optional) */
  to?: AgentType;

  /** Message payload data */
  payload: Record<string, any>;

  /** ISO timestamp when message created */
  timestamp: string;

  /** Unique message ID */
  id: string;

  /** Message priority level (default: 'normal') */
  priority?: MessagePriority;
}

/**
 * Response from agent message processing
 */
export interface AgentResponse {
  /** Success/failure indicator */
  success: boolean;

  /** Response data (if successful) */
  data?: Record<string, any>;

  /** Error message (if failed) */
  error?: string;

  /** Human-readable message */
  message?: string;

  /** ISO timestamp of response */
  timestamp: string;

  /** Which agent generated this response */
  agent?: AgentType;
}

/**
 * Snapshot of agent state at a point in time
 * Used for state persistence and recovery
 */
export interface StateSnapshot {
  /** Agent type */
  agent: AgentType;

  /** When snapshot was taken */
  timestamp: string;

  /** Agent state data */
  state: Record<string, any>;

  /** State schema version */
  version: string;
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Human-readable names for each agent (Українська)
 */
export const AGENT_NAMES: Record<AgentType, string> = {
  ci: 'Ci',
  podiya: 'Подія',
  nastriy: 'Настрій',
  malya: 'Маля',
  kazkar: 'Казкар',
  kalendar: 'Календар',
  gallery: 'Галерея'
};

/**
 * Agent descriptions (Українська)
 */
export const AGENT_DESCRIPTIONS: Record<AgentType, string> = {
  ci: 'Центр керування та оркестрація',
  podiya: 'Майбутнє та події',
  nastriy: 'Емоційні стани та контекст',
  malya: 'Ідеї та альтернативи',
  kazkar: 'Історії та наратив',
  kalendar: 'Час та ритми',
  gallery: 'Візуальний архів'
};

/**
 * All agent types as array (for iteration)
 */
export const ALL_AGENT_TYPES: AgentType[] = [
  'ci',
  'podiya',
  'nastriy',
  'malya',
  'kazkar',
  'kalendar',
  'gallery'
];
