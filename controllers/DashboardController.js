import sql from '../db.js';

// Get all unresolved 'bad' or 'neutral' sentiments for the "To-Do" list
export async function getActionableInsights(req, res) {
  try {
    // 1. Get unresolved surveys
    const surveys = await sql`
      SELECT 
        sr.id, 
        'survey' as type, 
        sr.sentiment, 
        sr.transcript as text, 
        sr.insight, 
        sr.created_at,
        c.name as customer_name,
        c.phone as customer_phone
      FROM survey_responses sr
      JOIN customers c ON sr.customer_id = c.id
      WHERE (sr.sentiment = 'bad' OR sr.sentiment = 'neutral')
      AND sr.is_resolved = false
      ORDER BY sr.created_at DESC
    `;

    // 2. Get unresolved social posts
    const social = await sql`
      SELECT 
        id, 
        platform as type, 
        sentiment, 
        text_content as text, 
        insight,
        post_url as url,
        created_at
      FROM social_media_sentiments
      WHERE (sentiment = 'bad' OR sentiment = 'neutral')
      AND is_resolved = false
      ORDER BY created_at DESC
    `;

    // 3. Combine
    const allInsights = [...surveys, ...social];
    
    // NOTE: Sorting is already done by the SQL queries
    // allInsights.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json(allInsights);
  } catch (err) {
    console.error("Error in getActionableInsights:", err);
    res.status(500).json({ error: "Failed to fetch actionable insights" });
  }
}

// Get KPIs for the dashboard header - THIS FUNCTION IS REWRITTEN
export async function getDashboardKpis(req, res) {
  try {
    // --- 1. Direct Sentiment (Surveys + Social) ---
    const [directStats] = await sql`
      SELECT
        (SELECT COUNT(*) FROM survey_responses) AS total_surveys,
        (SELECT COUNT(*) FROM social_media_sentiments) AS total_social,
        
        (SELECT COUNT(*) FROM survey_responses WHERE sentiment = 'good') AS good_surveys,
        (SELECT COUNT(*) FROM social_media_sentiments WHERE sentiment = 'good') AS good_social,
        
        (SELECT COUNT(*) FROM survey_responses WHERE sentiment = 'neutral') AS neutral_surveys,
        (SELECT COUNT(*) FROM social_media_sentiments WHERE sentiment = 'neutral') AS neutral_social,

        (SELECT COUNT(*) FROM survey_responses WHERE sentiment = 'bad') AS bad_surveys,
        (SELECT COUNT(*) FROM social_media_sentiments WHERE sentiment = 'bad') AS bad_social
    `;

    const total_direct = parseInt(directStats.total_surveys) + parseInt(directStats.total_social);
    const total_good = parseInt(directStats.good_surveys) + parseInt(directStats.good_social);
    const total_neutral = parseInt(directStats.neutral_surveys) + parseInt(directStats.neutral_social);
    const total_bad = parseInt(directStats.bad_surveys) + parseInt(directStats.bad_social);

    const direct_sentiment_breakdown = {
      good: total_good,
      neutral: total_neutral,
      bad: total_bad,
      total: total_direct,
      good_percent: (total_direct === 0) ? 0 : parseFloat(((total_good / total_direct) * 100).toFixed(1)),
      neutral_percent: (total_direct === 0) ? 0 : parseFloat(((total_neutral / total_direct) * 100).toFixed(1)),
      bad_percent: (total_direct === 0) ? 0 : parseFloat(((total_bad / total_direct) * 100).toFixed(1))
    };
    
    // --- 2. Indirect Sentiment (Google Trends) ---
    const [indirectStats] = await sql`
      SELECT
        COALESCE(SUM(CASE WHEN intent = 'positive' THEN value ELSE 0 END), 0) AS positive_total,
        COALESCE(SUM(CASE WHEN intent = 'negative' THEN value ELSE 0 END), 0) AS negative_total
      FROM google_trends_data
    `;
    
    const total_indirect = parseInt(indirectStats.positive_total) + parseInt(indirectStats.negative_total);
    const positive_total_int = parseInt(indirectStats.positive_total);
    const negative_total_int = parseInt(indirectStats.negative_total);

    const indirect_sentiment_breakdown = {
      positive: positive_total_int,
      negative: negative_total_int,
      total: total_indirect,
      positive_percent: (total_indirect === 0) ? 0 : parseFloat(((positive_total_int / total_indirect) * 100).toFixed(1)),
      negative_percent: (total_indirect === 0) ? 0 : parseFloat(((negative_total_int / total_indirect) * 100).toFixed(1))
    };

    // --- 3. Total Customer Sentiment (Weighted) ---
    // We'll weigh direct feedback (70%) more heavily than indirect trends (30%)
    const direct_score = direct_sentiment_breakdown.good_percent;
    const indirect_score = indirect_sentiment_breakdown.positive_percent;
    let total_customer_sentiment_percent = (direct_score * 0.7) + (indirect_score * 0.3);
    
    if (total_direct === 0 && total_indirect === 0) total_customer_sentiment_percent = 100; // Default
    else if (total_direct === 0) total_customer_sentiment_percent = indirect_score;
    else if (total_indirect === 0) total_customer_sentiment_percent = direct_score;

    res.json({
      direct_sentiment_breakdown,
      indirect_sentiment_breakdown,
      total_customer_sentiment_percent: parseFloat(total_customer_sentiment_percent.toFixed(1))
    });

  } catch (err) {
    console.error("Error in getDashboardKpis:", err);
    res.status(500).json({ error: "Failed to fetch dashboard KPIs" });
  }
}

