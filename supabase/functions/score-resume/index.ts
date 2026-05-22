import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function normalizeSkill(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

const JOB_ROLES: Record<string, any> = {
  "data-scientist": { required_skills: ["Python","SQL","Statistics","Machine Learning","Data Analysis","Pandas","NumPy"], preferred_skills: ["TensorFlow","PyTorch","Tableau","Power BI","Spark","R","Deep Learning"], keywords: ["data-driven","insights","modeling","analytics","prediction","hypothesis","A/B testing"], minimum_years: 2 },
  "ml-engineer": { required_skills: ["Python","TensorFlow","PyTorch","MLOps","Docker","SQL","Machine Learning"], preferred_skills: ["Kubernetes","AWS SageMaker","MLflow","Airflow","Spark","C++","CUDA"], keywords: ["model deployment","pipeline","training","inference","optimization","production ML"], minimum_years: 3 },
  "ai-engineer": { required_skills: ["Python","Deep Learning","NLP","Computer Vision","TensorFlow","PyTorch"], preferred_skills: ["Transformers","LLMs","Reinforcement Learning","GANs","ONNX","Triton"], keywords: ["artificial intelligence","neural network","AI system","foundation model","fine-tuning"], minimum_years: 3 },
  "backend-engineer": { required_skills: ["Node.js","Python","SQL","REST APIs","Git","Database Design"], preferred_skills: ["GraphQL","Redis","Docker","Kubernetes","AWS","Microservices","Go"], keywords: ["scalable","API design","server-side","architecture","performance","database"], minimum_years: 2 },
  "frontend-engineer": { required_skills: ["JavaScript","TypeScript","React","HTML","CSS","Git"], preferred_skills: ["Next.js","Vue.js","Tailwind CSS","Testing","Webpack","Performance Optimization"], keywords: ["responsive","UI/UX","component","accessibility","SPA","web performance"], minimum_years: 2 },
  "fullstack-developer": { required_skills: ["JavaScript","TypeScript","React","Node.js","SQL","Git","REST APIs"], preferred_skills: ["Next.js","Docker","AWS","MongoDB","GraphQL","Redis"], keywords: ["full-stack","end-to-end","deployment","frontend","backend","database"], minimum_years: 2 },
  "devops-engineer": { required_skills: ["Docker","Kubernetes","CI/CD","Linux","AWS","Terraform","Git"], preferred_skills: ["Ansible","Jenkins","Prometheus","Grafana","GCP","Azure"], keywords: ["infrastructure","automation","deployment","monitoring","pipeline","cloud"], minimum_years: 3 },
  "cloud-engineer": { required_skills: ["AWS","Azure","GCP","Terraform","Docker","Networking","Linux"], preferred_skills: ["Kubernetes","Serverless","CloudFormation","Security","Cost Optimization"], keywords: ["cloud architecture","migration","scalability","multi-cloud","IaC"], minimum_years: 3 },
  "cybersecurity-analyst": { required_skills: ["Network Security","SIEM","Vulnerability Assessment","Linux","Python"], preferred_skills: ["Penetration Testing","SOC","Incident Response","Compliance","Forensics"], keywords: ["threat","vulnerability","security audit","firewall","encryption","compliance"], minimum_years: 2 },
  "qa-engineer": { required_skills: ["Test Automation","Selenium","Jest","API Testing","SQL","Git"], preferred_skills: ["Cypress","Playwright","Performance Testing","CI/CD","Python"], keywords: ["quality assurance","testing","bug","regression","test plan","coverage"], minimum_years: 2 },
  "data-engineer": { required_skills: ["Python","SQL","ETL","Spark","Airflow","Data Warehousing"], preferred_skills: ["Kafka","dbt","Snowflake","BigQuery","AWS Glue","Databricks"], keywords: ["pipeline","data lake","warehouse","batch processing","streaming","schema"], minimum_years: 2 },
  "mlops-engineer": { required_skills: ["Python","Docker","Kubernetes","MLflow","CI/CD","AWS/GCP"], preferred_skills: ["Kubeflow","Terraform","Monitoring","Feature Store","Model Registry"], keywords: ["model deployment","ML pipeline","monitoring","reproducibility","automation"], minimum_years: 3 },
  "mobile-developer": { required_skills: ["React Native","Swift","Kotlin","REST APIs","Git"], preferred_skills: ["Flutter","Firebase","App Store Deployment","CI/CD","Testing"], keywords: ["iOS","Android","mobile app","responsive","push notifications","offline"], minimum_years: 2 },
  "software-architect": { required_skills: ["System Design","Microservices","Cloud Architecture","Design Patterns","SQL"], preferred_skills: ["Event-Driven Architecture","Domain-Driven Design","Kubernetes","Security"], keywords: ["architecture","scalability","design decision","trade-off","technical leadership"], minimum_years: 7 },
  "product-manager": { required_skills: ["Product Strategy","Roadmapping","User Research","Agile","Data Analysis"], preferred_skills: ["SQL","Figma","A/B Testing","Market Research","Pricing Strategy"], keywords: ["product-market fit","user needs","KPI","OKR","stakeholder","prioritization"], minimum_years: 3 },
  "project-manager": { required_skills: ["Project Planning","Agile","Scrum","Risk Management","Stakeholder Management"], preferred_skills: ["Jira","MS Project","PMP","Budget Management","Confluence"], keywords: ["timeline","milestone","deliverable","scope","resource allocation","sprint"], minimum_years: 3 },
  "business-analyst": { required_skills: ["Requirements Gathering","Data Analysis","SQL","Process Mapping","Documentation"], preferred_skills: ["Tableau","Power BI","Jira","UML","Python"], keywords: ["business requirements","stakeholder","process improvement","gap analysis","ROI"], minimum_years: 2 },
  "marketing-manager": { required_skills: ["Digital Marketing","Content Strategy","SEO","Analytics","Campaign Management"], preferred_skills: ["Google Ads","Social Media","Email Marketing","CRM","Marketing Automation"], keywords: ["brand","conversion","engagement","funnel","audience","ROI","growth"], minimum_years: 3 },
  "growth-manager": { required_skills: ["Growth Strategy","A/B Testing","Analytics","User Acquisition","Retention"], preferred_skills: ["SQL","Python","Product-Led Growth","Paid Acquisition","Viral Loops"], keywords: ["growth","experimentation","funnel optimization","activation","referral","LTV"], minimum_years: 3 },
  "sales-manager": { required_skills: ["Sales Strategy","CRM","Pipeline Management","Negotiation","Team Leadership"], preferred_skills: ["Salesforce","HubSpot","Account Management","Forecasting"], keywords: ["revenue","quota","deal","prospect","close rate","territory","B2B"], minimum_years: 3 },
  "operations-manager": { required_skills: ["Operations Management","Process Improvement","Budget Management","Team Leadership"], preferred_skills: ["Lean","Six Sigma","Supply Chain","ERP Systems","Data Analysis"], keywords: ["efficiency","optimization","logistics","vendor management","SLA","KPI"], minimum_years: 3 },
  "financial-analyst": { required_skills: ["Financial Modeling","Excel","Financial Reporting","Valuation","Budgeting"], preferred_skills: ["SQL","Python","Tableau","SAP","Bloomberg"], keywords: ["forecast","P&L","cash flow","variance analysis","financial statement","ROI"], minimum_years: 2 },
  "auditor": { required_skills: ["Auditing Standards","Risk Assessment","Internal Controls","Compliance","Excel"], preferred_skills: ["SAP","ACL","IFRS","SOX Compliance","Data Analytics"], keywords: ["audit","compliance","risk","control","assurance","regulation","finding"], minimum_years: 2 },
  "risk-manager": { required_skills: ["Risk Assessment","Compliance","Financial Analysis","Regulatory Frameworks"], preferred_skills: ["VaR","Monte Carlo","Basel III","Stress Testing","Python"], keywords: ["risk mitigation","exposure","regulatory","framework","portfolio risk"], minimum_years: 4 },
  "investment-analyst": { required_skills: ["Financial Modeling","Valuation","Research","Excel","Market Analysis"], preferred_skills: ["Bloomberg","Python","DCF","Private Equity","Venture Capital"], keywords: ["investment","portfolio","due diligence","market research","return","equity"], minimum_years: 2 },
  "accountant": { required_skills: ["GAAP","Financial Reporting","Tax Preparation","Excel","Bookkeeping"], preferred_skills: ["QuickBooks","SAP","ERP Systems","Payroll","Audit"], keywords: ["accounting","journal entry","reconciliation","general ledger","tax","balance sheet"], minimum_years: 1 },
  "tax-consultant": { required_skills: ["Tax Law","Tax Planning","Compliance","Financial Analysis","Excel"], preferred_skills: ["International Tax","Transfer Pricing","Tax Software","Research"], keywords: ["tax return","deduction","compliance","IRS","tax strategy","filing"], minimum_years: 2 },
  "hr-specialist": { required_skills: ["Recruitment","Employee Relations","HRIS","Labor Law","Onboarding"], preferred_skills: ["Workday","SAP SuccessFactors","Performance Management","Compensation"], keywords: ["human resources","employee","benefits","policy","retention","engagement"], minimum_years: 2 },
  "technical-recruiter": { required_skills: ["Technical Sourcing","ATS","Interviewing","Pipeline Management","Employer Branding"], preferred_skills: ["LinkedIn Recruiter","Boolean Search","Greenhouse","Data-Driven Recruiting"], keywords: ["candidate","sourcing","talent pipeline","offer","hire","screening","tech stack"], minimum_years: 2 },
  "talent-acquisition-manager": { required_skills: ["Recruitment Strategy","Team Leadership","ATS","Employer Branding","Metrics"], preferred_skills: ["Diversity Hiring","Workforce Planning","Executive Search","Analytics"], keywords: ["talent strategy","hiring","recruitment","cost-per-hire","time-to-fill","pipeline"], minimum_years: 5 },
  "hr-business-partner": { required_skills: ["Strategic HR","Change Management","Employee Relations","Talent Development"], preferred_skills: ["Organizational Design","Succession Planning","Coaching","Analytics"], keywords: ["business partner","strategic","organizational","culture","workforce","leadership"], minimum_years: 5 },
  "ui-ux-designer": { required_skills: ["Figma","User Research","Wireframing","Prototyping","Design Systems"], preferred_skills: ["Adobe XD","Sketch","Usability Testing","Accessibility","Motion Design"], keywords: ["user experience","interface","usability","persona","journey map","interaction"], minimum_years: 2 },
  "graphic-designer": { required_skills: ["Adobe Photoshop","Illustrator","Typography","Color Theory","Layout Design"], preferred_skills: ["After Effects","InDesign","Brand Identity","Print Design","3D"], keywords: ["visual design","branding","creative","composition","identity","campaign"], minimum_years: 2 },
  "product-designer": { required_skills: ["Figma","Product Thinking","User Research","Prototyping","Design Systems"], preferred_skills: ["Data-Driven Design","A/B Testing","Frontend Development","Accessibility"], keywords: ["end-to-end design","product strategy","user-centered","iteration","design sprint"], minimum_years: 3 },
  "content-writer": { required_skills: ["Content Writing","SEO","Copywriting","Research","Editing"], preferred_skills: ["Content Strategy","CMS","Social Media","Technical Writing","Analytics"], keywords: ["content","engagement","headline","SEO","audience","brand voice","copy"], minimum_years: 1 },
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

    const { parsed, jobRoleId, resumeText, resumeId } = await req.json();
    const role = JOB_ROLES[jobRoleId];
    if (!role) throw new Error("Unknown job role: " + jobRoleId);

    // Verify the caller owns the referenced resume before linking analyses to it
    if (resumeId) {
      const { data: resumeRow, error: resumeErr } = await supabase
        .from("resumes")
        .select("user_id")
        .eq("id", resumeId)
        .maybeSingle();
      if (resumeErr || !resumeRow || resumeRow.user_id !== user.id) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
    }

    // ===== DETERMINISTIC SCORING =====
    const allSkills = [...(parsed.skills || []), ...(parsed.tools || [])];
    const normalizedSkills = allSkills.map(normalizeSkill);
    const matchedRequired = role.required_skills.filter((s: string) => normalizedSkills.includes(normalizeSkill(s)));
    const matchedPreferred = role.preferred_skills.filter((s: string) => normalizedSkills.includes(normalizeSkill(s)));
    const missingSkills = role.required_skills.filter((s: string) => !normalizedSkills.includes(normalizeSkill(s)));
    const requiredScore = role.required_skills.length > 0 ? (matchedRequired.length / role.required_skills.length) * 100 : 0;
    const preferredScore = role.preferred_skills.length > 0 ? (matchedPreferred.length / role.preferred_skills.length) * 100 * 0.5 : 0;
    const skillScore = Math.min(100, Math.round(requiredScore + preferredScore));

    const yearScore = Math.min(parsed.total_years_experience / Math.max(role.minimum_years, 1), 1.0) * 100;
    const lowerText = resumeText.toLowerCase();
    const keywordMatches = role.keywords.filter((k: string) => lowerText.includes(k.toLowerCase())).length;
    const keywordScore = role.keywords.length > 0 ? (keywordMatches / role.keywords.length) * 100 * 0.3 : 0;
    const experienceScore = Math.min(100, Math.round(yearScore + keywordScore));

    const projects = parsed.projects || [];
    let projectScore = 0;
    if (projects.length > 0) {
      const allRoleSkills = [...role.required_skills, ...role.preferred_skills].map(normalizeSkill);
      const relevantProjects = projects.filter((p: any) => (p.technologies || []).some((t: string) => allRoleSkills.includes(normalizeSkill(t))));
      const relevanceScore = (relevantProjects.length / projects.length) * 100;
      const hasQuantified = projects.some((p: any) => /\d+%|\$\d|increased|decreased|improved|reduced|achieved/i.test(p.description));
      projectScore = Math.min(100, Math.round(relevanceScore + (hasQuantified ? 40 : 0) * 0.4));
    }

    let educationScore = 0;
    for (const edu of (parsed.education || [])) {
      const deg = (edu.degree || "").toLowerCase();
      if (deg.includes("phd") || deg.includes("doctorate")) educationScore = Math.max(educationScore, 100);
      else if (deg.includes("master")) educationScore = Math.max(educationScore, 90);
      else if (deg.includes("bachelor")) educationScore = Math.max(educationScore, 70);
      else educationScore = Math.max(educationScore, 30);
    }
    const relevantFields = ["computer science","cs","engineering","mathematics","statistics","data","information technology"];
    if ((parsed.education || []).some((e: any) => relevantFields.some(f => (e.field || "").toLowerCase().includes(f)))) educationScore = Math.min(100, educationScore + 20);

    const metrics = parsed.quantified_metrics || [];
    const impactScore = Math.round((Math.min(metrics.length, 5) / 5) * 100);

    const overall = Math.round(
      (skillScore * 40 + experienceScore * 25 + projectScore * 20 + educationScore * 10 + impactScore * 5) / 100
    );
    const clampedOverall = Math.min(100, Math.max(0, overall));

    let grade: string;
    if (clampedOverall >= 90) grade = "A";
    else if (clampedOverall >= 80) grade = "B";
    else if (clampedOverall >= 70) grade = "C";
    else if (clampedOverall >= 60) grade = "D";
    else grade = "F";

    // ===== AI DEEP PROBLEM DETECTION =====
    const roleName = jobRoleId.replace(/-/g, " ");
    const aiPrompt = `You are a senior resume reviewer and career coach. Analyze this resume for a "${roleName}" position. Be EXTREMELY specific and detailed. Find EVERY problem.

RESUME TEXT:
${resumeText.substring(0, 8000)}

PARSED DATA:
Skills: ${allSkills.join(", ")}
Experience: ${(parsed.experience || []).map((e: any) => `${e.role} at ${e.company} (${e.duration}): ${(e.responsibilities || []).join("; ")}`).join(" | ")}
Education: ${(parsed.education || []).map((e: any) => `${e.degree} at ${e.institution}`).join("; ")}
Projects: ${projects.length > 0 ? projects.map((p: any) => p.name).join(", ") : "NONE"}

REQUIRED SKILLS FOR ROLE: ${role.required_skills.join(", ")}
PREFERRED SKILLS: ${role.preferred_skills.join(", ")}
MISSING REQUIRED SKILLS: ${missingSkills.join(", ")}
MATCHED SKILLS: ${matchedRequired.join(", ")}

SCORES: Skills ${skillScore}%, Experience ${experienceScore}%, Projects ${projectScore}%, Education ${educationScore}%, Impact ${impactScore}%, Overall ${clampedOverall}%

Analyze EVERY aspect and return findings using the tool provided. Be brutal and specific — quote exact text from the resume.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a brutally honest resume reviewer. Find specific problems with exact quotes and actionable fixes." },
          { role: "user", content: aiPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "return_analysis",
            description: "Return detailed resume analysis",
            parameters: {
              type: "object",
              properties: {
                problems: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: { type: "string", description: "Category: missing_quantification, weak_action_verb, missing_technical_skills, irrelevant_experience, missing_projects, poor_structure, vague_description, no_metrics, missing_summary, weak_bullet, missing_keywords, formatting_issue, missing_portfolio, generic_language, no_impact_shown" },
                      severity: { type: "string", enum: ["critical", "major", "minor"] },
                      location: { type: "string", description: "Exact section and position, e.g. 'Work Experience — Real Estate Agent — Bullet 1'" },
                      issue: { type: "string", description: "What exactly is wrong" },
                      original_text: { type: "string", description: "Quote the exact problematic text from resume" },
                      fix: { type: "string", description: "Specific improved version or actionable fix" }
                    },
                    required: ["type", "severity", "location", "issue", "original_text", "fix"]
                  }
                },
                strengths: {
                  type: "array",
                  items: { type: "string" },
                  description: "Specific strengths with evidence"
                },
                recommendations: {
                  type: "array",
                  items: { type: "string" },
                  description: "Prioritized actionable recommendations"
                },
                structure_issues: {
                  type: "array",
                  items: { type: "string" },
                  description: "Issues with resume structure, ordering, section placement"
                }
              },
              required: ["problems", "strengths", "recommendations", "structure_issues"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "return_analysis" } },
      }),
    });

    let aiProblems: any[] = [];
    let aiStrengths: string[] = [];
    let aiRecommendations: string[] = [];
    let structureIssues: string[] = [];

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        try {
          const parsed = JSON.parse(toolCall.function.arguments);
          aiProblems = parsed.problems || [];
          aiStrengths = parsed.strengths || [];
          aiRecommendations = parsed.recommendations || [];
          structureIssues = parsed.structure_issues || [];
        } catch (e) {
          console.error("Failed to parse AI analysis:", e);
        }
      }
    } else {
      console.error("AI analysis failed:", aiResponse.status);
    }

    // Merge AI findings with deterministic scoring
    const finalStrengths = aiStrengths.length > 0 ? aiStrengths : [
      ...(matchedRequired.length >= role.required_skills.length * 0.7 ? ["Strong skill match for the role"] : []),
      ...(parsed.total_years_experience >= role.minimum_years ? [`${parsed.total_years_experience}+ years of experience`] : []),
      ...(projects.length >= 3 ? ["Diverse project portfolio"] : []),
      ...(metrics.length >= 3 ? ["Good use of quantified metrics"] : []),
      "Resume has foundational content to build upon",
    ];

    const finalRecommendations = aiRecommendations.length > 0 ? aiRecommendations : [
      ...(missingSkills.length > 0 ? [`Add missing skills: ${missingSkills.slice(0, 5).join(", ")}`] : []),
      ...(metrics.length < 3 ? ["Add more quantified achievements"] : []),
      ...(projects.length < 2 ? ["Include more relevant projects"] : []),
      ...(clampedOverall < 70 ? ["Use stronger action verbs and quantify accomplishments"] : []),
    ];

    // Save to DB (store problems in recommendations field as JSON)
    const analysisPayload = {
      resume_id: resumeId,
      user_id: user.id,
      job_role: jobRoleId,
      overall_score: clampedOverall,
      skill_score: skillScore,
      experience_score: experienceScore,
      project_score: projectScore,
      education_score: educationScore,
      impact_score: impactScore,
      missing_skills: missingSkills,
      strengths: finalStrengths,
      recommendations: finalRecommendations,
      grade,
    };

    const { data: analysis, error: insertError } = await supabase
      .from("analyses")
      .insert(analysisPayload)
      .select()
      .single();

    if (insertError) throw new Error("Failed to save analysis: " + insertError.message);

    return new Response(JSON.stringify({
      ...analysisPayload,
      analysisId: analysis.id,
      problems: aiProblems,
      structure_issues: structureIssues,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("score-resume error:", e);
    const status = e instanceof Error && e.message.includes("Rate limit") ? 429 : 500;
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
