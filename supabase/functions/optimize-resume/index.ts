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

    const contactInfo = parsed?.contact || {};
    const experiences = parsed?.experience || [];
    const education = parsed?.education || [];
    const projects = parsed?.projects || [];
    const skills = [...(parsed?.skills || []), ...(parsed?.tools || [])];
    const certifications = parsed?.certifications || [];
    const roleName = jobRoleId.replace(/-/g, " ");

    const experienceBlock = experiences.map((e: any) =>
      `ROLE: ${e.role} | COMPANY: ${e.company} | DURATION: ${e.duration}\nBULLETS:\n${(e.responsibilities || []).map((r: string) => `- ${r}`).join("\n")}`
    ).join("\n\n");

    const educationBlock = education.map((e: any) =>
      `${e.degree} — ${e.institution} (${e.year})${e.field ? ` — ${e.field}` : ""}`
    ).join("\n");

    const projectBlock = projects.map((p: any) =>
      `${p.name}: ${p.description} [${(p.technologies || []).join(", ")}]`
    ).join("\n");

    const systemPrompt = `You are a world-class resume optimization expert. Your job is to take the EXACT resume below and create an ENHANCED version.

ABSOLUTE IRON-CLAD RULES — BREAKING ANY = COMPLETE FAILURE:
1. The person's name, email, phone, location, and links MUST remain EXACTLY as given. Do NOT change, rephrase, or translate them.
2. ALL company names, job titles, and employment dates MUST remain EXACTLY as given.
3. ALL education details (degrees, schools, years, fields) MUST remain EXACTLY as given.
4. You MUST preserve EVERY section and EVERY piece of information from the original resume.
5. You are ONLY allowed to:
   a. REWRITE bullet points to be more impactful with realistic quantified metrics and strong action verbs
   b. REWRITE the professional summary to target the ${roleName} role
   c. ADD missing skills to the skills list ONLY if they are reasonably inferable from education/coursework
   d. ADD a Projects section with 3-4 realistic projects derived from the person's education, coursework, and skills — these should be presented as academic/personal projects
   e. IMPROVE wording and structure without changing factual content

BULLET ENHANCEMENT EXAMPLES:
- "Helped clients buy properties" → "Assisted 25+ clients in purchasing residential and commercial properties, managing transactions valued at $450K+ and maintaining a 95% client satisfaction rate"
- "Provided customer support" → "Delivered technical support for 100+ daily inquiries, achieving 92% first-contact resolution rate with an average response time under 5 minutes"
- "Built relationships with clients" → "Cultivated trust-based relationships with 40+ clients through personalized consultations, resulting in 30% repeat business rate"

QUANTIFICATION RULES:
- Add realistic numbers: team sizes (5-50), percentages (15-95%), dollar amounts ($10K-$5M), user/client counts (25-500+), time improvements (20-60%)
- Numbers must be PLAUSIBLE for the role and company size
- Every bullet should have at least one metric

PROJECT CREATION RULES — Create 3-4 projects that:
- Are realistic given the person's education (${educationBlock})
- Use technologies from their skills: ${skills.join(", ")}
- Have detailed descriptions with quantified results
- Are labeled as academic/personal/coursework projects
- Each project must have 2-3 bullet points with metrics

TARGET ROLE: ${roleName}
MISSING SKILLS TO INCORPORATE: ${(missingSkills || []).join(", ")}
RECOMMENDATIONS TO ADDRESS: ${(recommendations || []).join("; ")}`;

    const userPrompt = `HERE IS THE EXACT RESUME TO OPTIMIZE:

PERSONAL INFO (DO NOT CHANGE):
Name: ${contactInfo.name || "Unknown"}
Email: ${contactInfo.email || ""}
Phone: ${contactInfo.phone || ""}
Location: ${contactInfo.location || ""}
LinkedIn: ${contactInfo.linkedin || ""}

CURRENT SKILLS: ${skills.join(", ")}

WORK EXPERIENCE (KEEP ALL COMPANIES/TITLES/DATES EXACTLY):
${experienceBlock || "No work experience listed"}

EDUCATION (DO NOT CHANGE):
${educationBlock || "No education listed"}

EXISTING PROJECTS:
${projectBlock || "No projects listed — CREATE 3-4 relevant projects"}

CERTIFICATIONS: ${certifications.join(", ") || "None"}

FULL RESUME TEXT:
${resumeText.substring(0, 8000)}

Return the optimized resume using the tool. Remember: KEEP ALL ORIGINAL FACTS, only enhance bullets, add projects, and improve skills list.`;

    // Use the most powerful model for optimization
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
                  }
                },
                changes_made: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", description: "Type: enhanced_bullet, added_metrics, added_skill, added_project, rewritten_summary, stronger_verb" },
                      location: { type: "string", description: "Where in the resume" },
                      before: { type: "string", description: "Original text (empty if new)" },
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

    // Build complete optimized data (preserving originals)
    const optimizedResumeData = {
      contact: contactInfo,
      education,
      certifications,
      total_years_experience: parsed?.total_years_experience || 0,
      quantified_metrics: parsed?.quantified_metrics || [],
      summary: optimizedData.summary || "",
      experience: optimizedData.experience || experiences,
      skills: optimizedData.skills || parsed?.skills || [],
      tools: optimizedData.tools || parsed?.tools || [],
      projects: optimizedData.projects || projects,
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
    const projectBonus = (optimizedData.projects || []).length * 3;
    const skillBonus = Math.max(0, (optimizedData.skills || []).length - skills.length) * 1.5;
    const improvementPct = Math.min(30, Math.round(changeCount * 1.5 + projectBonus + skillBonus));
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
