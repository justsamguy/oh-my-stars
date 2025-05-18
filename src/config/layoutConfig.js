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
    const footerDiv = document.createElement('div');
    footerDiv.className = 'css3d-element css3d-footer';

    // Always use the desktop structure, but adjust for mobile
    const isMobile = window.innerWidth <= 600;

    // Split navigation links into two arrays for desktop-like structure
    const halfLength = Math.ceil(footerConfig.navigation.links.length / 2);
    const leftLinks = footerConfig.navigation.links.slice(0, halfLength);
    const rightLinks = footerConfig.navigation.links.slice(halfLength);

    // Responsive: stack everything vertically on mobile, horizontally on desktop
    footerDiv.innerHTML = `
        <div class="footer-content" style="margin-bottom:2px; display:flex; flex-direction:${isMobile ? 'column' : 'row'}; align-items:center; gap:${isMobile ? '10px' : '12px'}; width:100%;">
            <div class="footer-brand" style="${isMobile ? 'order:1; text-align:center; margin-bottom:6px; display:block;' : 'order:1; text-align:left; display:block;'}">
                <h2 style="font-size:${isMobile ? '15px' : '16px'}; margin:0 0 3px 0; color:#afafaf; font-weight:normal">${wrapTextInGlowSpans(footerConfig.brand.text)}</h2>
                <p style="font-size:${isMobile ? '11px' : '12px'}; line-height:1.4; color:#aaa; margin:0">${wrapTextInGlowSpans(footerConfig.brand.description)}</p>
            </div>
            <div style="display:flex; gap:${isMobile ? '10px' : '12px'}; flex-direction:${isMobile ? 'column' : 'row'}; align-items:center; justify-content:center; width:100%;">
                <nav class="footer-nav" style="width:auto; gap:${isMobile ? '8px' : '2px'}; display:flex; flex-direction:column; align-items:center;">
                    ${leftLinks.map(link =>
                        `<a href="${link.href}" class="footer-link" style="font-size:${isMobile ? '15px' : '13px'}; display:inline-block; padding:6px 0;">${wrapTextInGlowSpans(link.text)}</a>`
                    ).join('')}
                </nav>
                <nav class="footer-nav" style="width:auto; gap:${isMobile ? '8px' : '2px'}; display:flex; flex-direction:column; align-items:center;">
                    ${rightLinks.map(link =>
                        `<a href="${link.href}" class="footer-link" style="font-size:${isMobile ? '15px' : '13px'}; display:inline-block; padding:6px 0;">${wrapTextInGlowSpans(link.text)}</a>`
                    ).join('')}
                </nav>
            </div>
        </div>
        <div class="copyright" style="font-size:${isMobile ? '12px' : '10px'}; color:#aaa; text-align:center; margin-top:2px; padding-top:2px; border-top:0.5px solid rgba(255,255,255,0.1)">${wrapTextInGlowSpans(footerConfig.copyright)}</div>
    `;

    // Add mouse move handler for glow effect
    setTimeout(() => {
        const links = footerDiv.querySelectorAll('a.footer-link');
        links.forEach(link => {
            link.addEventListener('mousemove', (e) => {
                const rect = link.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                link.style.setProperty('--mouse-x', `${x}%`);
                link.style.setProperty('--mouse-y', `${y}%`);
            });
        });
    }, 0);

    return footerDiv;
}
