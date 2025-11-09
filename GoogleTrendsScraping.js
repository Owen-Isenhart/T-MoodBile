import googleTrends from 'google-trends-api';
import Sentiment from 'sentiment';

const sentiment = new Sentiment();
const keyword = 'T-Mobile';
const DAYS_BACK = 50; 


const now = new Date();
const cutoffDate = new Date(now.getTime() - DAYS_BACK * 24 * 60 * 60 * 1000);
const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

googleTrends.relatedQueries({ keyword: keyword })
   .then(async results => {
       const data = JSON.parse(results);
      
       if (!data.default.rankedList || data.default.rankedList.length === 0) {
           console.log('No related queries found.');
           return;
       }

       const queries = data.default.rankedList[0].rankedKeyword;
       if (!queries || queries.length === 0) {
           console.log('No related queries available.');
           return;
       }

       let happy = 0;
       let neutral = 0;
       let upset = 0;

       console.log(`Related queries for "${keyword}" and their sentiment:`);

       for (const q of queries) {
           const score = sentiment.analyze(q.query).score;

           if (score > 0) happy++;
           else if (score < 0) upset++;
           else neutral++;

           console.log(`\nQuery: "${q.query}" | Sentiment score: ${score}`);

           
           try {
               const trendData = await googleTrends.interestOverTime({ keyword: q.query });
               const parsedTrend = JSON.parse(trendData);
               const timeline = parsedTrend.default.timelineData || [];

               
               const filteredTimeline = timeline.filter(t => Number(t.time) >= cutoffTimestamp);

               if (filteredTimeline.length === 0) {
                   console.log('No trend data in the last 50 days.');
               } else {
                   console.log('Date-wise interest (last 50 days):');
                   filteredTimeline.forEach(t => {
                       const date = new Date(Number(t.time) * 1000);
                       console.log(`Date: ${date.toISOString().split('T')[0]}, Value: ${t.value[0]}`);
                   });
               }
           } catch (err) {
               console.error(`Error fetching trend for "${q.query}":`, err.message);
           }
       }

       console.log(`\nSentiment distribution for related queries about "${keyword}":`);
       console.log(`Happy: ${happy}`);
       console.log(`Neutral: ${neutral}`);
       console.log(`Upset: ${upset}`);
   })
   .catch(err => {
       console.error('Error fetching related queries:', err.message);
   });
