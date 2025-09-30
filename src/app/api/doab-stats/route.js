import axios from 'axios';

export async function GET(req) {
  try {
    // Fetch all books from DOAB directory API
    const doabUrl = 'https://directory.doabooks.org/rest/search?query=*';
    console.log(`Fetching DOAB stats: ${doabUrl}`);
    
    const response = await axios.get(doabUrl, {
      headers: {
        Accept: 'application/json',
      },
      timeout: 10000, // 10 seconds timeout
    });

    const books = response.data || [];
    const totalCount = books.length;
    
    console.log(`Total DOAB books found: ${totalCount}`);

    return new Response(JSON.stringify({
      total: totalCount,
      success: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('DOAB Stats API error:', error.message);

    if (error.code === 'ECONNABORTED') {
      return new Response(JSON.stringify({ 
        error: 'Request timed out', 
        total: 0,
        success: false 
      }), { status: 504 });
    }

    return new Response(JSON.stringify({ 
      error: 'Failed to fetch DOAB stats', 
      total: 0,
      success: false 
    }), { status: 500 });
  }
}