// --- NEW FUNCTION for the line graph ---
// Gets the daily "good" sentiment percentage from direct sources
export async function getSentimentOverTime(req, res) {
  try {
    const sentimentHistory = await sql`
      WITH direct_daily AS (
        -- CTE 1: Calculate daily "good" percent from direct feedback (calls + social)
        SELECT
            DATE_TRUNC('day', created_at) AS date,
            (COUNT(*) FILTER (WHERE sentiment = 'good')::float / COUNT(*)::float) * 100 AS good_percent
        FROM (
            SELECT created_at, sentiment FROM survey_responses WHERE sentiment IS NOT NULL
            UNION ALL
            SELECT created_at, sentiment FROM social_media_sentiments WHERE sentiment IS NOT NULL
        ) AS direct_feedback
        GROUP BY 1
      ),
      indirect_daily AS (
        -- CTE 2: Calculate daily "positive" percent from indirect trends
        SELECT
            date::date AS date,
            -- Use NULLIF to prevent divide-by-zero errors if total is 0
            (SUM(CASE WHEN intent = 'positive' THEN value ELSE 0 END)::float / NULLIF(SUM(value), 0)::float) * 100 AS positive_percent
        FROM google_trends_data
        GROUP BY 1
      )
      -- Final Step: Combine them with a weighted average
      SELECT
          COALESCE(d.date, i.date)::date AS date,
          
          -- Calculate the weighted "Total Sentiment".
          -- We use 70% weight for direct feedback and 30% for indirect trends.
          -- COALESCE handles days where one data source might be missing.
          (COALESCE(d.good_percent, i.positive_percent, 50) * 0.7) + 
          (COALESCE(i.positive_percent, d.good_percent, 50) * 0.3) AS total_sentiment_percent
          
      FROM direct_daily d
      FULL OUTER JOIN indirect_daily i ON d.date = i.date
      WHERE COALESCE(d.date, i.date) IS NOT NULL
      ORDER BY date ASC;
    `;

    // The data is already perfectly formatted for a chart
    const chartData = sentimentHistory.map(row => ({
      date: row.date.toISOString().split('T')[0],
      // Renamed to 'total_sentiment_percent' to be clear
      total_sentiment_percent: parseFloat(row.total_sentiment_percent.toFixed(1))
    }));

    res.json(chartData);

  } catch (err) {
    console.error("Error in getSentimentOverTime:", err);
    res.status(500).json({ error: "Failed to fetch sentiment over time" });
  }
}
// --- END NEW FUNCTION ---

// Get all Google Trends data, formatted for a chart
export async function getGoogleTrendsData(req, res) {
  try {
    const trends = await sql`
      SELECT query, intent, date, value 
      FROM google_trends_data
      ORDER BY date ASC
    `;

    // Format for a chart library (e.g., Chart.js, Recharts)
    const chartData = {};
    for (const row of trends) {
      if (!chartData[row.query]) {
        chartData[row.query] = {
          intent: row.intent,
          data: []
        };
      }
      chartData[row.query].data.push({
        date: row.date.toISOString().split('T')[0],
        value: row.value
      });
    }

    res.json(chartData);
  } catch (err) {
    console.error("Error in getGoogleTrendsData:", err);
    res.status(500).json({ error: "Failed to fetch Google Trends data" });
  }
}

// Get ALL survey responses for a detailed table
export async function getAllSurveys(req, res) {
  try {
    const surveys = await sql`
      SELECT 
        sr.*,
        c.name as customer_name,
        c.phone as customer_phone
      FROM survey_responses sr
      LEFT JOIN customers c ON sr.customer_id = c.id
      ORDER BY sr.created_at DESC
    `;
    res.json(surveys);
  } catch (err) {
    console.error("Error in getAllSurveys:", err);
    res.status(500).json({ error: "Failed to fetch survey responses" });
  }
}

// Get ALL social media posts for a detailed table
export async function getAllSocial(req, res) {
  try {
    const socialPosts = await sql`
      SELECT * FROM social_media_sentiments
      ORDER BY created_at DESC
    `;
    res.json(socialPosts);
  } catch (err) {
    console.error("Error in getAllSocial:", err);
    res.status(500).json({ error: "Failed to fetch social media sentiments" });
  }
}

// --- NEW FUNCTION for the customer table ---
export async function getAllCustomers(req, res) {
  try {
    const customers = await sql`
      SELECT * FROM customers
      ORDER BY name ASC
    `;
    res.json(customers);
  } catch (err) {
    console.error("Error in getAllCustomers:", err);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
}
// --- END NEW FUNCTION ---