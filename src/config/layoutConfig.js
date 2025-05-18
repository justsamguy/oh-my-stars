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
    const halfLength = Math.ceil(footerConfig.navigation.links.length / 2);
    const leftLinks = footerConfig.navigation.links.slice(0, halfLength);
    const rightLinks = footerConfig.navigation.links.slice(halfLength);

    if (isMobile) {
        // Mobile: visually match desktop, but stack vertically and use touch-friendly spacing
        footerDiv.style.width = '98vw';
        footerDiv.style.maxWidth = '98vw';
        footerDiv.style.background = 'rgba(0, 20, 40, 0.95)';
        footerDiv.style.borderRadius = '10px';
        footerDiv.style.padding = '16px 4vw 10px 4vw';
        footerDiv.style.boxSizing = 'border-box';
        footerDiv.style.minHeight = '90px';
        footerDiv.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.2)';
        footerDiv.style.borderTop = '1px solid rgba(255,255,255,0.1)';
        footerDiv.style.display = 'flex';
        footerDiv.style.flexDirection = 'column';
        footerDiv.style.alignItems = 'center';
        footerDiv.style.justifyContent = 'center';
        footerDiv.innerHTML = `
            <div class="footer-brand" style="text-align:center; margin-bottom:10px;">
                <h2 style="font-size:18px; margin:0 0 6px 0; color:#fff; font-weight:600;">${wrapTextInGlowSpans(footerConfig.brand.text)}</h2>
                <p style="font-size:12px; line-height:1.4; color:#aaa; margin:0;">${wrapTextInGlowSpans(footerConfig.brand.description)}</p>
            </div>
            <div style="width:100%; display:flex; flex-direction:column; align-items:center; gap:8px; margin-bottom:10px;">
                <nav class="footer-nav" style="width:100%; display:flex; flex-direction:column; align-items:center; gap:8px;">
                    ${footerConfig.navigation.links.map(link =>
                        `<a href="${link.href}" class="footer-link" style="font-size:16px; color:#ccc; text-decoration:none; padding:8px 0; border-radius:6px; width:100%; text-align:center; background:rgba(255,255,255,0.03);">${wrapTextInGlowSpans(link.text)}</a>`
                    ).join('')}
                </nav>
            </div>
            <div class="copyright" style="font-size:12px; color:#aaa; text-align:center; margin-top:6px; padding-top:6px; border-top:1px solid rgba(255,255,255,0.1); width:100%;">${wrapTextInGlowSpans(footerConfig.copyright)}</div>
        `;
    } else {
        footerDiv.style.width = '400px';
        footerDiv.style.fontSize = '1.5px';
        footerDiv.style.background = 'rgba(0,0,0,0.5)';
        footerDiv.style.padding = '6px 15px';
        footerDiv.style.boxSizing = 'border-box';
        footerDiv.style.height = '42px';
        footerDiv.innerHTML = `
            <div class="footer-content" style="margin-bottom:2px; display:flex; flex-direction:row; align-items:center; gap:12px; width:100%;">
                <div class="footer-brand" style="order:1; text-align:left; display:block;">
                    <h2 style="font-size:16px; margin:0 0 3px 0; color:#afafaf; font-weight:normal">${wrapTextInGlowSpans(footerConfig.brand.text)}</h2>
                    <p style="font-size:12px; line-height:1.2; color:#aaa; margin:0">${wrapTextInGlowSpans(footerConfig.brand.description)}</p>
                </div>
                <div style="display:flex; gap:12px; flex-direction:row; align-items:center; justify-content:center; width:100%;">
                    <nav class="footer-nav" style="width:auto; gap:2px; display:flex; flex-direction:column; align-items:center;">
                        ${leftLinks.map(link =>
                            `<a href="${link.href}" class="footer-link" style="font-size:13px; display:inline-block; padding:6px 0;">${wrapTextInGlowSpans(link.text)}</a>`
                        ).join('')}
                    </nav>
                    <nav class="footer-nav" style="width:auto; gap:2px; display:flex; flex-direction:column; align-items:center;">
                        ${rightLinks.map(link =>
                            `<a href="${link.href}" class="footer-link" style="font-size:13px; display:inline-block; padding:6px 0;">${wrapTextInGlowSpans(link.text)}</a>`
                        ).join('')}
                    </nav>
                </div>
            </div>
            <div class="copyright" style="font-size:10px; color:#aaa; text-align:center; margin-top:2px; padding-top:2px; border-top:0.5px solid rgba(255,255,255,0.1)">${wrapTextInGlowSpans(footerConfig.copyright)}</div>
        `;
    } else {
        footerDiv.style.width = '400px';
        footerDiv.style.fontSize = '1.5px';
        footerDiv.style.background = 'rgba(0,0,0,0.5)';
        footerDiv.style.padding = '6px 15px';
        footerDiv.style.boxSizing = 'border-box';
        footerDiv.style.height = '42px';
        footerDiv.innerHTML = `
            <div class="footer-content" style="margin-bottom:2px; display:flex; flex-direction:row; align-items:center; gap:12px; width:100%;">
                <div class="footer-brand" style="order:1; text-align:left; display:block;">
                    <h2 style="font-size:16px; margin:0 0 3px 0; color:#afafaf; font-weight:normal">${wrapTextInGlowSpans(footerConfig.brand.text)}</h2>
                    <p style="font-size:12px; line-height:1.2; color:#aaa; margin:0">${wrapTextInGlowSpans(footerConfig.brand.description)}</p>
                </div>
                <div style="display:flex; gap:12px; flex-direction:row; align-items:center; justify-content:center; width:100%;">
                    <nav class="footer-nav" style="width:auto; gap:2px; display:flex; flex-direction:column; align-items:center;">
                        ${leftLinks.map(link =>
                            `<a href="${link.href}" class="footer-link" style="font-size:13px; display:inline-block; padding:6px 0;">${wrapTextInGlowSpans(link.text)}</a>`
                        ).join('')}
                    </nav>
                    <nav class="footer-nav" style="width:auto; gap:2px; display:flex; flex-direction:column; align-items:center;">
                        ${rightLinks.map(link =>
                            `<a href="${link.href}" class="footer-link" style="font-size:13px; display:inline-block; padding:6px 0;">${wrapTextInGlowSpans(link.text)}</a>`
                        ).join('')}
                    </nav>
                </div>
            </div>
            <div class="copyright" style="font-size:10px; color:#aaa; text-align:center; margin-top:2px; padding-top:2px; border-top:0.5px solid rgba(255,255,255,0.1)">${wrapTextInGlowSpans(footerConfig.copyright)}</div>
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
    }

    return footerDiv;
}
