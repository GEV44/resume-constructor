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

    const { resumeText, parsed, jobRoleId, analysisId, resumeId, currentScore, missingSkills, recommendations, mode } = await req.json();
    const optimizeMode: "text" | "design" | "both" = (mode === "text" || mode === "design" || mode === "both") ? mode : "both";

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
    const maxNewProjects = optimizeMode === "design" ? 0 : Math.max(0, 3 - existingProjects.length);

    // === DESIGN-ONLY MODE: skip AI, reuse existing parsed data ===
    if (optimizeMode === "design") {
      const optimizedResumeData = {
        contact: contactInfo,
        education,
        certifications,
        total_years_experience: parsed?.total_years_experience || 0,
        quantified_metrics: parsed?.quantified_metrics || [],
        languages: parsed?.languages || [],
        interests: parsed?.interests || [],
        summary: parsed?.summary || "",
        experience: experiences,
        skills: parsed?.skills || [],
        tools: parsed?.tools || [],
        projects: existingProjects,
        changes_made: [{
          type: "design_refresh",
          location: "Layout",
          before: "Original template",
          after: "Restyled with a modern professional template — content unchanged.",
        }],
      };

      const textParts: string[] = [];
      textParts.push(contactInfo.name || "");
      if (contactInfo.email) textParts.push(contactInfo.email);
      if (contactInfo.phone) textParts.push(contactInfo.phone);
      if (contactInfo.location) textParts.push(contactInfo.location);
      textParts.push("");
      textParts.push(resumeText);

      const storagePayload = JSON.stringify({
        text: textParts.join("\n"),
        structured: optimizedResumeData,
      });

      const afterScore = currentScore; // design-only does not improve content score
      const { error: insertError } = await supabase
        .from("optimized_resumes")
        .insert({
          resume_id: resumeId,
          analysis_id: analysisId,
          user_id: user.id,
          job_role: jobRoleId,
          optimized_text: storagePayload,
          improvement_percentage: 0,
          before_score: currentScore,
          after_score: afterScore,
        });
      if (insertError) throw new Error("Failed to save: " + insertError.message);

      return new Response(JSON.stringify({
        optimized_text: storagePayload,
        before_score: currentScore,
        after_score: afterScore,
        improvement_percentage: 0,
        changes_made: optimizedResumeData.changes_made,
        mode: "design",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const textOnlyNote = optimizeMode === "text"
      ? "\nMODE: TEXT-ONLY REWRITE — Rewrite EVERY bullet to be stronger. Do not add new projects. Focus purely on impact, metrics, and senior phrasing."
      : "\nMODE: FULL OPTIMIZATION — Rewrite bullets, rewrite summary, and may add up to " + maxNewProjects + " realistic projects.";

    const systemPrompt = `You are a world-class resume writer who has crafted resumes for FAANG engineers, McKinsey consultants, and C-suite executives. Produce executive-grade, hard-hitting content.${textOnlyNote}

ABSOLUTE RULES — VIOLATION = FAILURE:
1. Personal info (name, email, phone, location, links) MUST stay EXACTLY as given. DO NOT invent new contact info.
2. ALL company names, job titles, employment dates MUST stay EXACTLY as given.
3. ALL education details MUST stay EXACTLY as given.
4. DO NOT add work experience that doesn't exist. DO NOT add certifications that don't exist.
5. Only add skills directly inferable from the person's education, coursework, or listed experience.
6. Keep the SAME number of experience entries. Do not add or remove jobs.

WHAT YOU CAN DO:
a. REWRITE every bullet as a high-impact, recruiter-magnet statement: strong action verb + scope + quantified outcome + business impact.
b. REWRITE the professional summary as a 3–4 sentence executive-grade pitch targeting the ${roleName} role, packed with trend keywords.
c. EXPAND bullets to 2 lines when it improves clarity. There is NO upper word limit. Be substantive, never sparse.
d. Use 2024–2026 industry vocabulary, modern tools, and current best practices for ${roleName}.
e. ADD up to ${maxNewProjects} realistic projects (if mode allows).
f. ADD skills only if directly inferable from existing experience or education.

BULLET TRANSFORMATION EXAMPLES:
- weak: "Helped clients buy properties"
  strong: "Closed 25+ residential transactions worth $4.5M+ in annual GMV by orchestrating end-to-end buyer journeys, negotiating contracts, and partnering with mortgage/legal counterparts — ranked top 10% of agents in the brokerage."
- weak: "Built a website"
  strong: "Architected and shipped a production React + TypeScript marketing site serving 12K monthly visitors, improving Lighthouse performance from 62 → 96 and lifting lead conversion by 38%."
EVERY bullet must include: strong verb, scope/scale, quantified outcome, and business/user impact. Plausible numbers only.

${maxNewProjects > 0 ? `PROJECT RULES — Create up to ${maxNewProjects} projects that:
- Are realistic given education: ${educationBlock}
- Use ONLY technologies from their skills: ${skills.join(", ")}
- Have 3 bullet points with metrics and modern tooling
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
${resumeText}

Return the optimized resume. KEEP ALL ORIGINAL FACTS. Make every bullet substantially stronger. No length cap on bullets — depth over brevity.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-5",
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
                  description: `Maximum ${Math.min(4, existingProjects.length + maxNewProjects)} projects total`
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

    // Cap projects at 4 max
    if (optimizedData.projects && optimizedData.projects.length > 4) {
      optimizedData.projects = optimizedData.projects.slice(0, 4);
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
    const projectBonus = Math.min(4, (optimizedData.projects || []).length) * 3;
    const skillBonus = Math.max(0, (optimizedData.skills || []).length - skills.length) * 1.5;
    const improvementPct = Math.min(40, Math.round(changeCount * 2 + projectBonus + skillBonus));
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
