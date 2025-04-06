'use client';

import { useState } from 'react';
import './background.css';
import './loadingProsess.css';
import './container_SevMini.css';

// Define a proper response type instead of using 'any'
interface ScrapeResponse {
  html?: string;
  styles?: string[];
  data?: Record<string, string | null>;
}

export default function Home() {
  const [url, setUrl] = useState('https://www.youtube.com/?app=desktop&gl=TH&hl=th');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ScrapeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
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
      const text = originalSrc
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
      const requestBody = { url };

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
    <div className={`px-10 py-8 bg-gray-700 ${response ? '' : 'h-screen'} background`}>
      <div className="flex justify-center items-center h-[100px]">
        <h1 className="text-3xl font-bold">Web Data Scraper</h1>
        <div className="container_SevMini pt-10 pl-4">
          <div className="SevMini">
            <svg
              width="74"
              height="90"
              viewBox="0 0 74 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M40 76.5L72 57V69.8615C72 70.5673 71.628 71.2209 71.0211 71.5812L40 90V76.5Z"
                fill="#396CAA"
              ></path>
              <path
                d="M34 75.7077L2 57V69.8615C2 70.5673 2.37203 71.2209 2.97892 71.5812L34 90V75.7077Z"
                fill="#396DAC"
              ></path>
              <path d="M34 76.5H40V90H34V76.5Z" fill="#396CAA"></path>
              <path
                d="M3.27905 55.593L35.2806 37.5438C36.3478 36.9419 37.6522 36.9419 38.7194 37.5438L70.721 55.593C71.7294 56.1618 71.7406 57.6102 70.7411 58.1945L39.2712 76.593C37.8682 77.4133 36.1318 77.4133 34.7288 76.593L3.25887 58.1945C2.25937 57.6102 2.27061 56.1618 3.27905 55.593Z"
                fill="#163C79"
                stroke="#396CAA"
              ></path>
              <path
                d="M40 79L72 60V70.4001C72 71.1151 71.6183 71.7758 70.9987 72.1329L40 90V79Z"
                fill="#173D7A"
              ></path>
              <path d="M34 79L3 61V71.5751L34 90V79Z" fill="#0665B2"></path>
              <path
                id="strobe_color1"
                d="M58 72.5L60.5 71V74L58 75.5V72.5Z"
                fill="#FF715E"
              ></path>
              <path
                id="strobe_color2"
                d="M63 69.5L65.5 68V71L63 72.5V69.5Z"
                fill="#17e300b4"
              ></path>
              <path d="M68 66.5L70.5 65V68L68 69.5V66.5Z" fill="#FF715E"></path>
              <path
                d="M40 58.5L72 39V51.8615C72 52.5673 71.628 53.2209 71.0211 53.5812L40 72V58.5Z"
                fill="#396CAA"
              ></path>
              <path
                d="M34 57.7077L2 39V51.8615C2 52.5673 2.37203 53.2209 2.97892 53.5812L34 72V57.7077Z"
                fill="#396DAC"
              ></path>
              <path d="M34 58.5H40V72H34V58.5Z" fill="#396CAA"></path>
              <path
                d="M3.27905 37.593L35.2806 19.5438C36.3478 18.9419 37.6522 18.9419 38.7194 19.5438L70.721 37.593C71.7294 38.1618 71.7406 39.6102 70.7411 40.1945L39.2712 58.593C37.8682 59.4133 36.1318 59.4133 34.7288 58.593L3.25887 40.1945C2.25937 39.6102 2.27061 38.1618 3.27905 37.593Z"
                fill="#163C79"
                stroke="#396CAA"
              ></path>
              <path
                d="M40 61L72 42V52.4001C72 53.1151 71.6183 53.7758 70.9987 54.1329L40 72V61Z"
                fill="#173D7A"
              ></path>
              <path d="M34 61L3 43V53.5751L34 72V61Z" fill="#0665B2"></path>
              <path d="M58 54.5L60.5 53V56L58 57.5V54.5Z" fill="#FF715E"></path>
              <path d="M63 51.5L65.5 50V53L63 54.5V51.5Z" fill="black"></path>
              <path
                id="strobe_color1"
                d="M63 51.5L65.5 50V53L63 54.5V51.5Z"
                fill="#FF715E"
              ></path>
              <path d="M68 48.5L70.5 47V50L68 51.5V48.5Z" fill="#FF715E"></path>
              <path
                d="M40 40.5L72 21V33.8615C72 34.5673 71.628 35.2209 71.0211 35.5812L40 54V40.5Z"
                fill="#396CAA"
              ></path>
              <path
                d="M34 39.7077L2 21V33.8615C2 34.5673 2.37203 35.2209 2.97892 35.5812L34 54V39.7077Z"
                fill="#396DAC"
              ></path>
              <path d="M34 40.5H40V54H34V40.5Z" fill="#396CAA"></path>
              <path
                d="M3.27905 19.593L35.2806 1.54381C36.3478 0.941872 37.6522 0.941872 38.7194 1.54381L70.721 19.593C71.7294 20.1618 71.7406 21.6102 70.7411 22.1945L39.2712 40.593C37.8682 41.4133 36.1318 41.4133 34.7288 40.593L3.25887 22.1945C2.25937 21.6102 2.27061 20.1618 3.27905 19.593Z"
                fill="#124E89"
                stroke="#396CAA"
              ></path>
              <path
                d="M40 43L72 24V34.4001C72 35.1151 71.6183 35.7758 70.9987 36.1329L40 54V43Z"
                fill="#173D7A"
              ></path>
              <path d="M34 43L3 25V35.5751L34 54V43Z" fill="#0665B2"></path>
              <path d="M68 30.5L70.5 29V32L68 33.5V30.5Z" fill="#FF715E"></path>
              <path
                id="strobe_color3"
                d="M58 36.5L60.5 35V38L58 39.5V36.5Z"
                fill="#FF715E"
              ></path>
              <path d="M63 33.5L65.5 32V35L63 36.5V33.5Z" fill="#FF715E"></path>
              <path
                d="M20.1902 22.0719C18.8101 21.3026 18.8252 19.3119 20.2168 18.5636L36.1054 10.0189C37.2884 9.3827 38.7116 9.3827 39.8946 10.0189L55.7832 18.5636C57.1748 19.3119 57.1899 21.3026 55.8098 22.0719L40.4345 30.6429C38.9211 31.4865 37.0789 31.4865 35.5655 30.6429L20.1902 22.0719Z"
                fill="#396CAA"
              ></path>
              <path
                d="M11 52.755C11 51.9801 11.8432 51.4997 12.5098 51.8947L23.5196 58.419C24.1273 58.7792 24.5 59.4332 24.5 60.1396V60.245C24.5 61.0199 23.6568 61.5003 22.9902 61.1053L11.9804 54.581C11.3727 54.2208 11 53.5668 11 52.8604V52.755Z"
                fill="#396CAA"
              ></path>
              <mask
                id="mask0_2_176"
                style={{ maskType: 'alpha' }}
                maskUnits="userSpaceOnUse"
                x="11"
                y="51"
                width="14"
                height="11"
              >
                <path
                  d="M11 52.755C11 51.9801 11.8432 51.4997 12.5098 51.8947L23.5196 58.419C24.1273 58.7792 24.5 59.4332 24.5 60.1396V60.245C24.5 61.0199 23.6568 61.5003 22.9902 61.1053L11.9804 54.581C11.3727 54.2208 11 53.5668 11 52.8604V52.755Z"
                  fill="#396CAA"
                ></path>
              </mask>
              <g mask="url(#mask0_2_176)">
                <path
                  d="M11.5 52.7417C11.5 51.9803 12.3349 51.5138 12.9833 51.9128L23.5482 58.4143C24.1397 58.7783 24.5 59.4231 24.5 60.1176V61.5L12.4598 54.4195C11.8651 54.0698 11.5 53.4315 11.5 52.7417V52.7417Z"
                  fill="#163874"
                ></path>
              </g>
              <mask
                id="mask1_2_176"
                style={{ maskType: 'alpha' }}
                maskUnits="userSpaceOnUse"
                x="19"
                y="9"
                width="38"
                height="23"
              >
                <path
                  d="M20.1902 22.0719C18.8101 21.3026 18.8252 19.3119 20.2168 18.5636L36.1054 10.0189C37.2884 9.3827 38.7116 9.3827 39.8946 10.0189L55.7832 18.5636C57.1748 19.3119 57.1899 21.3026 55.8098 22.0719L40.4345 30.6429C38.9211 31.4865 37.0789 31.4865 35.5655 30.6429L20.1902 22.0719Z"
                  fill="#396CAA"
                ></path>
              </mask>
              <g mask="url(#mask1_2_176)">
                <path
                  d="M18 21.3115L36.167 11.9451C37.3171 11.3521 38.6829 11.3521 39.833 11.9451L58 21.3115L40.3567 30.7405C38.8841 31.5275 37.1159 31.5275 35.6433 30.7405L18 21.3115Z"
                  fill="#173D7A"
                ></path>
              </g>
              <path
                d="M37.447 21.565L35 19.9799L37.6941 18.66L40.141 20.245L37.447 21.565Z"
                fill="#FF715E"
              ></path>
              <path
                d="M48.9738 30.8646L47.0741 29.7745L49.1792 28.684L51.0789 29.7741L48.9738 30.8646Z"
                fill="#173E7B"
              ></path>
              <path
                d="M52.0661 29.0093L50.1635 27.9242L52.2657 26.8282L54.1682 27.9133L52.0661 29.0093Z"
                fill="#173E7B"
              ></path>
              <path
                id="strobe_led1"
                d="M55.1521 27.1464L53.2538 26.054L55.3602 24.9661L57.2585 26.0586L55.1521 27.1464Z"
                fill="#3A6DAB"
              ></path>
            </svg>
          </div>
          <div className="Ghost">
            <svg
              width="60"
              height="36"
              viewBox="0 0 60 36"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.96545 19.4296C0.643777 18.6484 0.658726 16.7309 1.99242 15.9705L28.0186 1.12982C29.2467 0.429534 30.7533 0.429533 31.9814 1.12982L58.0076 15.9704C59.3413 16.7309 59.3562 18.6484 58.0346 19.4296L32.5442 34.4962C30.9749 35.4238 29.0251 35.4238 27.4558 34.4962L1.96545 19.4296Z"
                fill="#3C4F6D"
              ></path>
            </svg>
          </div>
        </div>

      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium mb-1">URL to scrape:</label>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-indigo-600 input input-bordered"
          disabled={isLoading}
        />

      </div>

      <button
        onClick={handleScrape}
        className="btn btn-primary rounded-lg"
        disabled={isLoading || !url}
      >
        {isLoading ? <>
          Scraping...<span className="loading loading-spinner loading-lg"></span>
        </> : 'Scrape Website'}
      </button>

      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded text-red-600">
          <strong>Error:</strong> {error}
        </div>
      )}

      {isLoading && (
        <div className="w-full h-96 mt-20 flex justify-center items-center">

          <div className="socket">
            <div className="gel center-gel">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c1 r1">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c2 r1">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c3 r1">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c4 r1">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c5 r1">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c6 r1">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>

            <div className="gel c7 r2">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>

            <div className="gel c8 r2">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c9 r2">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c10 r2">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c11 r2">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c12 r2">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c13 r2">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c14 r2">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c15 r2">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c16 r2">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c17 r2">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c18 r2">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c19 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c20 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c21 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c22 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c23 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c24 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c25 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c26 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c28 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c29 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c30 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c31 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c32 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c33 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c34 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c35 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c36 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>
            <div className="gel c37 r3">
              <div className="hex-brick h1"></div>
              <div className="hex-brick h2"></div>
              <div className="hex-brick h3"></div>
            </div>

          </div>

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
                    className={`px-3 py-1 text-sm rounded-lg ${viewMode === 'raw' ? 'btn btn-soft btn-accent' : 'btn btn-soft btn-info'}`}
                  >
                    Raw HTML
                  </button>
                  <button
                    onClick={() => setViewMode('rendered')}
                    className={`px-3 py-1 text-sm rounded-lg ${viewMode === 'rendered' ? 'btn btn-soft btn-accent' : 'btn btn-soft btn-info'}`}
                  >
                    Rendered View
                  </button>
                  <button
                    onClick={() => setViewMode('text')}
                    className={`px-3 py-1 text-sm rounded-lg ${viewMode === 'text' ? 'btn btn-soft btn-accent' : 'btn btn-soft btn-info'}`}
                  >
                    Text Content
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 border rounded-lg p-4 overflow-auto h-screen">
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
