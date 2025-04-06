# Next.js Web Scraper

A web application built with Next.js that allows users to extract HTML content and specific data from websites using Puppeteer.

## Features

- Fetch complete HTML content from any URL
- User-friendly interface for configuring scraping tasks
- API endpoint for programmatic access

## Getting Started

### Prerequisites

- Node.js 18.14.2 or higher
- npm

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000/home](http://localhost:3000/home) in your browser

## Usage

### Web Interface

1. Navigate to the home page
2. Enter the URL you want to scrape
3. Choose between full HTML extraction or specific elements:
   - For full HTML: simply enter the URL and click "Scrape Website"
   - For specific elements: check the "Extract specific elements" option, add CSS selectors with descriptive names, and click "Scrape Website"

### API Usage

You can also use the scraper programmatically via the API endpoint:

```javascript
// Example: Fetch full HTML
const response = await fetch('/api/scrape', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com'
  }),
});

const data = await response.json();
console.log(data.html); // Contains the full HTML

// Example: Extract specific elements
const response = await fetch('/api/scrape', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    url: 'https://example.com',
    selectors: {
      title: 'h1',
      description: 'meta[name="description"]',
      links: 'a.important-link'
    }
  }),
});

const data = await response.json();
console.log(data.data); // Contains the extracted elements
```

## Important Notes

- Web scraping should be done responsibly and in accordance with the target website's terms of service
- Some websites may block automated scraping attempts
- This tool is intended for educational and personal use only
