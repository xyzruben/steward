// ============================================================================
// SUPABASE REALTIME MOCK (see STEWARD_MASTER_SYSTEM_GUIDE.md - Mocking Practices)
// ============================================================================
// Mock for @supabase/realtime-js to prevent Jest ESM import failures

export class RealtimeClient {
  private channels = new Map()

  constructor() {
    this.channels = new Map()
  }

  channel(channelName: string) {
    return {
      on: jest.fn(),
      subscribe: jest.fn(),
      unsubscribe: jest.fn(),
    }
  }

  removeAllChannels() {
    this.channels.clear()
  }
}

export default RealtimeClient 