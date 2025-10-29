import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOpenAIClient, isOpenAIConfigured } from '@/lib/openai';
import type { AdvancedAnalysisResponse } from '@/lib/types';

// Simple in-memory cache (in production, consider using Redis)
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { 
          error: 'Unauthorized. Please sign in to access AI features.',
          fallback: true 
        },
        { status: 401 }
      );
    }

    // 2. Check if OpenAI is configured
    if (!isOpenAIConfigured()) {
      return NextResponse.json(
        { 
          error: 'AI features are not available. OpenAI API key is not configured.',
          fallback: true,
          suggestion: 'Please add OPENAI_API_KEY to your .env.local file.'
        },
        { status: 503 }
      );
    }

    // 3. Parse and validate request
    const data: AdvancedAnalysisResponse = await request.json();
    
    if (!data?.timeline?.totalCommits) {
      return NextResponse.json(
        { 
          error: 'Invalid data provided. Repository analysis data is required.',
          fallback: true 
        },
        { status: 400 }
      );
    }

    // 4. Check cache first
    const cacheKey = generateCacheKey(data);
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('✅ Returning cached AI insights');
      return NextResponse.json({ 
        insights: cached.data,
        cached: true,
        timestamp: cached.timestamp
      });
    }

    // 5. Generate AI insights
    const insights = await generateManagerInsights(data);

    // 6. Cache the result
    cache.set(cacheKey, { data: insights, timestamp: Date.now() });

    return NextResponse.json({ 
      insights,
      cached: false,
      timestamp: Date.now()
    });

  } catch (error: any) {
    console.error('❌ AI analysis error:', error);

    // Handle specific OpenAI errors
    if (error.status === 429 || error.code === 'insufficient_quota') {
      return NextResponse.json(
        {
          error: 'AI quota exceeded. Using fallback analysis.',
          fallback: true,
          details: 'The OpenAI API quota has been exceeded. Please check your billing or try again later.',
          suggestion: 'The traditional report is still available below.'
        },
        { status: 429 }
      );
    }

    if (error.status === 401 || error.code === 'invalid_api_key') {
      return NextResponse.json(
        {
          error: 'Invalid OpenAI API key.',
          fallback: true,
          details: 'The OpenAI API key is invalid or expired.',
          suggestion: 'Please update your OPENAI_API_KEY in .env.local'
        },
        { status: 401 }
      );
    }

    if (error.status === 503 || error.code === 'service_unavailable') {
      return NextResponse.json(
        {
          error: 'OpenAI service temporarily unavailable.',
          fallback: true,
          details: 'The OpenAI service is currently unavailable. Please try again later.'
        },
        { status: 503 }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: 'Failed to generate AI insights.',
        fallback: true,
        details: error.message || 'An unexpected error occurred.',
        suggestion: 'Please try again or view the traditional report below.'
      },
      { status: 500 }
    );
  }
}

function generateCacheKey(data: AdvancedAnalysisResponse): string {
  // Create a unique key based on commit count and date range
  const { timeline, metadata } = data;
  return `ai_insights_${timeline.totalCommits}_${metadata.dateRange.start}_${metadata.dateRange.end}`;
}

