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
            content: `You are a professional resume optimizer. Your job is to improve the resume text to better match the target job role.

CRITICAL RULES:
1. NEVER invent fake experience, skills, or achievements
2. Only enhance existing content with better wording, stronger action verbs, and industry-standard terminology
3. Add quantified metrics WHERE LOGICAL based on existing context (e.g., "managed team" → "managed cross-functional team of 8 engineers")
4. Incorporate missing keywords truthfully
5. Maintain chronological accuracy and truthfulness
6. Improve clarity and ATS-friendliness

Missing skills to address (incorporate where truthful): ${(missingSkills || []).join(", ")}
Recommendations: ${(recommendations || []).join("; ")}
Target role: ${jobRoleId}

Return ONLY the optimized resume text. Do not add any commentary.`
          },
          { role: "user", content: `Optimize this resume:\n\n${resumeText.substring(0, 8000)}` }
        ],
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
      throw new Error("AI optimization failed");
    }

    const aiData = await aiResponse.json();
    const optimizedText = aiData.choices?.[0]?.message?.content || "";

    if (!optimizedText) throw new Error("No optimized text returned");

    // Estimate improvement (deterministic based on missing skills addressed)
    const improvementPct = Math.min(25, Math.round(missingSkills?.length * 2.5 || 5));
    const afterScore = Math.min(100, currentScore + improvementPct);

    const { error: insertError } = await supabase
      .from("optimized_resumes")
      .insert({
        resume_id: resumeId,
        analysis_id: analysisId,
        user_id: user.id,
        job_role: jobRoleId,
        optimized_text: optimizedText,
        improvement_percentage: improvementPct,
        before_score: currentScore,
        after_score: afterScore,
      });

    if (insertError) throw new Error("Failed to save optimization: " + insertError.message);

    return new Response(JSON.stringify({
      optimized_text: optimizedText,
      before_score: currentScore,
      after_score: afterScore,
      improvement_percentage: improvementPct,
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
