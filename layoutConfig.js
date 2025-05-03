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
    headerDiv.innerHTML = `<h1>${wrapTextInGlowSpans(headerConfig.text)}</h1>`;
    return headerDiv;
}

export function createFooterElement() {
    const footerDiv = document.createElement('div');
    footerDiv.className = 'css3d-element css3d-footer';
    
    footerDiv.innerHTML = `
        <div class="footer-content">
            <div class="footer-brand">
                <h2>${wrapTextInGlowSpans(footerConfig.brand.text)}</h2>
                <p>${footerConfig.brand.description}</p>
            </div>
            <nav class="footer-nav">
                ${footerConfig.navigation.links.map(link => 
                    `<a href="${link.href}">${wrapTextInGlowSpans(link.text)}</a>`
                ).join('')}
            </nav>
        </div>
        <div class="copyright">${footerConfig.copyright}</div>
    `;
    
    return footerDiv;
}
