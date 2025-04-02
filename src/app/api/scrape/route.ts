import { NextRequest, NextResponse } from 'next/server';
import { fetchHtmlContent, extractDataFromUrl } from '@/utils/scraper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, selectors } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // If selectors are provided, extract specific data using those selectors
    if (selectors && Object.keys(selectors).length > 0) {
      const data = await extractDataFromUrl(url, selectors);
      return NextResponse.json({ data });
    } 
    
    // Otherwise fetch the full HTML content and CSS styles
    const { html, styles } = await fetchHtmlContent(url);
    return NextResponse.json({ html, styles });
  } catch (error) {
    console.error('Error in scrape API:', error);
    return NextResponse.json(
      { error: 'Failed to scrape the URL', details: (error as Error).message },
      { status: 500 }
    );
  }
} 