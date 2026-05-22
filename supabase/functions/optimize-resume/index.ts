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

    // Verify the caller owns the referenced resume and analysis
    if (resumeId) {
      const { data: resumeRow } = await supabase
        .from("resumes").select("user_id").eq("id", resumeId).maybeSingle();
      if (!resumeRow || resumeRow.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }
    if (analysisId) {
      const { data: analysisRow } = await supabase
        .from("analyses").select("user_id").eq("id", analysisId).maybeSingle();
      if (!analysisRow || analysisRow.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    const contactInfo = parsed?.contact || {};
    const experiences = parsed?.experience || [];
    const education = parsed?.education || [];
    const existingProjects = parsed?.projects || [];
    const skills = [...(parsed?.skills || []), ...(parsed?.tools || [])];
    const certifications = parsed?.certifications || [];
    const roleName = jobRoleId.replace(/-/g, " ");

    const experienceBlock = experiences.map((e: any) =>
      `ROLE: ${e.role} | COMPANY: ${e.company} | DURATION: ${e.duration}\nBULLETS:\n${(e.responsibilities || []).map((r: string) => `- ${r}`).join("\n")}`
    ).join("\n\n");

    const educationBlock = education.map((e: any) =>
      `${e.degree} — ${e.institution} (${e.year})${e.field ? ` — ${e.field}` : ""}`
    ).join("\n");

    const projectBlock = existingProjects.map((p: any) =>
      `${p.name}: ${p.description} [${(p.technologies || []).join(", ")}]`
    ).join("\n");

    const hasProjects = existingProjects.length > 0;
    const maxNewProjects = Math.max(0, 2 - existingProjects.length);

    const systemPrompt = `You are a world-class resume optimization expert. Your job is to ENHANCE the resume below while preserving ALL original information.

ABSOLUTE RULES — VIOLATION = FAILURE:
1. Personal info (name, email, phone, location, links) MUST stay EXACTLY as given. DO NOT invent new contact info.
2. ALL company names, job titles, employment dates MUST stay EXACTLY as given.
3. ALL education details MUST stay EXACTLY as given.
4. DO NOT add work experience that doesn't exist. DO NOT add certifications that don't exist.
5. DO NOT add skills the person clearly doesn't have — only add skills that are DIRECTLY inferable from their education, coursework, or listed experience.
6. Keep the SAME number of experience entries. Do not add or remove jobs.

WHAT YOU CAN DO:
a. REWRITE each bullet point to be more impactful with realistic metrics and strong action verbs
b. REWRITE the professional summary to target the ${roleName} role
c. ADD up to ${maxNewProjects} academic/personal projects ONLY IF the person has fewer than 2 projects. Projects must be realistic given their education and skills.
d. ADD skills ONLY if directly inferable from education (e.g., student studying CS can claim Python)
e. IMPROVE wording without changing facts

BULLET ENHANCEMENT — be realistic:
- "Helped clients buy properties" → "Assisted 25+ clients in purchasing residential properties, managing transactions valued at $450K+"
- "Provided customer support" → "Delivered technical support for 100+ daily inquiries, achieving 92% first-contact resolution rate"
- Numbers must be PLAUSIBLE for the role level and company size
- Every bullet should have at least one metric

${maxNewProjects > 0 ? `PROJECT RULES — Create up to ${maxNewProjects} projects that:
- Are realistic given education: ${educationBlock}
- Use ONLY technologies from their skills: ${skills.join(", ")}
- Have 2-3 bullet points with metrics
- Are labeled as academic/personal projects` : "DO NOT add any new projects — the person already has enough."}

TARGET ROLE: ${roleName}
MISSING SKILLS TO CONSIDER: ${(missingSkills || []).join(", ")}`;

    const userPrompt = `RESUME TO OPTIMIZE:

PERSONAL INFO (DO NOT CHANGE):
Name: ${contactInfo.name || "Unknown"}
Email: ${contactInfo.email || ""}
Phone: ${contactInfo.phone || ""}
Location: ${contactInfo.location || ""}
LinkedIn: ${contactInfo.linkedin || ""}
GitHub: ${contactInfo.github || ""}
Telegram: ${contactInfo.telegram || ""}

SKILLS: ${skills.join(", ")}

WORK EXPERIENCE (KEEP ALL COMPANIES/TITLES/DATES):
${experienceBlock || "No work experience listed"}

EDUCATION (DO NOT CHANGE):
${educationBlock || "No education listed"}

EXISTING PROJECTS (KEEP AS-IS, only enhance wording):
${projectBlock || "No projects listed"}

CERTIFICATIONS: ${certifications.join(", ") || "None"}

FULL TEXT:
${resumeText.substring(0, 8000)}

Return the optimized resume. KEEP ALL ORIGINAL FACTS. Only enhance bullets, improve summary, and add max ${maxNewProjects} projects if needed.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
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
                  },
                  description: `Maximum ${Math.min(2, existingProjects.length + maxNewProjects)} projects total`
                },
                changes_made: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", description: "Type: enhanced_bullet, added_metrics, added_skill, added_project, rewritten_summary, stronger_verb" },
                      location: { type: "string" },
                      before: { type: "string" },
                      after: { type: "string" }
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

    // Cap projects at 2 max
    if (optimizedData.projects && optimizedData.projects.length > 2) {
      optimizedData.projects = optimizedData.projects.slice(0, 2);
    }

    const optimizedResumeData = {
      contact: contactInfo,
      education,
      certifications,
      total_years_experience: parsed?.total_years_experience || 0,
      quantified_metrics: parsed?.quantified_metrics || [],
      languages: parsed?.languages || [],
      interests: parsed?.interests || [],
      summary: optimizedData.summary || "",
      experience: optimizedData.experience || experiences,
      skills: optimizedData.skills || parsed?.skills || [],
      tools: optimizedData.tools || parsed?.tools || [],
      projects: optimizedData.projects || existingProjects,
      changes_made: optimizedData.changes_made || [],
    };

    // Build text representation
    const textParts: string[] = [];
    textParts.push(contactInfo.name || "");
    if (contactInfo.email) textParts.push(contactInfo.email);
    if (contactInfo.phone) textParts.push(contactInfo.phone);
    if (contactInfo.location) textParts.push(contactInfo.location);
    if (contactInfo.linkedin) textParts.push(contactInfo.linkedin);
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

    // Score improvement
    const changeCount = (optimizedData.changes_made || []).length;
    const projectBonus = Math.min(2, (optimizedData.projects || []).length) * 3;
    const skillBonus = Math.max(0, (optimizedData.skills || []).length - skills.length) * 1.5;
    const improvementPct = Math.min(25, Math.round(changeCount * 1.5 + projectBonus + skillBonus));
    const afterScore = Math.min(100, currentScore + improvementPct);

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
