const fetch = require('node-fetch');
const cheerio = require('cheerio');

async function scrapeUrl(url) {
    try {
        console.log(`\n📥 Scraping URL: ${url}`);

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 15000 // 15 second timeout
        });

        if (!response.ok) throw new Error(`Failed to fetch URL: ${response.statusText}`);

        const html = await response.text();
        const $ = cheerio.load(html);

        // Remove noise elements
        $('script, style, nav, footer, header, noscript, iframe, aside, .ad, .advertisement, .cookie-notice, #cookie-banner').remove();

        const title = $('title').text().trim() || $('h1').first().text().trim() || url;
        console.log(`   Title: ${title}`);

        // Multiple extraction strategies for maximum content
        let extractedContent = [];

        // Strategy 1: Try to find main article content
        const articleSelectors = [
            'article',
            '[role="main"]',
            '.article-content',
            '.post-content',
            '.entry-content',
            '.content',
            'main',
            '#content',
            '.main-content'
        ];

        for (const selector of articleSelectors) {
            const element = $(selector).first();
            if (element.length && element.text().trim().length > 200) {
                extractedContent.push(element.text().trim());
                console.log(`   ✓ Extracted from: ${selector}`);
                break;
            }
        }

        // Strategy 2: Extract all meaningful paragraphs
        const paragraphs = [];
        $('p').each((i, elem) => {
            const text = $(elem).text().trim();
            // Only keep paragraphs with substantial content
            if (text.length > 50) {
                paragraphs.push(text);
            }
        });
        if (paragraphs.length > 0) {
            extractedContent.push(paragraphs.join('\n\n'));
            console.log(`   ✓ Extracted ${paragraphs.length} paragraphs`);
        }

        // Strategy 3: Extract lists (often contain important information)
        const lists = [];
        $('ul, ol').each((i, elem) => {
            const items = [];
            $(elem).find('li').each((j, li) => {
                const text = $(li).text().trim();
                if (text.length > 10) {
                    items.push('• ' + text);
                }
            });
            if (items.length > 0) {
                lists.push(items.join('\n'));
            }
        });
        if (lists.length > 0) {
            extractedContent.push('\n' + lists.join('\n\n'));
            console.log(`   ✓ Extracted ${lists.length} lists`);
        }

        // Strategy 4: Extract headings with their content
        const sections = [];
        $('h1, h2, h3').each((i, elem) => {
            const heading = $(elem).text().trim();
            if (heading && heading.length > 3 && heading.length < 200) {
                sections.push('\n【' + heading + '】');
            }
        });
        if (sections.length > 0) {
            extractedContent.push(sections.join(' '));
            console.log(`   ✓ Extracted ${sections.length} headings`);
        }

        // Strategy 5: Meta description as additional context
        const metaDescription = $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') || '';
        if (metaDescription && metaDescription.length > 20) {
            extractedContent.unshift(metaDescription); // Add at beginning
            console.log(`   ✓ Extracted meta description`);
        }

        // Combine all extracted content
        let bodyContent = extractedContent.join('\n\n');

        // Clean up the text
        bodyContent = bodyContent
            .replace(/\s+/g, ' ')           // Multiple spaces to single space
            .replace(/\n\s+\n/g, '\n\n')    // Clean up excessive newlines
            .replace(/\t+/g, ' ')           // Tabs to spaces
            .trim();

        // Log extraction stats
        const wordCount = bodyContent.split(/\s+/).length;
        const charCount = bodyContent.length;
        console.log(`   📊 Extracted: ${charCount} characters, ${wordCount} words`);

        // If we didn't get enough content, try body as last resort
        if (bodyContent.length < 200) {
            console.log(`   ⚠️ Low content, trying full body extraction...`);
            bodyContent = $('body').text().replace(/\s+/g, ' ').trim();

            // If still too short, add title and meta
            if (bodyContent.length < 100) {
                bodyContent = `${title}. ${metaDescription}`;
            }
        }

        if (!bodyContent || bodyContent.length < 50) {
            throw new Error("Could not extract meaningful content from this URL. The page might be protected, require JavaScript, or have minimal text content.");
        }

        console.log(`   ✅ Scraping complete!\n`);

        return {
            title,
            content: bodyContent,
            source: url
        };
    } catch (error) {
        console.error(`   ❌ Error scraping URL ${url}:`, error.message);
        throw error;
    }
}

module.exports = { scrapeUrl };
