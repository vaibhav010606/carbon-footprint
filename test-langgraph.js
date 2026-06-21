import { createSproutGraph } from './src/agent/graph.js';
import { HumanMessage } from "@langchain/core/messages";

async function test() {
  try {
    const apiKey = process.env.VITE_GEMINI_API_KEYS?.split(',')[0]?.trim();
    if (!apiKey) throw new Error("No API key");

    const systemPrompt = `You are Sprout. Return JSON { "isActivity": true, "activityType": "test", "amount": 1, "unit": "kg", "reply": "hi" }`;
    const graph = createSproutGraph(apiKey, systemPrompt);

    const langChainMessages = [
      new HumanMessage({ content: "hello" })
    ];

    console.log("Invoking graph...");
    const result = await graph.invoke({ messages: langChainMessages });
    console.log("Result:", result.messages[result.messages.length - 1].content);
  } catch (err) {
    console.error("GRAPH ERROR:", err);
  }
}

test();