async function generateManagerInsights(data: AdvancedAnalysisResponse) {
  const openai = getOpenAIClient();
  
  const prompt = buildPrompt(data);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: `You are an expert engineering manager analyzing team productivity and code contribution patterns. 
Provide actionable insights in a professional, concise manner. 
Always respond with valid JSON only, no markdown formatting.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 1,
      max_completion_tokens: 2000,
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return parseAIResponse(content);

  } catch (error: any) {
    console.error('OpenAI API call failed:', error);
    throw error; // Re-throw to be caught by route handler
  }
}

function buildPrompt(data: AdvancedAnalysisResponse): string {
  const { timeline, insights, metadata } = data;

  // Calculate additional metrics
  const avgCommitsPerUser = timeline.users.length > 0 
    ? Math.round(timeline.totalCommits / timeline.users.length) 
    : 0;
  
  const topContributor = timeline.users.sort((a, b) => b.totalCommits - a.totalCommits)[0];
  
  const activeContributors = timeline.users.filter(
    u => new Date(u.lastCommitDate).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
  ).length;

  return `Analyze this GitHub repository contribution data and provide a manager-focused report.

**Repository Metrics:**
- Total Commits: ${timeline.totalCommits}
- Total Contributors: ${timeline.users.length}
- Active Contributors (last 30 days): ${activeContributors}
- Lines Added: +${timeline.totalAdditions.toLocaleString()}
- Lines Removed: -${timeline.totalDeletions.toLocaleString()}
- Net Change: ${timeline.totalNetLines >= 0 ? '+' : ''}${timeline.totalNetLines.toLocaleString()} lines
- Average Commits per User: ${avgCommitsPerUser}
- Date Range: ${metadata.dateRange.start} to ${metadata.dateRange.end}

**Top Contributor:**
- Name: ${topContributor?.userName || 'N/A'}
- Commits: ${topContributor?.totalCommits || 0}
- Impact: +${topContributor?.totalAdditions || 0}/-${topContributor?.totalDeletions || 0} lines

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

**Response Format (MUST be valid JSON):**
{
  "executiveSummary": "2-3 sentence concise overview of overall team performance, productivity trends, and code health",
  "strengths": [
    "Specific strength with supporting data",
    "Another strength with context",
    "Third strength point"
  ],
  "concerns": [
    "Specific concern with data",
    "Another area needing attention"
  ],
  "recommendations": [
    {
      "priority": "high",
      "title": "Clear action item title",
      "description": "Detailed recommendation with specific steps",
      "impact": "Expected positive outcome if implemented"
    },
    {
      "priority": "medium",
      "title": "Another action item",
      "description": "Description with context",
      "impact": "Expected benefit"
    },
    {
      "priority": "low",
      "title": "Future improvement",
      "description": "Long-term suggestion",
      "impact": "Potential impact"
    }
  ],
  "teamHealth": {
    "score": 75,
    "factors": [
      "Factor contributing to score",
      "Another factor",
      "Third factor"
    ]
  },
  "predictiveInsights": [
    "Future trend prediction based on data",
    "Another insight about upcoming patterns"
  ]
}

Provide ONLY the JSON object, no additional text or formatting.`;
}

function parseAIResponse(content: string) {
  try {
    // Try parsing directly
    const parsed = JSON.parse(content);
    
    // Validate structure
    if (!parsed.executiveSummary || !Array.isArray(parsed.strengths)) {
      throw new Error('Invalid response structure');
    }
    
    // Ensure all required fields exist with defaults
    return {
      executiveSummary: parsed.executiveSummary || 'Analysis completed successfully.',
      strengths: parsed.strengths || [],
      concerns: parsed.concerns || [],
      recommendations: Array.isArray(parsed.recommendations) 
        ? parsed.recommendations.map((r: any) => ({
            priority: r.priority || 'medium',
            title: r.title || 'Untitled Recommendation',
            description: r.description || 'No description provided',
            impact: r.impact || 'Impact to be determined'
          }))
        : [],
      teamHealth: {
        score: parsed.teamHealth?.score || 0,
        factors: Array.isArray(parsed.teamHealth?.factors) 
          ? parsed.teamHealth.factors 
          : []
      },
      predictiveInsights: Array.isArray(parsed.predictiveInsights) 
        ? parsed.predictiveInsights 
        : []
    };
  } catch (parseError) {
    console.error('Failed to parse AI response:', parseError);
    console.error('Raw content:', content);
    
    // Return a fallback structure
    return {
      executiveSummary: 'Unable to parse AI response. Please try again.',
      strengths: ['Data collected successfully'],
      concerns: ['AI parsing issue occurred'],
      recommendations: [
        {
          priority: 'medium' as const,
          title: 'Review Analysis',
          description: 'The AI analysis encountered a formatting issue. Please regenerate the report.',
          impact: 'Improved insights with successful parsing'
        }
      ],
      teamHealth: { score: 0, factors: [] },
      predictiveInsights: []
    };
  }
}
