export const evaluateWrittenAnswer = async ({
    question,
    writtenAnswer = "",
    spokenTranscript = "",
    recentConversation = "",
  }) => {
  
    const prompt = `
  You are a senior engineering interviewer conducting a realistic live interview.
  
  Your role is NOT only to evaluate technical answers.
  
  You must also evaluate:
  - communication quality
  - professionalism
  - completeness of responses
  - confidence
  - clarity
  - depth
  
  CURRENT QUESTION:
  ${question}
  
  RECENT CONVERSATION:
  ${recentConversation}
  
  SPOKEN RESPONSE:
  ${spokenTranscript}
  
  WRITTEN RESPONSE:
  ${writtenAnswer}
  
  INTERVIEW RULES:
  
  - If the answer is too short, vague, weak, or incomplete,
    challenge the candidate professionally.
  
  - If the introduction is weak,
    ask the candidate to elaborate on:
    - work experience
    - technical background
    - projects
    - technologies
    - responsibilities
  
  - If technical depth is missing,
    ask probing followups.
  
  - Followups should feel conversational and realistic.
  
  - Behave like a real interviewer.
  
  IMPORTANT:
  - If the candidate gives a weak introduction like:
    "I am Rohit"
  
    then interviewer should explicitly say the answer lacks detail
    and ask for more background.
  
  Return STRICT JSON:
  
  {
    "score": number,
    "feedback": string,
    "strengths": string[],
    "weaknesses": string[],
    "shouldInterrupt": boolean,
    "followupQuestion": string
  }
  `;
  
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
  
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
  
          "Content-Type": "application/json",
        },
  
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
  
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
  
          temperature: 0.3,
  
          response_format: {
            type: "json_object",
          },
        }),
      }
    );
  
    const data = await response.json();
  
    console.log(
      "GROQ RESPONSE:",
      data
    );
  
    const text =
      data.choices[0].message.content;
  
    return JSON.parse(text);
  };