import axios from "axios";
import Sentiment from "sentiment";

const sentiment = new Sentiment();

const runRedditScraper = async () => {
    console.log("Scraping Reddit for posts about T-Mobile.. \n");

    const subreddit = "Tmobile";
    const limit = 100; 
    let after = null;  
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 50); 

    let allPosts = [];
    let fetchMore = true;

    try {
        while (fetchMore) {
            let url = `https://www.reddit.com/r/${subreddit}/new.json?limit=${limit}`;
            if (after) url += `&after=${after}`;

            const response = await axios.get(url, {
                headers: { "User-Agent": "Mozilla/5.0" },
            });

            const posts = response.data.data.children.map(c => c.data);

            if (!posts.length) break;

            // Check if posts are older than cutoff
            for (const post of posts) {
                const postDate = new Date(post.created_utc * 1000);
                if (postDate < cutoffDate) {
                    fetchMore = false;
                    break;
                }
                allPosts.push(post);
            }

            after = response.data.data.after;
            if (!after) break; 
        }

        console.log(`Collected ${allPosts.length} posts from r/${subreddit} (last 50 days).\n`);

        // Analyze sentiment
        let happy = 0, neutral = 0, upset = 0;

        allPosts.forEach(post => {
            const text = `${post.title} ${post.selftext || ""}`;
            const score = sentiment.analyze(text).score;

            if (score > 0) happy++;
            else if (score < 0) upset++;
            else neutral++;

            const date = new Date(post.created_utc * 1000);
            console.log(`Date: ${date.toUTCString()}`);
            console.log(`Post: "${text}"`);
            console.log(`Sentiment score: ${score}\n`);
        });

        console.log("Sentiment Distribution:");
        console.log(` Happy: ${happy}`);
        console.log(` Neutral: ${neutral}`);
        console.log(` Upset: ${upset}`);

    } catch (error) {
        console.error("Error scraping Reddit:", error.message);
    }
};

runRedditScraper();
