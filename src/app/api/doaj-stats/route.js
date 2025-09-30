import axios from 'axios';

export async function GET(req) {
  try {
    // Fetch articles count from DOAJ API
    const articlesUrl = 'https://doaj.org/api/v2/search/articles/*';
    console.log(`Fetching DOAJ articles: ${articlesUrl}`);
    
    // Fetch journals count from DOAJ API
    const journalsUrl = 'https://doaj.org/api/v2/search/journals/*';
    console.log(`Fetching DOAJ journals: ${journalsUrl}`);
    
    const [articlesResponse, journalsResponse] = await Promise.all([
      axios.get(articlesUrl, {
        headers: {
          Accept: 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
      }),
      axios.get(journalsUrl, {
        headers: {
          Accept: 'application/json',
        },
        timeout: 10000, // 10 seconds timeout
      })
    ]);

    const articlesCount = articlesResponse.data?.total || 0;
    const journalsCount = journalsResponse.data?.total || 0;
    const totalCount = articlesCount + journalsCount;
    
    console.log(`DOAJ Articles: ${articlesCount}, Journals: ${journalsCount}, Total: ${totalCount}`);

    return new Response(JSON.stringify({
      articles: articlesCount,
      journals: journalsCount,
      total: totalCount,
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('DOAJ Stats API error:', error.message);

    if (error.code === 'ECONNABORTED') {
      return new Response(JSON.stringify({ 
        error: 'Request timed out', 
        articles: 0,
        journals: 0,
        total: 0,
        success: false 
      }), { status: 504 });
    }

    return new Response(JSON.stringify({ 
      error: 'Failed to fetch DOAJ stats', 
      articles: 0,
      journals: 0,
      total: 0,
      success: false 
    }), { status: 500 });
  }
}
