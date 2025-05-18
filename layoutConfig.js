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
            { text: 'Github', href: 'https://github.com/justsamguy/oh-my-stars' }
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
    headerDiv.style.fontSize = '7px';  // Changed from '0.25em' to '7px'
    headerDiv.style.background = 'none';
    headerDiv.style.color = '#afafaf';
    headerDiv.innerHTML = `<h1>${wrapTextInGlowSpans(headerConfig.text)}</h1>`;
    return headerDiv;
}

export function createFooterElement() {
    // Remove any existing footer
    let htmlFooter = document.getElementById('app-html-footer');
    if (htmlFooter) htmlFooter.remove();
    let mobileFooter = document.getElementById('mobile-html-footer');
    if (mobileFooter) mobileFooter.remove();

    // Use a single structure for both desktop and mobile
    const isMobile = window.innerWidth <= 600;
    const footer = document.createElement('footer');
    footer.id = isMobile ? 'mobile-html-footer' : 'app-html-footer';
    footer.className = isMobile ? 'mobile-html-footer app-footer' : 'app-footer';
    footer.innerHTML = `
        <div class="footer-content">
            <div class="footer-brand">
                <h2>${wrapTextInGlowSpans(footerConfig.brand.text)}</h2>
                <p>${footerConfig.brand.description}</p>
            </div>
            <nav class="footer-nav">
                ${footerConfig.navigation.links.map(link =>
                    `<a href="${link.href}" class="footer-link" target="_blank" rel="noopener">${wrapTextInGlowSpans(link.text)}</a>`
                ).join('')}
            </nav>
        </div>
        <div class="copyright">${wrapTextInGlowSpans(footerConfig.copyright)}</div>
    `;
    return footer;
}
