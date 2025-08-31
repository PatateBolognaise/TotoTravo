// Configuration des sélecteurs CSS pour SeLoger.com
const SELECTORS = {
    title: [
        'meta[name="ad:title"]',
        'meta[property="og:title"]',
        'h1[data-testid="ad-title"]',
        '.ad-title',
        'h1.title',
        '[data-testid="title"]',
        'h1',
        '.property-title',
        '.listing-title'
    ],
    price: [
        'meta[name="ad:prix"]',
        '[data-testid="price"]',
        '.price',
        '.ad-price',
        '[data-testid="ad-price"]',
        '.price-value',
        '.property-price',
        '.listing-price'
    ],
    description: [
        'meta[name="ad:description"]',
        'meta[property="og:description"]',
        '[data-testid="description"]',
        '.description',
        '.ad-description',
        '[data-testid="ad-description"]',
        '.content-description',
        '.property-description',
        '.listing-description'
    ],
    surface: [
        'meta[name="ad:surface"]',
        '[data-testid="surface"]',
        '.surface',
        '.ad-surface',
        '[data-testid="ad-surface"]',
        '.surface-value',
        '.property-surface',
        '.listing-surface'
    ],
    images: [
        'meta[property="og:image"]',
        '[data-testid="gallery"] img',
        '.gallery img',
        '.ad-images img',
        '[data-testid="ad-images"] img',
        '.image-gallery img',
        '.property-images img',
        '.listing-images img'
    ]
};

// Fonction pour trouver le premier élément correspondant
function findElement(page, selectors) {
    for (const selector of selectors) {
        const element = page.querySelector(selector);
        if (element) {
            return element;
        }
    }
    return null;
}

// Fonction pour extraire le texte d'un élément
function extractText(element) {
    if (!element) return '';
    
    // Si c'est un meta tag, utiliser le contenu de l'attribut content
    if (element.tagName === 'META') {
        return element.getAttribute('content')?.trim() || '';
    }
    
    return element.textContent?.trim() || '';
}

// Fonction pour extraire les images
function extractImages(page) {
    const images = [];
    
    for (const selector of SELECTORS.images) {
        const imgElements = page.querySelectorAll(selector);
        for (const img of imgElements) {
            let src;
            
            // Si c'est un meta tag, utiliser le contenu de l'attribut content
            if (img.tagName === 'META') {
                src = img.getAttribute('content');
            } else {
                src = img.src;
            }
            
            if (src && !src.includes('placeholder') && !src.includes('logo')) {
                images.push(src);
            }
        }
        if (images.length > 0) break;
    }
    
    return images.slice(0, 10); // Limiter à 10 images
}

// Configuration Puppeteer pour SeLoger
const PUPPETEER_CONFIG = {
    headless: false,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-blink-features=AutomationControlled',
        '--ignoreDefaultArgs=["--enable-automation"]'
    ],
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

module.exports = {
    SELECTORS,
    findElement,
    extractText,
    extractImages,
    PUPPETEER_CONFIG
};
