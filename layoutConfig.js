export const headerConfig = {
    text: 'Oh My Stars'
};

export const footerConfig = {
    brand: {
        text: 'Oh My Stars',
        description: 'An interactive journey through the cosmos. Explore stellar phenomena and the mysteries of deep space.'
    },
    navigation: {
        links: [
            { text: 'Star Map', href: '#map' },
            { text: 'Points of Interest', href: '#poi' },
            { text: 'Documentation', href: '#docs' },
            { text: 'Updates', href: '#updates' },
            { text: 'About', href: '#about' }
        ]
    },
    copyright: '© 2025 S&A All rights reserved.'
};

// Helper function to wrap text in glow spans
export function wrapTextInGlowSpans(text) {
    return [...text].map(char => 
        char === ' ' ? '<span class="glow-char">&nbsp;</span>' : 
        `<span class="glow-char">${char}</span>`
    ).join('');
}

export function createHeaderElement() {
    const headerDiv = document.createElement('div');
    headerDiv.className = 'css3d-element css3d-header';
    headerDiv.style.width = '250px';
    headerDiv.style.fontSize = '24px';  // Restored original size
    headerDiv.style.fontFamily = "'Montserrat', sans-serif";
    headerDiv.style.color = '#afafaf';
    headerDiv.innerHTML = `<h1>${wrapTextInGlowSpans(headerConfig.text)}</h1>`;
    return headerDiv;
}

export function createFooterElement() {
    const footerDiv = document.createElement('div');
    footerDiv.className = 'css3d-element css3d-footer';
    footerDiv.style.width = '400px';
    footerDiv.style.fontSize = '12px';  // Restored original size
    footerDiv.style.padding = '15px 20px';
    footerDiv.style.boxSizing = 'border-box';
    footerDiv.style.fontFamily = "'Montserrat', sans-serif";
    
    // Add specific font sizes for footer elements
    footerDiv.innerHTML = `
        <div class="footer-content">
            <div class="footer-brand">
                <h2 style="font-size: 16px; margin: 0 0 8px 0">${wrapTextInGlowSpans(footerConfig.brand.text)}</h2>
                <p style="font-size: 12px; line-height: 1.4">${footerConfig.brand.description}</p>
            </div>
            <nav class="footer-nav">
                ${footerConfig.navigation.links.map(link => 
                    `<a href="${link.href}" style="font-size: 12px">${wrapTextInGlowSpans(link.text)}</a>`
                ).join('')}
            </nav>
        </div>
        <div class="copyright" style="font-size: 10px">${footerConfig.copyright}</div>
    `;
    
    return footerDiv;
}
