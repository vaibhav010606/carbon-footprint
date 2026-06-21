import { StateGraph, START, END, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { SystemMessage } from "@langchain/core/messages";

/**
 * State schema for the Sprout LangGraph agent.
 * Messages accumulate via the array reducer.
 * @type {import("@langchain/langgraph").AnnotationRoot}
 */
export const AgentState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
});

/**
 * Factory function that creates a compiled Sprout LangGraph agent.
 * Using a factory pattern allows dynamic injection of credentials and the
 * context-aware system prompt, which changes based on the user's logged activities.
 *
 * @param {string} apiKey - The Gemini API key for this session.
 * @param {string} systemPrompt - The context-rich system prompt for the agent.
 * @returns {import("@langchain/langgraph").CompiledGraph} The compiled LangGraph agent.
 */
export const createSproutGraph = (apiKey, systemPrompt) => {
  /**
   * Primary LangChain node: calls the Gemini model with full message history.
   * @param {typeof AgentState.State} state - Current graph state.
   * @returns {Promise<Partial<typeof AgentState.State>>} State update with model response.
   */
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

    try {
      // Invoke the model and return the new state update
      const response = await model.invoke(fullMessages);
      return { messages: [response] };
    } catch (error) {
      throw new Error(`Sprout agent model invocation failed: ${error.message}`);
    }
  };

  // Define the basic state graph.
  // Currently a single-pass graph, designed to easily extend with
  // cyclical tool-calling edges for more complex agentic workflows.
  const workflow = new StateGraph(AgentState)
    .addNode("agent", callModel)
    .addEdge(START, "agent")
    .addEdge("agent", END);

  return workflow.compile();
};
