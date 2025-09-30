import axios from 'axios';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || 'climate change'; // fallback
  const page = parseInt(searchParams.get('page')) || 1; // page number, default to 1
  const limit = parseInt(searchParams.get('limit')) || 10; // results per page, default to 10
  const expand = searchParams.get('expand'); // check if metadata expansion is requested
  
  try {
    // Step 1: Fetch all books without metadata (faster)
    const allBooksUrl = `https://directory.doabooks.org/rest/search?query=${encodeURIComponent(query)}`;
    console.log(`Fetching all books without metadata: ${allBooksUrl}`);
    
    const allBooksResponse = await axios.get(allBooksUrl, {
      headers: {
        Accept: 'application/json',
      },
      timeout: 10000, // Reduced to 10 seconds
    });

    const allBooks = allBooksResponse.data || [];
    console.log(`Total books found: ${allBooks.length}`);
    
    // Debug: Log structure of first book
    if (allBooks.length > 0) {
      console.log("Sample book structure:", JSON.stringify(allBooks[0], null, 2));
    }

    // Step 2: Calculate pagination
    const totalBooks = allBooks.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const currentPageBooks = allBooks.slice(startIndex, endIndex);
    
    console.log(`Page ${page}: showing books ${startIndex + 1}-${Math.min(endIndex, totalBooks)} of ${totalBooks}`);

    let finalBooks = currentPageBooks;

    // Step 3: Fetch metadata only if requested and for current page books (with concurrency limit)
    if (expand === 'metadata') {
      const CONCURRENCY_LIMIT = 5; // Process 5 books at a time
      const booksWithMetadata = [];
      
      for (let i = 0; i < currentPageBooks.length; i += CONCURRENCY_LIMIT) {
        const batch = currentPageBooks.slice(i, i + CONCURRENCY_LIMIT);
        
        const batchResults = await Promise.allSettled(
          batch.map(async (book) => {
            try {
              const metadataUrl = `https://directory.doabooks.org/rest/search?query=handle:"${book.handle}"&expand=metadata`;
              
              const metadataResponse = await axios.get(metadataUrl, {
                headers: {
                  Accept: 'application/json',
                },
                timeout: 3000, // Reduced to 3 seconds per book
              });

              // Return the book with metadata if found
              if (metadataResponse.data && metadataResponse.data.length > 0) {
                return metadataResponse.data[0];
              } else {
                return book; // Fallback to book without metadata
              }
            } catch (error) {
              console.error(`Failed to fetch metadata for book ${book.handle}:`, error.message);
              return book; // Fallback to book without metadata
            }
          })
        );
        
        // Extract fulfilled results
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            booksWithMetadata.push(result.value);
          } else {
            console.error('Batch result rejected:', result.reason);
          }
        });
      }
      
      finalBooks = booksWithMetadata;
    }

    // Step 4: Return paginated response
    console.log(`Returning ${finalBooks.length} books for page ${page}`);
    
    return new Response(JSON.stringify({
      results: finalBooks,
      pagination: {
        currentPage: page,
        limit: limit,
        totalResults: totalBooks,
        totalPages: Math.ceil(totalBooks / limit),
        hasMore: endIndex < totalBooks,
        hasPrevious: page > 1
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('DOAB API error:', error.message);

    if (error.code === 'ECONNABORTED') {
      return new Response(JSON.stringify({ error: 'Request timed out' }), { status: 504 });
    }

    return new Response(JSON.stringify({ error: 'Failed to fetch books' }), { status: 500 });
  }
}
