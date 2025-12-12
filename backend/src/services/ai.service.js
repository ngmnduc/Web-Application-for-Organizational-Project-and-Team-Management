import Groq from "groq-sdk";
import Bottleneck from "bottleneck";
import dotenv from "dotenv";

dotenv.config();

// Khởi tạo Groq SDK
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY, 
});
const limiter = new Bottleneck({
  minTime: 2500,        
  maxConcurrent: 2,     
  reservoir: 30,
  reservoirRefreshAmount: 30,
  reservoirRefreshInterval: 60 * 1000,
});

limiter.on("failed", async (error, jobInfo) => {
  const id = jobInfo.options.id;
  console.warn(`Job ${id} failed: ${error.message}`);
  
  if (error.message.includes("429") && jobInfo.retryCount < 3) {
    const delay = 3000 * Math.pow(2, jobInfo.retryCount);
    console.log(`Retry Job ${id} in ${delay}ms`);
    return delay;
  }
});

class AIService {
  
  /**
   * Generate Subtasks (Groq + Llama 3.3)
   */
  static async generateSubtasks(taskTitle, taskDescription) {
    return limiter.schedule(async () => {
      try {
        console.log(`[Groq] Generating subtasks for: "${taskTitle}"...`);

        const cleanDesc = taskDescription ? taskDescription.trim() : "No additional details provided.";
        
        const prompt = `
          You are a strict task management assistant.
          Objective: Break down the following task into 3 to 5 small, concrete, actionable subtasks.

          --- INPUT DATA ---
          MAIN GOAL (Title): "${taskTitle}"
          CONTEXT & DETAILS (Description): "${cleanDesc}"
          ------------------

          INSTRUCTIONS:
          1. Analyze the 'MAIN GOAL' combined with 'CONTEXT'.
          2. If the description provides specific tools, formats, or deadlines, include them in the steps.
          3. If the description is empty, infer standard best practices based on the title.
          
          OUTPUT RULES (Strictly Follow):
          1. Language: English.
          2. Format: A raw JSON Array of strings.
          3. Content style: "Step 1: [Action verb] [Specific detail]", "Step 2: ..."
          4. NO Markdown, NO explanations, NO code blocks.
          5. Return ONLY the Array.

          Example Output:
          ["Step 1: Draft the initial outline based on Q3 data", "Step 2: Review specific KPIs mentioned in email", "Step 3: Export final report to PDF"]
        `;

        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "user", content: prompt }
          ],
          temperature: 0.5, // Giảm temp để kết quả ổn định hơn
          max_tokens: 1024,
        });

        let text = response.choices[0]?.message?.content || "[]";

        // Cleaning Data 
        text = text.replace(/```json|```/g, '').trim();
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
            text = text.substring(firstBracket, lastBracket + 1);
        }

        try {
          const subtasks = JSON.parse(text);
          if (!Array.isArray(subtasks)) throw new Error("Not an array");
          return subtasks;
        } catch (parseError) {
          console.error("Groq JSON Parse Error:", parseError);
          // Fallback
          return text.split("\n").filter(line => line.length > 0 && line.includes("Step"));
        }

      } catch (error) {
        console.error("Groq Service Error (Subtasks):", error.message);
        return [];
      }
    });
  }

  /**
   * Summarize Day 
   */
  static async summarizeDay(tasks = [], meetings = []) {
    return limiter.schedule(async () => {
      try {
        console.log(`[Groq] Summarizing day...`);

        const taskList = tasks.length > 0 
          ? tasks.slice(0, 15).map(t => `- Title: "${t.title}" | Status: ${t.status} | Labels: ${t.labels?.join(', ') || 'None'}`).join("\n") 
          : "No tasks today.";
          
        const meetingList = meetings.length > 0 
          ? meetings.map(m => `- ${m.title} @ ${m.time}`).join("\n") 
          : "No meetings today.";

        // --- PROMPT TỐI ƯU (GIỮ NGUYÊN) ---
        const prompt = `
          Act as a professional personal assistant.
          Analyze the following data for today:
          
          TASKS:
          ${taskList}
          
          MEETINGS:
          ${meetingList}

          Action: Generate a daily briefing in strict JSON format.
          Language: English.
          
          OUTPUT JSON STRUCTURE:
          {
            "greeting": "A short summary sentence stating how many tasks and meetings user has (e.g., 'You have 3 tasks and 1 meeting today.')",
            "task_highlights": [
              {
                "title": "Task Title",
                "label": "First label found or 'General'",
                "summary": "A very short 1-sentence prediction of what needs to be done based on the title."
              }
            ],
            "upcoming_meetings": [
              { "title": "Meeting Name", "time": "Time" }
            ],
            "encouragement": "A short, professional motivating sentence."
          }

          RULES:
          1. Return ONLY the JSON object. No futher explaination after the response.
          2. No Markdown blocks (no \`\`\`json).
          3. If no tasks/meetings, return empty arrays but keep the structure.
        `;

        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          // Dùng json_object 
          response_format: { type: "json_object" }, 
          messages: [
            { 
              role: "system", 
              content: "You are a helpful assistant that outputs strict JSON." 
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 1024,
        });

        const content = response.choices[0]?.message?.content;
        return JSON.parse(content);

      } catch (error) {
        console.error("Groq Service Error (Summary):", error.message);
        return {
            greeting: "System is busy.",
            task_highlights: [],
            upcoming_meetings: [],
            encouragement: "Please try again later!"
        };
      }
    });
  }
}

export default AIService;