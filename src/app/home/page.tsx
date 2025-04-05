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
  const [viewMode, setViewMode] = useState<'raw' | 'rendered' | 'text'>('raw');
  const [styledHtml, setStyledHtml] = useState<string>('');


  const [plainText, setPlainText] = useState<string>('');

  const extractTextFromHtml = (html: string): string => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Remove <meta> tags
    doc.querySelectorAll('meta').forEach(el => el.remove());

    // $("a").attr("onclick", "ChkRet_nosess();").remove()
    doc.querySelectorAll('a[onclick="ChkRet_nosess();"]').forEach(el => el.remove());

    // $("input").attr("class", "btnCommon").remove()
    doc.querySelectorAll('input.btnCommon').forEach(el => el.remove());

    // $("img").attr("src", "/egp2procmainWeb/images/pagefooter.gif").remove()
    doc.querySelectorAll('img[src="/egp2procmainWeb/images/pagefooter.gif"]').forEach(el => el.remove());

    // $('script, style').remove();
    doc.querySelectorAll('script, style').forEach(el => el.remove());

    // Append meta tag
    const meta = doc.createElement('meta');
    meta.setAttribute('http-equiv', 'Content-Type');
    meta.setAttribute('content', 'text/html; charset=utf-8');
    doc.head.appendChild(meta);

    // Optional: You could return `doc.documentElement.outerHTML` if needed
    // const content = '<meta charset="UTF-8">' + doc.documentElement.innerHTML;

    // Extract and clean text
    const text = doc.body.textContent || '';
    return text
      .trim()
      .replace(/\t/g, '')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')
      .join('\n');
  };

  // Function to combine HTML content with its CSS styles
  const createHtmlWithStyles = (html: string, styles: string[]): string => {
    // Extract the head and body content
    const headMatch = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(html);
    const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(html);

    const headContent = headMatch ? headMatch[1] : '';
    let bodyContent = bodyMatch ? bodyMatch[1] : html;

    // สร้าง DOM parser เพื่อจัดการกับแท็ก img
    const parser = new DOMParser();
    const doc = parser.parseFromString(bodyContent, 'text/html');

    // เลือกทุกแท็ก img 
    const images = doc.querySelectorAll('img');

    // ฟังก์ชันสร้าง placeholder image ตามขนาดและข้อความที่กำหนด
    const getPlaceholderImage = (img: HTMLImageElement, originalSrc: string = '') => {
      // ดึงขนาดของรูปภาพ
      let width = img.width || 0;
      let height = img.height || 0;

      // ถ้าไม่มีขนาดหรือขนาดไม่ถูกต้อง ให้กำหนดค่าเริ่มต้น
      if (!width || width < 10) width = 300;
      if (!height || height < 10) height = 200;

      // ทำให้ขนาดอยู่ในช่วงที่ Placehold.co รองรับ (10-4000)
      width = Math.min(Math.max(width, 10), 4000);
      height = Math.min(Math.max(height, 10), 4000);

      // สร้างข้อความสำหรับแสดงบน placeholder
      let text = originalSrc
        ? `Image:+${width}x${height}+(${originalSrc.substring(0, 20)}${originalSrc.length > 20 ? '...' : ''})`
        : `Image:+${width}x${height}`;

      // สร้าง URL สำหรับ Placehold.co
      // รูปแบบ: https://placehold.co/widthxheight/cccccc/333333?text=Custom+Text
      return `https://placehold.co/${width}x${height}/f0f0f0/333333?text=${encodeURIComponent(text)}`;
    };

    // แก้ไขรูปภาพทั้งหมด
    images.forEach((img) => {
      const src = img.getAttribute('src') || '';

      // ตรวจสอบว่าเป็นลิงก์สัมพัทธ์หรือไม่
      if (src && !src.startsWith('http') && !src.startsWith('data:')) {
        // บันทึก src เดิมไว้
        img.setAttribute('data-original-src', src);

        // สร้าง placeholder ตามขนาดของรูปภาพ
        const placeholderUrl = getPlaceholderImage(img as HTMLImageElement, src);
        img.setAttribute('src', placeholderUrl);
        img.setAttribute('title', `Original src: ${src}`);
      }
      // สำหรับรูปที่ไม่มี src หรือ src เป็นค่าว่าง
      else if (!src || src === '') {
        const placeholderUrl = getPlaceholderImage(img as HTMLImageElement, 'No source');
        img.setAttribute('src', placeholderUrl);
        img.setAttribute('title', 'Missing image source');
      }

      // เพิ่ม onerror handler เพื่อให้โหลดรูปตัวอย่างหากรูปเดิมโหลดไม่ได้
      img.setAttribute('onerror', `
        this.onerror=null; 
        const width = this.width || 300;
        const height = this.height || 200;
        const originalSrc = this.getAttribute('data-original-src') || this.src;
        this.src = 'https://placehold.co/' + width + 'x' + height + '/f8d7da/721c24?text=Load+Error:+' + encodeURIComponent(originalSrc.substring(0, 15) + '...');
        this.title = 'Failed to load: ' + originalSrc;
        this.classList.add('img-replaced');
      `);
    });

    // แปลง DOM กลับเป็น HTML string
    bodyContent = doc.body.innerHTML;

    // เพิ่ม CSS สำหรับการแสดงผลรูปภาพ
    const additionalStyle = `
      <style>
        img {
          max-width: 100%;
          height: auto;
          border: 1px solid #eee;
          padding: 2px;
          margin: 5px;
        }
        img[data-original-src] {
          border: 1px dashed #ff9800;
        }
        img:hover {
          box-shadow: 0 0 5px rgba(0,0,0,0.3);
        }
        .img-replaced {
          position: relative;
        }
        .img-replaced::before {
          content: "⚠️";
          position: absolute;
          top: 0;
          left: 0;
          background: rgba(255, 152, 0, 0.7);
          color: white;
          padding: 2px 6px;
          font-size: 10px;
          border-radius: 3px;
        }
      </style>
    `;

    // Create a style tag with all the CSS content
    const styleTag = styles.map(style => `<style>${style}</style>`).join('');

    // สร้าง HTML ใหม่ที่รวม styles และโค้ด JavaScript สำหรับการทำงานกับรูปภาพ
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          ${additionalStyle}
          ${styleTag}
          ${headContent}
        </head>
        <body>
          <div class="image-notice" style="background: #fff8e1; padding: 10px; margin-bottom: 15px; border-left: 4px solid #ff9800; color: #333;">
            <strong>หมายเหตุเกี่ยวกับรูปภาพ:</strong> รูปภาพบางส่วนถูกแทนที่ด้วยภาพตัวอย่างที่มีขนาดเท่ากับรูปต้นฉบับ เนื่องจากลิงก์สัมพัทธ์หรือไม่สามารถโหลดได้
          </div>
          ${bodyContent}
          <script>
            // เพิ่ม script เพื่อให้สามารถคลิกที่รูปภาพและดูแหล่งที่มาเดิมได้
            document.querySelectorAll('img[data-original-src]').forEach(img => {
              img.classList.add('img-replaced');
              img.addEventListener('click', function() {
                alert('ที่อยู่ของรูปภาพเดิม: ' + this.getAttribute('data-original-src'));
              });
            });
          </script>
        </body>
      </html>
    `;
  };

  const extractTextFromReactCode = (html: string): string => {
    // สร้าง DOM parser เพื่อแปลง HTML string เป็น DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // ลบ elements ที่ไม่ต้องการ
    doc.querySelectorAll('script, style, meta, link').forEach(el => el.remove());

    // สร้างผลลัพธ์ HTML
    let result = '';

    // ฟังก์ชันสำหรับดึงข้อความจาก element และสร้าง div
    const extractTextAndCreateDiv = (element: Element) => {
      // ตรวจสอบว่า element มีข้อความหรือไม่
      const textContent = element.textContent?.trim();
      if (textContent && textContent.length > 0) {
        // สร้าง class ตาม tag name
        const tagName = element.tagName.toLowerCase();
        // สร้าง div แสดงข้อความพร้อมระบุ tag ที่มา
        result += `<div class="extracted-text ${tagName}-text" style="margin-bottom: 10px; padding: 8px; border-left: 3px solid #007bff;">
          <span style="font-size: 10px; color: #666; display: block; margin-bottom: 4px;">${tagName}</span>
          <div style="font-size: 14px;">${textContent}</div>
        </div>\n`;
      }

      // วนลูป element ลูกทั้งหมด
      Array.from(element.children).forEach(child => {
        // หากเป็น element ที่ต้องการข้ามไป
        if (['script', 'style', 'meta', 'link', 'svg', 'path', 'img'].includes(child.tagName.toLowerCase())) {
          return;
        }
        extractTextAndCreateDiv(child);
      });
    };

    // เริ่มดึงข้อความจาก body
    if (doc.body) {
      // สร้างหัวข้อสำหรับผลลัพธ์
      result = `<div style="font-family: sans-serif;">
        <div style="background-color: #f0f0f0; padding: 10px; margin-bottom: 15px; border-radius: 4px;">
          <h2 style="margin: 0; color: #333;">ข้อความจากเว็บไซต์</h2>
          <p style="margin: 5px 0 0; font-size: 12px; color: #666;">แสดงข้อความที่ดึงจาก HTML โดยแยกตาม element และแสดงเป็น div</p>
        </div>`;

      // เก็บ element ที่มีข้อความสำคัญโดยตรง
      const importantElements = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, div, section, article, main, header, footer, aside, nav'));

      // ถ้าไม่มี element สำคัญ ให้ดึงจาก body โดยตรง
      if (importantElements.length === 0) {
        extractTextAndCreateDiv(doc.body);
      } else {
        // วนลูปดึงข้อความจาก element สำคัญ
        importantElements.forEach(element => {
          // ตรวจสอบว่ามี element พ่อแม่อยู่ใน importantElements หรือไม่
          // ถ้ามี ให้ข้ามไปเพื่อหลีกเลี่ยงการซ้ำซ้อน
          let parent = element.parentElement;
          let hasImportantParent = false;

          while (parent) {
            if (importantElements.includes(parent)) {
              hasImportantParent = true;
              break;
            }
            parent = parent.parentElement;
          }

          // ถ้าไม่มีพ่อแม่ที่สำคัญ จึงดึงข้อความออกมา
          if (!hasImportantParent) {
            extractTextAndCreateDiv(element);
          }
        });
      }

      // ปิด div หลัก
      result += '</div>';
    }

    return result;
  };

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
        setPlainText(extractTextFromHtml(data.html));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
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

      {/* <div className="mb-6">
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
      </div> */}
      {/* 
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
      )} */}

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
                    className={`px-3 py-1 text-sm rounded ${viewMode === 'raw' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
                  >
                    Raw HTML
                  </button>
                  <button
                    onClick={() => setViewMode('rendered')}
                    className={`px-3 py-1 text-sm rounded ${viewMode === 'rendered' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
                  >
                    Rendered View
                  </button>
                  <button
                    onClick={() => setViewMode('text')}
                    className={`px-3 py-1 text-sm rounded ${viewMode === 'text' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'}`}
                  >
                    Text Content
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 border rounded p-4 overflow-auto h-screen">
                {viewMode === 'raw' ? (
                  <div className="bg-white p-3 rounded border overflow-auto text-black">
                    <pre className="text-xs">{response.html}</pre>
                  </div>
                ) : viewMode === 'rendered' ? (
                  <div className="bg-gray-100 rounded border overflow-hidden">
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
                ) : viewMode === 'text' ? (
                  <div className="bg-white p-3 rounded border overflow-auto text-black">
                    <pre className="text-xs whitespace-pre-wrap">{plainText}</pre>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
