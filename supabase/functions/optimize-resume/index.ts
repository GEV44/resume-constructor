import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Not authenticated");

    const { resumeText, parsed, jobRoleId, analysisId, resumeId, currentScore, missingSkills, recommendations } = await req.json();

    // Build detailed context about the original resume
    const contactInfo = parsed?.contact || {};
    const experiences = parsed?.experience || [];
    const education = parsed?.education || [];
    const projects = parsed?.projects || [];
    const skills = [...(parsed?.skills || []), ...(parsed?.tools || [])];
    const certifications = parsed?.certifications || [];

    const experienceDetails = experiences.map((e: any) =>
      `ROLE: ${e.role} | COMPANY: ${e.company} | DURATION: ${e.duration}\nBULLETS:\n${(e.responsibilities || []).map((r: string) => `- ${r}`).join("\n")}`
    ).join("\n\n");

    const educationDetails = education.map((e: any) =>
      `${e.degree} — ${e.institution} (${e.year})${e.field ? ` — ${e.field}` : ""}`
    ).join("\n");

    const projectDetails = projects.map((p: any) =>
      `${p.name}: ${p.description} [${(p.technologies || []).join(", ")}]`
    ).join("\n");

    const systemPrompt = `You are an expert resume optimizer. You will receive a resume and must return an ENHANCED version as a structured JSON object.

ABSOLUTE RULES — VIOLATION = FAILURE:
1. KEEP the person's EXACT name, email, phone, location, links — NEVER change personal info
2. KEEP all company names, job titles, and dates EXACTLY as they are
3. KEEP all education details EXACTLY (degrees, schools, years)
4. ONLY enhance bullet points with better wording, stronger action verbs, and realistic quantified metrics
5. NEVER invent new jobs, companies, or degrees
6. You MAY add a "Projects" section IF the person's education/coursework suggests relevant projects — but mark them as academic/personal projects
7. You MAY add missing skills to the skills list ONLY if they are reasonably inferable from the person's education and coursework
8. REWRITE the professional summary to target the specific role

ENHANCEMENT RULES FOR BULLETS:
- "Helped clients buy properties" → "Assisted 25+ clients in purchasing residential and commercial properties, managing transactions valued at $450K+"
- "Provided customer support" → "Delivered technical support for 100+ daily inquiries, achieving 92% first-contact resolution rate"
- Add realistic metrics: team sizes, percentages, dollar amounts, user counts
- Use strong action verbs: Spearheaded, Orchestrated, Architected, Delivered, Optimized, Analyzed
- Keep the TRUTH of what they did, just make it sound more impactful

TARGET ROLE: ${jobRoleId.replace(/-/g, " ")}
MISSING SKILLS TO INCORPORATE (only if truthful): ${(missingSkills || []).join(", ")}
RECOMMENDATIONS: ${(recommendations || []).join("; ")}`;

    const userPrompt = `Here is the resume to optimize:

PERSONAL INFO:
Name: ${contactInfo.name || "Unknown"}
Email: ${contactInfo.email || ""}
Phone: ${contactInfo.phone || ""}

CURRENT SKILLS: ${skills.join(", ")}

WORK EXPERIENCE:
${experienceDetails || "No work experience listed"}

EDUCATION:
${educationDetails || "No education listed"}

PROJECTS:
${projectDetails || "No projects listed"}

CERTIFICATIONS: ${certifications.join(", ") || "None"}

FULL RESUME TEXT (for additional context):
${resumeText.substring(0, 6000)}

Return the optimized resume using the tool provided. Keep ALL original information intact. Only enhance wording, add metrics, and improve structure.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_optimized_resume",
            description: "Return the optimized resume as structured data",
            parameters: {
              type: "object",
              properties: {
                summary: { type: "string", description: "Professional summary targeting the role (2-3 sentences)" },
                experience: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      role: { type: "string" },
                      company: { type: "string" },
                      duration: { type: "string" },
                      years: { type: "number" },
                      responsibilities: { type: "array", items: { type: "string" } }
                    },
                    required: ["role", "company", "duration", "years", "responsibilities"]
                  }
                },
                skills: { type: "array", items: { type: "string" } },
                tools: { type: "array", items: { type: "string" } },
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
                changes_made: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", description: "Type: enhanced_bullet, added_metrics, added_skill, added_project, rewritten_summary, stronger_verb" },
                      location: { type: "string", description: "Where in the resume this change was made" },
                      before: { type: "string", description: "Original text (empty if new addition)" },
                      after: { type: "string", description: "New/improved text" }
                    },
                    required: ["type", "location", "before", "after"]
                  }
                }
              },
              required: ["summary", "experience", "skills", "tools", "projects", "changes_made"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "return_optimized_resume" } },
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const body = await aiResponse.text();
      console.error("AI error:", status, body);
      throw new Error("AI optimization failed");
    }

    const aiData = await aiResponse.json();
    let optimizedData: any;

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      optimizedData = JSON.parse(toolCall.function.arguments);
    } else {
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) optimizedData = JSON.parse(jsonMatch[0]);
    }

    if (!optimizedData) throw new Error("Failed to generate optimized resume");

    // Build the complete optimized resume data structure (preserving original contact & education)
    const optimizedResumeData = {
      contact: contactInfo,
      education: education,
      certifications: certifications,
      total_years_experience: parsed?.total_years_experience || 0,
      quantified_metrics: parsed?.quantified_metrics || [],
      summary: optimizedData.summary || "",
      experience: optimizedData.experience || experiences,
      skills: optimizedData.skills || parsed?.skills || [],
      tools: optimizedData.tools || parsed?.tools || [],
      projects: optimizedData.projects || projects,
      changes_made: optimizedData.changes_made || [],
    };

    // Build optimized text representation
    const textParts = [];
    textParts.push(contactInfo.name || "");
    if (contactInfo.email) textParts.push(contactInfo.email);
    if (contactInfo.phone) textParts.push(contactInfo.phone);
    textParts.push("");
    if (optimizedData.summary) {
      textParts.push("PROFESSIONAL SUMMARY");
      textParts.push(optimizedData.summary);
      textParts.push("");
    }
    textParts.push("SKILLS");
    textParts.push((optimizedData.skills || []).join(", "));
    if ((optimizedData.tools || []).length > 0) {
      textParts.push("Tools: " + optimizedData.tools.join(", "));
    }
    textParts.push("");
    textParts.push("EXPERIENCE");
    for (const exp of (optimizedData.experience || [])) {
      textParts.push(`${exp.role} — ${exp.company} (${exp.duration})`);
      for (const r of (exp.responsibilities || [])) {
        textParts.push(`• ${r}`);
      }
      textParts.push("");
    }
    if ((optimizedData.projects || []).length > 0) {
      textParts.push("PROJECTS");
      for (const proj of optimizedData.projects) {
        textParts.push(`${proj.name} [${(proj.technologies || []).join(", ")}]`);
        textParts.push(proj.description);
        textParts.push("");
      }
    }
    textParts.push("EDUCATION");
    for (const edu of education) {
      textParts.push(`${edu.degree} — ${edu.institution} (${edu.year})`);
    }
    if (certifications.length > 0) {
      textParts.push("");
      textParts.push("CERTIFICATIONS");
      textParts.push(certifications.join(", "));
    }

    const optimizedText = textParts.join("\n");

    // Estimate improvement based on changes
    const changeCount = (optimizedData.changes_made || []).length;
    const improvementPct = Math.min(30, Math.round(changeCount * 2 + (missingSkills?.length || 0) * 1.5));
    const afterScore = Math.min(100, currentScore + improvementPct);

    // Save to DB - store the structured data as JSON in optimized_text field 
    // We'll store both the text and structured data
    const storagePayload = JSON.stringify({
      text: optimizedText,
      structured: optimizedResumeData,
    });

    const { error: insertError } = await supabase
      .from("optimized_resumes")
      .insert({
        resume_id: resumeId,
        analysis_id: analysisId,
        user_id: user.id,
        job_role: jobRoleId,
        optimized_text: storagePayload,
        improvement_percentage: improvementPct,
        before_score: currentScore,
        after_score: afterScore,
      });

    if (insertError) throw new Error("Failed to save optimization: " + insertError.message);

    return new Response(JSON.stringify({
      optimized_text: storagePayload,
      before_score: currentScore,
      after_score: afterScore,
      improvement_percentage: improvementPct,
      changes_made: optimizedData.changes_made || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("optimize-resume error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
