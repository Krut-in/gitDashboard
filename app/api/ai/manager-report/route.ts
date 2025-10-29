import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai';
import type { AdvancedAnalysisResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { error: 'OpenAI API is not configured. Please set OPENAI_API_KEY in your environment variables.' },
        { status: 503 }
      );
    }

    // Parse request body
    const data: AdvancedAnalysisResponse = await request.json();

    // Generate AI insights
    const insights = await generateManagerInsights(data);

    return NextResponse.json({ insights });
  } catch (error: any) {
    console.error('AI analysis error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate AI insights' },
      { status: 500 }
    );
  }
}

async function generateManagerInsights(data: AdvancedAnalysisResponse) {
  const openai = getOpenAIClient();
  
  const prompt = buildPrompt(data);

  const completion = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: [
      {
        role: 'system',
        content: 'You are an expert engineering manager analyzing team productivity and code contribution patterns. Provide actionable insights in a professional, concise manner. Always respond with valid JSON matching the requested schema.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 2000,
    response_format: { type: "json_object" }
  });

  const content = completion.choices[0]?.message?.content;
  
  if (!content) {
    throw new Error('No response from OpenAI');
  }

  return parseAIResponse(content);
}

function buildPrompt(data: AdvancedAnalysisResponse): string {
  const { timeline, insights, metadata } = data;

  const activeContributors = timeline.users.filter(
    u => new Date(u.lastCommitDate).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
  ).length;

  return `Analyze this GitHub repository contribution data and provide a manager-focused report.

**Repository Metrics:**
- Total Commits: ${timeline.totalCommits}
- Contributors: ${timeline.users.length}
- Active Contributors (last 30 days): ${activeContributors}
- Lines Added: ${timeline.totalAdditions.toLocaleString()}
- Lines Removed: ${timeline.totalDeletions.toLocaleString()}
- Net Lines: ${timeline.totalNetLines.toLocaleString()}
- Date Range: ${metadata.dateRange.start} to ${metadata.dateRange.end}

**Top Contributors:**
${timeline.users
  .sort((a, b) => b.totalCommits - a.totalCommits)
  .slice(0, 5)
  .map((u, i) => 
    `${i + 1}. ${u.userName}: ${u.totalCommits} commits, +${u.totalAdditions.toLocaleString()}/-${u.totalDeletions.toLocaleString()} lines, Net: ${u.totalNetLines >= 0 ? '+' : ''}${u.totalNetLines.toLocaleString()}`
  ).join('\n')}

**Activity Patterns:**
- Most Active Day: ${insights.mostActiveDay.day} (${insights.mostActiveDay.commits} commits)
- Weekday Commits: ${insights.weekdayVsWeekend.weekday}
- Weekend Commits: ${insights.weekdayVsWeekend.weekend}
- Solo Contributors: ${insights.soloContributors.length}
- Most Frequent Collaborators: ${insights.mostFrequentCollaborators.length} pairs

**File Analysis:**
- Most Edited Files: ${insights.mostEditedFiles.slice(0, 3).map((f: any) => `${f.filename} (${f.edits} edits)`).join(', ')}

Provide your analysis in this exact JSON format:

{
  "executiveSummary": "A comprehensive 3-4 sentence overview analyzing team performance, code health, collaboration patterns, and overall project trajectory",
  "strengths": ["strength 1 with specific metrics", "strength 2 with context", "strength 3 highlighting positive patterns"],
  "concerns": ["concern 1 with data-backed evidence", "concern 2 identifying potential risks"],
  "recommendations": [
    {
      "priority": "high",
      "title": "Action item title",
      "description": "Detailed recommendation with context",
      "impact": "Expected outcome and benefits"
    }
  ],
  "teamHealth": {
    "score": 75,
    "factors": ["factor 1 affecting team health", "factor 2", "factor 3"]
  },
  "predictiveInsights": ["future trend 1 based on current data", "potential risk or opportunity 2"]
}

Ensure the response is valid JSON only.`;
}

function parseAIResponse(content: string) {
  try {
    const parsed = JSON.parse(content);
    
    // Validate structure
    return {
      executiveSummary: parsed.executiveSummary || '',
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns : [],
      recommendations: Array.isArray(parsed.recommendations) 
        ? parsed.recommendations.map((r: any) => ({
            priority: r.priority || 'medium',
            title: r.title || '',
            description: r.description || '',
            impact: r.impact || ''
          }))
        : [],
      teamHealth: {
        score: parsed.teamHealth?.score || 70,
        factors: Array.isArray(parsed.teamHealth?.factors) ? parsed.teamHealth.factors : []
      },
      predictiveInsights: Array.isArray(parsed.predictiveInsights) ? parsed.predictiveInsights : []
    };
  } catch (error) {
    console.error('Failed to parse AI response:', error);
    throw new Error('Invalid AI response format');
  }
}
