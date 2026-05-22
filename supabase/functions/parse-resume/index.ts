import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const { filePath, fileName } = await req.json();
    if (typeof filePath !== "string" || typeof fileName !== "string") {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
    // Verify the caller owns the requested file (path is prefixed with their user id)
    if (!filePath.startsWith(`${user.id}/`)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage.from("resumes").download(filePath);
    if (downloadError) throw new Error("Failed to download file: " + downloadError.message);

    const arrayBuffer = await fileData.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);
    const b64 = base64Encode(uint8);

    const isPdf = fileName.toLowerCase().endsWith(".pdf");
    const mimeType = isPdf ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    // Send the file as base64 to Gemini for multimodal parsing
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
            content: `You are a resume parser. Extract structured data from the resume document. Return ONLY valid JSON with this exact structure:
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
          {
            role: "user",
            content: [
              { type: "text", text: "Parse this resume document and extract all structured information:" },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${b64}`
                }
              }
            ]
          }
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
                quantified_metrics: { type: "array", items: { type: "string" } },
                extracted_text: { type: "string", description: "The full plain text extracted from the resume" }
              },
              required: ["contact", "education", "skills", "tools", "experience", "projects", "certifications", "total_years_experience", "quantified_metrics", "extracted_text"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "parse_resume" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const body = await aiResponse.text();
      console.error("AI response error:", status, body);
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
      throw new Error("AI parsing failed: " + body.substring(0, 200));
    }

    const aiData = await aiResponse.json();
    let parsed;
    let extractedText = "";

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      parsed = JSON.parse(toolCall.function.arguments);
      extractedText = parsed.extracted_text || "";
      delete parsed.extracted_text;
    } else {
      // Fallback: try to extract JSON from content
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
        extractedText = parsed.extracted_text || content;
        delete parsed.extracted_text;
      }
    }

    if (!parsed) throw new Error("Failed to parse resume content");

    // Sort skills and tools alphabetically for determinism
    if (parsed.skills) parsed.skills.sort();
    if (parsed.tools) parsed.tools.sort();

    // If we didn't get extracted text, create a summary from parsed data
    if (!extractedText) {
      const parts = [];
      if (parsed.contact?.name) parts.push(parsed.contact.name);
      if (parsed.skills?.length) parts.push("Skills: " + parsed.skills.join(", "));
      if (parsed.experience?.length) {
        parts.push(parsed.experience.map((e: any) => `${e.role} at ${e.company} (${e.duration}): ${e.responsibilities.join("; ")}`).join("\n"));
      }
      extractedText = parts.join("\n\n");
    }

    console.log("Parse successful:", { skills: parsed.skills?.length, experience: parsed.experience?.length });

    return new Response(JSON.stringify({ parsed, text: extractedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("parse-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
