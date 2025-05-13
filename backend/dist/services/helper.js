"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combineAndRankResults = combineAndRankResults;
exports.formatSearchResults = formatSearchResults;
function combineAndRankResults(resultsArray) {
    // Create a map to track unique results and their combined scores
    const combinedResults = new Map();
    // Process each query's results
    resultsArray.forEach((queryResults, queryIndex) => {
        queryResults.forEach((result, resultIndex) => {
            const key = result.linkId || result.url;
            // Calculate a position score (results at top positions get higher scores)
            const positionScore = 1 / (resultIndex + 1);
            // Calculate a query importance score (earlier queries are more important)
            const queryImportance = 1 / (queryIndex + 1);
            // Combine the scores
            const weightedScore = result.score * positionScore * queryImportance;
            if (combinedResults.has(key)) {
                // If we've seen this result before, update its score
                const existingResult = combinedResults.get(key);
                existingResult.score += weightedScore;
                combinedResults.set(key, existingResult);
            }
            else {
                // First time seeing this result
                combinedResults.set(key, Object.assign(Object.assign({}, result), { score: weightedScore }));
            }
        });
    });
    // Convert map to array and sort by score (highest first)
    return Array.from(combinedResults.values())
        .sort((a, b) => b.score - a.score);
}
/**
 * Format ranked results as a string
 * @param results Ranked search results
 * @param maxResults Maximum number of results to include
 */
function formatSearchResults(results, maxResults = 3) {
    if (results.length === 0) {
        return "No relevant results found.";
    }
    // Take only the top results
    const topResults = results.slice(0, maxResults);
    // Format each result
    return topResults.map(result => `link: ${result.url}, title: ${result.title}, description: ${result.description}, body: ${result.body}`).join(" ");
}
