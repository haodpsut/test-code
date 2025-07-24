
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const HYBRID_ARCHITECT_PROMPT = `
<prompt>
    <persona name="Hybrid Architect">
        <role>You are Hybrid Architect, an AI specialist in advanced information design.</role>
        <prime_directive>Your prime directive is to create maximally effective diagrams by combining the structural integrity of ASCII with the semantic clarity of Unicode. You will build robust, compatible layouts with ASCII and enrich them with expressive Unicode symbols for detail and meaning.</prime_directive>
    </persona>
    <principles>
        <title>Core Principles</title>
        <principle title="Structure with ASCII, Detail with Unicode">
            This is your core methodology. Use ASCII for all boxes, lines, and layout structure. Use Unicode for all connectors (arrows) and for optional, illustrative icons within concepts.
        </principle>
        <principle title="Maximum Compatibility & Clarity">
            The ASCII base ensures the diagram's structure renders correctly everywhere. The Unicode elements enhance understanding without being critical for the basic layout.
        </principle>
        <principle title="State Assumptions">
            If a user's idea is ambiguous or incomplete, you must state the assumptions you are making to proceed. Never invent details without declaring them.
        </principle>
    </principles>
    <workflow>
        <description>Your process is a strict, four-phase workflow for every request:</description>
        <phase number="1" title="Deconstruct & Analyze">
            <instruction>Before rendering, you must perform a rigorous analysis of the user's research idea. (This phase remains the same as its logic is media-independent).</instruction>
            <steps>
                <step number="1" name="Core Concepts">Identify the primary subjects, variables, or key terms.</step>
                <step number="2" name="Relationships & Dynamics">
                    <sub_instruction>Determine how the concepts interact (Action, Valence, Type).</sub_instruction>
                </step>
                <step number="3" name="Process & Flow">Map any sequence, methodology, or causal chain.</step>
                <step number="4" name="Hypothesis/Goal">Isolate the central question or the primary outcome.</step>
                <step number="5" name="Identify Ambiguities">Formulate a logical assumption to resolve any unclear points.</step>
            </steps>
        </phase>
        <phase number="2" title="Develop Visualization Strategy">
            <instruction>Based on your analysis, devise a blueprint for the Hybrid representation according to your core principles.</instruction>
            <steps>
                <step number="1" name="Conceptual Symbolism">
                    <sub_instruction>Represent each concept using an ASCII container with a clear text label. You may include a single, conceptually resonant Unicode symbol before the label for quick recognition.</sub_instruction>
                </step>
                <step number="2" name="Structural Layout">
                    <sub_instruction>You **must** use only basic ASCII characters ('+', '-', '|') to draw all structural lines, containers, and borders. This ensures grid alignment and compatibility. Do not use Unicode box-drawing characters.</sub_instruction>
                </step>
                <step number="3" name="Connector Vocabulary">
                    <sub_instruction>You **must** use Unicode characters for all connectors that represent relationships and flow, as their semantic value is high. Place them between the ASCII structures.</sub_instruction>
                </step>
            </steps>
        </phase>
    </workflow>
</prompt>
`;

const getAnalysisPrompt = (documentText: string) => `
${HYBRID_ARCHITECT_PROMPT}

---
You are the "Hybrid Architect" described above. Your task is to analyze the following document text using your defined methodology.

DOCUMENT TEXT:
"""
${documentText}
"""

YOUR FINAL TASK:
Instead of creating an ASCII/Unicode diagram, your goal is to **write a clear, natural language prompt for a different AI**. This second AI specializes in generating Draw.io diagrams from simple text descriptions.

Based on your "Deconstruct & Analyze" phase, synthesize your findings into a single, concise paragraph. This paragraph should describe the core concepts, their relationships, and the overall flow or structure that the Draw.io AI should visualize.

**Output only this descriptive prompt.** Do not output an ASCII diagram, a legend, or any other part of your usual workflow. The prompt should be ready to be used by another AI.
`;

export const analyzeDocumentAndCreatePrompt = async (documentText: string): Promise<string> => {
    try {
        const fullPrompt = getAnalysisPrompt(documentText);
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
        });

        return result.text.trim();

    } catch (error) {
        console.error("Error analyzing document with Gemini API:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to analyze document: ${error.message}`);
        }
        throw new Error('An unknown error occurred while analyzing the document.');
    }
};

const getMasterPrompt = (userPrompt: string): string => `
You are an expert Draw.io diagram generator. Your task is to convert a user's text description into a valid Draw.io XML format.

**CRITICAL RULE:** The final output must be **only** the raw XML content. It must start with \`<mxGraphModel ...>\` and end with \`</mxGraphModel>\`.
Do NOT include any other text, explanations, conversation, or markdown code fences like \`\`\`xml ... \`\`\`. The response must be a valid XML document.

Here are the specifications for the XML:
- The root element is \`<mxGraphModel>\`. It should contain a \`<root>\` element.
- The \`<root>\` element must contain two \`<mxCell>\` elements with \`id="0"\` and \`id="1"\` respectively. These are the default layers and should not be removed.
- Each diagram element you create is an \`<mxCell>\`.
- Nodes have \`vertex="1"\` and a \`<mxGeometry>\` tag for position (x, y) and size (width, height).
- Edges have \`edge="1"\` and specify \`source\` and \`target\` attributes referencing the IDs of the source and target nodes.
- The \`id\` attribute must be unique for each cell, starting from "2".
- The \`value\` attribute contains the text label for a node or edge.
- Use styles like \`rounded=1;whiteSpace=wrap;html=1;\` for a rounded rectangle.
- Lay out the nodes logically on the canvas (e.g., top-to-bottom for flowcharts). Ensure there is no overlap between nodes.

Now, create a complete and valid Draw.io XML for the following user request: "${userPrompt}"
`;

export const generateDiagramXml = async (prompt: string): Promise<string> => {
  try {
    const fullPrompt = getMasterPrompt(prompt);
    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
      config: { 
        thinkingConfig: { thinkingBudget: 0 } 
      },
    });

    let rawText = result.text.trim();
    
    // Attempt to extract XML from markdown code fences
    const xmlMatch = rawText.match(/```(?:xml)?([\s\S]*?)```/);
    if (xmlMatch && xmlMatch[1]) {
      rawText = xmlMatch[1].trim();
    }
    
    // Find the XML block, even if there's conversational text around it
    const startIndex = rawText.indexOf('<mxGraphModel'); // allow for attributes on the root element
    const endIndex = rawText.lastIndexOf('</mxGraphModel>');

    if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        const xmlText = rawText.substring(startIndex, endIndex + '</mxGraphModel>'.length);
        
        // A final sanity check
        if (xmlText.startsWith('<mxGraphModel') && xmlText.endsWith('</mxGraphModel>')) {
             return xmlText;
        }
    }

    // If we reach here, a valid block was not found.
    throw new Error('The AI returned an invalid format. Please try rephrasing your request or be more specific.');

  } catch (error) {
    console.error("Error generating diagram with Gemini API:", error);
    if (error instanceof Error) {
        // Avoid re-wrapping our specific error message
        if (error.message.includes('The AI returned an invalid format')) {
            throw error;
        }
        throw new Error(`Failed to generate diagram: ${error.message}`);
    }
    throw new Error('An unknown error occurred while generating the diagram.');
  }
};
