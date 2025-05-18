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

    // Detect mobile (≤600px) at creation time
    const isMobile = window.innerWidth <= 600;
    if (isMobile) {
        mobileFooter = document.createElement('footer');
        mobileFooter.id = 'mobile-html-footer';
        mobileFooter.className = 'mobile-html-footer';
        mobileFooter.innerHTML = `
            <div class="footer-content">
                <nav class="footer-nav">
                    ${footerConfig.navigation.links.map(link =>
                        `<a href="${link.href}" class="footer-link">${wrapTextInGlowSpans(link.text)}</a>`
                    ).join('')}
                </nav>
            </div>
            <div class="copyright">${wrapTextInGlowSpans(footerConfig.copyright)}</div>
        `;
        return mobileFooter;
    } else {
        htmlFooter = document.createElement('footer');
        htmlFooter.id = 'app-html-footer';
        htmlFooter.className = 'app-footer';
        htmlFooter.innerHTML = `
            <div class="footer-content">
                <nav class="footer-nav">
                    ${footerConfig.navigation.links.map(link =>
                        `<a href="${link.href}" class="footer-link">${wrapTextInGlowSpans(link.text)}</a>`
                    ).join('')}
                </nav>
            </div>
            <div class="copyright">${wrapTextInGlowSpans(footerConfig.copyright)}</div>
        `;
        return htmlFooter;
    }
}
