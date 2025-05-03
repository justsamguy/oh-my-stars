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
    headerDiv.style.fontSize = '0.25em';  // Smaller font size
    headerDiv.style.background = 'none';
    headerDiv.style.color = '#afafaf';
    headerDiv.innerHTML = `<h1>${wrapTextInGlowSpans(headerConfig.text)}</h1>`;
    return headerDiv;
}

export function createFooterElement() {
    const footerDiv = document.createElement('div');
    footerDiv.className = 'css3d-element css3d-footer';
    footerDiv.style.width = '400px';
    footerDiv.style.fontSize = '1.5px';
    footerDiv.style.background = 'rgba(0,0,0,0.5)';
    footerDiv.style.padding = '8px 15px';
    footerDiv.style.boxSizing = 'border-box';
    footerDiv.style.height = '45px'; // Increased height to fit content
    
    footerDiv.innerHTML = `
        <div class="footer-content">
            <div class="footer-brand">
                <h2 style="font-size: 5px; margin: 0 0 4px 0; color: #fff">${wrapTextInGlowSpans(footerConfig.brand.text)}</h2>
                <p style="font-size: 3px; line-height: 1.3; color: #aaa; margin: 0">${wrapTextInGlowSpans(footerConfig.brand.description)}</p>
            </div>
            <nav class="footer-nav" style="width: 90px; gap: 2px; display: flex; flex-direction: column">
                ${footerConfig.navigation.links.map(link => 
                    `<a href="${link.href}" style="font-size: 3px; color: #aaa; text-decoration: none">${wrapTextInGlowSpans(link.text)}</a>`
                ).join('')}
            </nav>
        </div>
        <div class="copyright" style="font-size: 2.75px; color: #666; text-align: center; margin-top: 4px; padding-top: 4px; border-top: 0.5px solid rgba(255,255,255,0.1)">${wrapTextInGlowSpans(footerConfig.copyright)}</div>
    `;
    
    return footerDiv;
}
