import api, { BASE_URL } from "@/lib/api";
import { USER_TOKEN, USER_KEY } from "@/lib/constants";

/** A single side-bot conversation turn as stored/sent to the backend. */
export interface EditorThreadMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  changes_made?: string | null;
  created_at?: string | null;
}

export interface EditorThread {
  action_id: string;
  campaign_id?: string | null;
  messages: EditorThreadMessage[];
}

class EmailEditorThreadService {
  /** Load the saved conversation for an action (empty thread if none yet). */
  async getThread(actionId: string): Promise<EditorThread> {
    try {
      const response = await api.get(`/workflow/action/${actionId}/editor-thread`);
      const data = response?.data ?? {};
      return {
        action_id: actionId,
        campaign_id: data.campaign_id ?? null,
        messages: Array.isArray(data.messages) ? data.messages : [],
      };
    } catch (error) {
      console.error("Error loading editor thread:", error);
      // Non-fatal: the editor should still open with a fresh conversation.
      return { action_id: actionId, messages: [] };
    }
  }

  /** Persist (auto-save) the conversation. Best-effort; never throws. */
  async saveThread(
    actionId: string,
    campaignId: string | undefined,
    messages: EditorThreadMessage[]
  ): Promise<void> {
    try {
      await api.put(`/workflow/action/${actionId}/editor-thread`, {
        campaign_id: campaignId,
        messages,
      });
    } catch (error) {
      console.error("Error saving editor thread:", error);
    }
  }

  /**
   * Fire-and-forget save that survives a page unload. Uses fetch({keepalive})
   * rather than sendBeacon because the API requires Authorization + x-api-key
   * headers, which sendBeacon cannot set.
   */
  saveThreadOnUnload(
    actionId: string,
    campaignId: string | undefined,
    messages: EditorThreadMessage[]
  ): void {
    try {
      const base = (BASE_URL || "").replace(/\/$/, "");
      const url = `${base}/workflow/action/${actionId}/editor-thread`;
      const token =
        localStorage.getItem(USER_TOKEN) ?? localStorage.getItem("_ms-mid") ?? "";
      const apiKey = localStorage.getItem(USER_KEY) ?? "";
      void fetch(url, {
        method: "PUT",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-api-key": apiKey,
        },
        body: JSON.stringify({ campaign_id: campaignId, messages }),
      }).catch(() => {});
    } catch (error) {
      console.error("Error saving editor thread on unload:", error);
    }
  }
}

export const emailEditorThreadService = new EmailEditorThreadService();
