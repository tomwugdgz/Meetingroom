import { GoogleGenAI, Type } from "@google/genai";
import { Message, Role, MeetingSummary } from '../types';

const getClient = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("API_KEY environment variable is not set.");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateRoleResponse = async (
    role: Role,
    history: Message[],
    currentPrompt: string
): Promise<string> => {
    const ai = getClient();
    
    // Construct conversation history for context
    const contextStr = history.map(m => `${m.roleName}: ${m.content}`).join('\n');
    const fullPrompt = `
    Context of the meeting so far:
    ${contextStr}

    User's new input: ${currentPrompt}

    Please respond to the User's input while considering the meeting context.
    Keep your response concise (under 200 words) unless detailed technical advice is needed.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: fullPrompt,
            config: {
                systemInstruction: role.systemPrompt,
                temperature: 0.7,
            }
        });
        return response.text || "Thinking...";
    } catch (error) {
        console.error("Error generating role response:", error);
        return "I apologize, I'm having trouble connecting right now.";
    }
};

export const generateMeetingSummary = async (history: Message[]): Promise<MeetingSummary> => {
    const ai = getClient();
    const contextStr = history.map(m => `${m.roleName}: ${m.content}`).join('\n');

    const schema = {
        type: Type.OBJECT,
        properties: {
            topic: { type: Type.STRING, description: "Main topic of discussion" },
            keyPoints: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: "List of key arguments or points made (Meeting Minutes style)"
            },
            actionItems: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        task: { type: Type.STRING },
                        owner: { type: Type.STRING },
                        status: { type: Type.STRING, enum: ["Pending", "InProgress", "Done"] }
                    }
                }
            },
            conclusion: { type: Type.STRING, description: "Final consensus or summary" },
            decisionTree: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        step: { type: Type.STRING, description: "Phase or key question in the thought process" },
                        options: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "Key considerations, arguments, or options discussed at this phase"
                        }
                    }
                },
                description: "A chronological organization of the communication thought process and decision logic."
            }
        },
        required: ["topic", "keyPoints", "conclusion", "decisionTree"]
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are a professional meeting secretary. 
            Analyze the following meeting transcript and generate a structured set of Meeting Minutes and a Thought Process Organization.
            
            1. Extract the main topic.
            2. List key points as formal meeting minutes.
            3. Extract action items with owners.
            4. Create a "Communication Thought Process" visualization (mapped to 'decisionTree') that shows the logical flow of the discussion, from the initial problem to the final solution, highlighting how different perspectives contributed.
            
            Transcript:
            ${contextStr}`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema
            }
        });

        const jsonStr = response.text || "{}";
        return JSON.parse(jsonStr) as MeetingSummary;
    } catch (error) {
        console.error("Error generating summary:", error);
        return {
            topic: "Error generating summary",
            keyPoints: [],
            actionItems: [],
            conclusion: "Could not generate summary."
        };
    }
};
