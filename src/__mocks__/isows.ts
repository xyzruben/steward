// ============================================================================
// ISOWS MOCK (see STEWARD_MASTER_SYSTEM_GUIDE.md - Mocking Practices)
// ============================================================================
// Mock for isows ESM module to prevent Jest import failures

export const getNativeWebSocket = () => {
  return global.WebSocket || require('ws')
}

export default {
  getNativeWebSocket,
} 