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

    const isMobile = window.innerWidth <= 600;
    if (isMobile) {
        // Mobile: only show nav links and copyright, no brand/description, simple layout
        footerDiv.style.width = '98vw';
        footerDiv.style.maxWidth = '98vw';
        footerDiv.style.background = 'transparent';
        footerDiv.style.borderRadius = '0';
        footerDiv.style.padding = '0';
        footerDiv.style.boxSizing = 'border-box';
        footerDiv.style.minHeight = '0';
        footerDiv.style.boxShadow = 'none';
        footerDiv.style.borderTop = 'none';
        footerDiv.style.display = 'flex';
        footerDiv.style.flexDirection = 'column';
        footerDiv.style.alignItems = 'center';
        footerDiv.style.justifyContent = 'center';
        footerDiv.innerHTML = `
            <nav class="footer-nav" style="width:100%; display:flex; flex-direction:row; align-items:center; justify-content:center; gap:18px; margin-bottom:6px;">
                ${footerConfig.navigation.links.map(link =>
                    `<a href="${link.href}" class="footer-link" style="font-size:15px; color:#ccc; text-decoration:none; padding:2px 8px; border-radius:4px; text-shadow:0 0 8px rgba(255,255,255,0.7);">${wrapTextInGlowSpans(link.text)}</a>`
                ).join('')}
            </nav>
            <div class="copyright" style="font-size:12px; color:#aaa; text-align:center; margin-top:2px; text-shadow:0 0 8px rgba(255,255,255,0.5);">${wrapTextInGlowSpans(footerConfig.copyright)}</div>
        `;
    } else {
        // Desktop: horizontal layout, brand left, nav center, copyright right
        footerDiv.style.width = '90vw';
        footerDiv.style.maxWidth = '600px';
        footerDiv.style.background = 'rgba(0, 20, 40, 0.95)';
        footerDiv.style.borderRadius = '10px';
        footerDiv.style.padding = '14px 24px 10px 24px';
        footerDiv.style.boxSizing = 'border-box';
        footerDiv.style.minHeight = '48px';
        footerDiv.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.2)';
        footerDiv.style.borderTop = '1px solid rgba(255,255,255,0.1)';
        footerDiv.style.display = 'flex';
        footerDiv.style.flexDirection = 'row';
        footerDiv.style.alignItems = 'center';
        footerDiv.style.justifyContent = 'space-between';
        footerDiv.innerHTML = `
            <div class="footer-brand" style="text-align:left; color:#fff; font-size:16px; font-weight:600;">${wrapTextInGlowSpans(footerConfig.brand.text)}</div>
            <nav class="footer-nav" style="display:flex; flex-direction:row; gap:18px; justify-content:flex-end; flex:1;">
                ${footerConfig.navigation.links.map(link =>
                    `<a href="${link.href}" class="footer-link" style="font-size:15px; color:#ccc; text-decoration:none; padding:2px 8px; border-radius:4px;">${wrapTextInGlowSpans(link.text)}</a>`
                ).join('')}
            </nav>
            <div class="copyright" style="font-size:12px; color:#aaa; text-align:right; margin-left:18px; flex-shrink:0;">${wrapTextInGlowSpans(footerConfig.copyright)}</div>
        `;
        // Add mouse move handler for glow effect (desktop only)
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
    }
    return footerDiv;
}
