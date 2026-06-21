import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage } from "@langchain/core/messages";

// Define the state schema for our graph
export const AgentState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

/**
 * Creates the Sprout LangGraph agent.
 * We use a factory function so we can pass dynamic credentials and the highly-dynamic system prompt.
 */
export const createSproutGraph = (apiKey, systemPrompt) => {
  const callModel = async (state) => {
    const { messages } = state;
    
    // Initialize the LangChain Google GenAI model
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      apiKey: apiKey,
      temperature: 0.2,
      maxOutputTokens: 8192,
    });

    // Inject the system prompt dynamically into the conversation history
    const fullMessages = [
      new SystemMessage(systemPrompt),
      ...messages
    ];

    // Invoke the model
    const response = await model.invoke(fullMessages);
    
    // Return the new state update
    return { messages: [response] };
  };

  // Define the basic state graph
  // Right now this is a single pass graph, but it acts as a foundation
  // to easily add cyclical tool-calling edges in the future.
  const workflow = new StateGraph(AgentState)
    .addNode("agent", callModel)
    .addEdge(START, "agent")
    .addEdge("agent", END);

  return workflow.compile();
};
