import { Mastra } from "@mastra/core";
import { feedbackSummaryAgent } from "./agents/feedback-summary-agent";

export const mastra = new Mastra({
  agents: { feedbackSummaryAgent },
});
