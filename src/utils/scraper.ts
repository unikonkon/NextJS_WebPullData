import puppeteer from 'puppeteer';

/**
 * Fetches HTML content from a given URL using Puppeteer
 * @param url The URL to scrape
 * @returns The HTML content as a string
 */
export async function fetchHtmlContent(url: string): Promise<{ html: string; styles: string[]; imageUrls: string[] }> {
  // Launch a new browser instance
  const browser = await puppeteer.launch({
    headless: true, // Use headless mode
  });

  try {
    // Open a new page
    const page = await browser.newPage();
    
    // Go to the specified URL
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    // Get the HTML content of the page
    const htmlContent = await page.content();
    
    // Extract all CSS styles - both inline and external
    const stylesheets = await page.evaluate(() => {
      // Get all external stylesheets
      const externalStyles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map(link => (link as HTMLLinkElement).href);
      
      // Get all inline styles
      const inlineStyles = Array.from(document.querySelectorAll('style'))
        .map(style => style.innerHTML);
      
      return { externalStyles, inlineStyles };
    });
    
    // Extract all image URLs from the page
    const imageUrls = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll('img'));
      return images.map(img => {
        const src = img.getAttribute('src') || '';
        const srcset = img.getAttribute('srcset') || '';
        const dataSrc = img.getAttribute('data-src') || '';
        const dataLazySrc = img.getAttribute('data-lazy-src') || '';
        
        // Return all possible image sources
        return {
          src,
          srcset,
          dataSrc,
          dataLazySrc,
          width: img.width,
          height: img.height,
          alt: img.alt,
          isRelative: src && !src.startsWith('http') && !src.startsWith('data:'),
          isComplete: img.complete
        };
      });
    });
    
    // Fetch content of external stylesheets
    const externalStyleContents: string[] = [];
    for (const styleUrl of stylesheets.externalStyles) {
      try {
        // Only fetch if it's a valid URL
        if (styleUrl && !styleUrl.startsWith('data:')) {
          const stylePage = await browser.newPage();
          await stylePage.goto(styleUrl, { waitUntil: 'domcontentloaded' }).catch(() => {});
          const styleContent = await stylePage.content().catch(() => '');
          if (styleContent) {
            // Extract just the CSS content
            const extractedCSS = await stylePage.evaluate(() => {
              return document.querySelector('body')?.innerText || '';
            });
            externalStyleContents.push(extractedCSS);
          }
          await stylePage.close();
        }
      } catch (error) {
        console.error(`Error fetching external stylesheet ${styleUrl}:`, error);
      }
    }
    
    // Combine all styles
    const allStyles = [...stylesheets.inlineStyles, ...externalStyleContents];
    
    return { 
      html: htmlContent, 
      styles: allStyles, 
      imageUrls: imageUrls.map(img => typeof img === 'string' ? img : JSON.stringify(img))
    };
  } catch (error) {
    console.error('Error while fetching HTML content:', error);
    throw error;
  } finally {
    // Close the browser instance
    await browser.close();
  }
}

/**
 * Extracts specific data from a URL using CSS selectors
 * @param url The URL to scrape
 * @param selectors An object with keys as data names and values as CSS selectors
 * @returns An object with the extracted data
 */
export async function extractDataFromUrl(
  url: string, 
  selectors: Record<string, string>
): Promise<Record<string, string | null>> {
  const browser = await puppeteer.launch({
    headless: true,
  });

  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const result: Record<string, string | null> = {};
    
    // Extract data based on provided selectors
    for (const [key, selector] of Object.entries(selectors)) {
      try {
        const element = await page.$(selector);
        result[key] = element ? await page.evaluate(el => el.textContent, element) : null;
      } catch (error) {
        console.error(`Error extracting ${key} with selector ${selector}:`, error);
        result[key] = null;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error while extracting data:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

