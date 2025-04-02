'use client';

import { useState } from 'react';

// Define a proper response type instead of using 'any'
interface ScrapeResponse {
  html?: string;
  styles?: string[];
  data?: Record<string, string | null>;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractMode, setExtractMode] = useState(false);
  const [selectors, setSelectors] = useState<{ [key: string]: string }>({});
  const [newSelector, setNewSelector] = useState({ name: '', selector: '' });
  const [viewMode, setViewMode] = useState<'raw' | 'rendered'>('raw');
  const [styledHtml, setStyledHtml] = useState<string>('');

  const handleAddSelector = () => {
    if (newSelector.name && newSelector.selector) {
      setSelectors({
        ...selectors,
        [newSelector.name]: newSelector.selector
      });
      setNewSelector({ name: '', selector: '' });
    }
  };

  const handleRemoveSelector = (name: string) => {
    const updatedSelectors = { ...selectors };
    delete updatedSelectors[name];
    setSelectors(updatedSelectors);
  };

  const handleScrape = async () => {
    if (!url) {
      setError('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResponse(null);
    setStyledHtml('');

    try {
      const requestBody: { url: string; selectors?: Record<string, string> } = { url };
      
      if (extractMode && Object.keys(selectors).length > 0) {
        requestBody.selectors = selectors;
      }

      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to scrape URL');
      }

      const data = await res.json();
      setResponse(data);
      
      if (data.html && data.styles) {
        // Combine HTML with styles for the rendered view
        const combinedHtml = createHtmlWithStyles(data.html, data.styles);
        setStyledHtml(combinedHtml);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to combine HTML content with its CSS styles
  const createHtmlWithStyles = (html: string, styles: string[]): string => {
    // Extract the head and body content
    const headMatch = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(html);
    const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);
    
    const headContent = headMatch ? headMatch[1] : '';
    const bodyContent = bodyMatch ? bodyMatch[1] : html;
    
    // Create a style tag with all the CSS content
    const styleTag = styles.map(style => `<style>${style}</style>`).join('');
    
    // Create a new HTML document that includes both the original content and the styles
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${styleTag}
          ${headContent}
        </head>
        <body>
          ${bodyContent}
        </body>
      </html>
    `;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Web Data Scraper</h1>
      
      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">URL to scrape:</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      <div className="mb-6">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={extractMode}
            onChange={() => setExtractMode(!extractMode)}
            className="h-4 w-4"
            disabled={isLoading}
          />
          <span>Extract specific elements using CSS selectors</span>
        </label>
      </div>

      {extractMode && (
        <div className="mb-6 bg-gray-50 p-4 rounded">
          <h3 className="font-medium mb-3">CSS Selectors</h3>
          
          <div className="grid grid-cols-5 gap-3 mb-3">
            <input
              className="col-span-2 p-2 border rounded"
              placeholder="Name (e.g. title)"
              value={newSelector.name}
              onChange={(e) => setNewSelector({ ...newSelector, name: e.target.value })}
              disabled={isLoading}
            />
            <input
              className="col-span-2 p-2 border rounded"
              placeholder="CSS Selector (e.g. h1.title)"
              value={newSelector.selector}
              onChange={(e) => setNewSelector({ ...newSelector, selector: e.target.value })}
              disabled={isLoading}
            />
            <button
              onClick={handleAddSelector}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              disabled={!newSelector.name || !newSelector.selector || isLoading}
            >
              Add
            </button>
          </div>

          {Object.keys(selectors).length > 0 && (
            <div className="bg-white border rounded p-3">
              <h4 className="text-sm font-medium mb-2">Active selectors:</h4>
              <ul className="space-y-2">
                {Object.entries(selectors).map(([name, selector]) => (
                  <li key={name} className="flex justify-between items-center text-sm">
                    <span>
                      <strong>{name}:</strong> {selector}
                    </span>
                    <button
                      onClick={() => handleRemoveSelector(name)}
                      className="text-red-500 hover:text-red-700"
                      disabled={isLoading}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button
        onClick={handleScrape}
        className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
        disabled={isLoading || !url}
      >
        {isLoading ? 'Scraping...' : 'Scrape Website'}
      </button>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-3">Result:</h2>
          
          {response.data ? (
            <div className="bg-gray-50 border rounded p-4 overflow-auto max-h-96">
              <h3 className="text-lg font-medium mb-2">Extracted Data:</h3>
              <pre className="whitespace-pre-wrap bg-white p-3 rounded border">
                {JSON.stringify(response.data, null, 2)}
              </pre>
            </div>
          ) : (
            <div>
              <div className="flex justify-between mb-3">
                <h3 className="text-lg font-medium">HTML Content:</h3>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setViewMode('raw')}
                    className={`px-3 py-1 text-sm rounded ${viewMode === 'raw' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  >
                    Raw HTML
                  </button>
                  <button 
                    onClick={() => setViewMode('rendered')}
                    className={`px-3 py-1 text-sm rounded ${viewMode === 'rendered' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                  >
                    Rendered View
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 border rounded p-4 overflow-auto h-screen">
                {viewMode === 'raw' ? (
                  <div className="bg-white p-3 rounded border overflow-auto">
                    <pre className="text-xs">{response.html}</pre>
                  </div>
                ) : (
                  <div className="bg-white rounded border overflow-hidden">
                    <div className="p-2 bg-gray-100 border-b flex justify-between items-center">
                      <span className="text-sm font-medium">Rendered View (with CSS)</span>
                      <span className="text-xs text-gray-500">Some advanced features may be limited in this view</span>
                    </div>
                    <iframe 
                      sandbox="allow-same-origin"
                      srcDoc={styledHtml || response.html}
                      className="w-full h-screen border-0"
                      title="Scraped Content Preview"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
