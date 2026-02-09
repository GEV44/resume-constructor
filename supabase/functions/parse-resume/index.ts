import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { filePath, fileName } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download the file
    const { data: fileData, error: downloadError } = await supabase.storage.from("resumes").download(filePath);
    if (downloadError) throw new Error("Failed to download file: " + downloadError.message);

    // Convert to text - for now we'll send the raw content to AI for parsing
    const arrayBuffer = await fileData.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    
    // Try to extract text (basic approach - works for text-based PDFs)
    let rawText = "";
    try {
      rawText = new TextDecoder("utf-8", { fatal: false }).decode(uint8);
      // If it's a PDF, extract readable text portions
      if (fileName.toLowerCase().endsWith(".pdf")) {
        const textParts = rawText.match(/\(([^)]+)\)/g)?.map(s => s.slice(1, -1)) || [];
        rawText = textParts.join(" ").replace(/\\n/g, "\n").replace(/\\\(/g, "(").replace(/\\\)/g, ")");
        if (rawText.length < 50) {
          rawText = "Resume file: " + fileName + ". Unable to fully extract text from this PDF. Please provide a text-based PDF for best results.";
        }
      }
    } catch {
      rawText = "Resume file: " + fileName;
    }

    // Use AI to parse the resume into structured JSON
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a resume parser. Extract structured data from resume text. Return ONLY valid JSON with this exact structure:
{
  "contact": {"name": "", "email": "", "phone": ""},
  "education": [{"degree": "", "institution": "", "year": "", "field": ""}],
  "skills": [],
  "tools": [],
  "experience": [{"company": "", "role": "", "duration": "", "years": 0, "responsibilities": []}],
  "projects": [{"name": "", "description": "", "technologies": []}],
  "certifications": [],
  "total_years_experience": 0,
  "quantified_metrics": []
}
Sort skills and tools alphabetically. Extract quantified metrics (numbers, percentages, dollar amounts). Calculate total years from experience entries. If data is missing, use empty arrays/strings.`
          },
          { role: "user", content: `Parse this resume:\n\n${rawText.substring(0, 8000)}` }
        ],
        tools: [{
          type: "function",
          function: {
            name: "parse_resume",
            description: "Parse a resume into structured JSON",
            parameters: {
              type: "object",
              properties: {
                contact: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                    phone: { type: "string" }
                  },
                  required: ["name", "email", "phone"]
                },
                education: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      degree: { type: "string" },
                      institution: { type: "string" },
                      year: { type: "string" },
                      field: { type: "string" }
                    },
                    required: ["degree", "institution", "year", "field"]
                  }
                },
                skills: { type: "array", items: { type: "string" } },
                tools: { type: "array", items: { type: "string" } },
                experience: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      company: { type: "string" },
                      role: { type: "string" },
                      duration: { type: "string" },
                      years: { type: "number" },
                      responsibilities: { type: "array", items: { type: "string" } }
                    },
                    required: ["company", "role", "duration", "years", "responsibilities"]
                  }
                },
                projects: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      technologies: { type: "array", items: { type: "string" } }
                    },
                    required: ["name", "description", "technologies"]
                  }
                },
                certifications: { type: "array", items: { type: "string" } },
                total_years_experience: { type: "number" },
                quantified_metrics: { type: "array", items: { type: "string" } }
              },
              required: ["contact", "education", "skills", "tools", "experience", "projects", "certifications", "total_years_experience", "quantified_metrics"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "parse_resume" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      throw new Error("AI parsing failed");
    }

    const aiData = await aiResponse.json();
    let parsed;
    
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      parsed = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try to extract JSON from content
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    }

    if (!parsed) throw new Error("Failed to parse resume content");

    // Sort skills and tools alphabetically
    if (parsed.skills) parsed.skills.sort();
    if (parsed.tools) parsed.tools.sort();

    return new Response(JSON.stringify({ parsed, text: rawText.substring(0, 10000) }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("parse-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
