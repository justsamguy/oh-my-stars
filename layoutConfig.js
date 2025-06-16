export const headerConfig = {
    text: 'Oh My Stars'
};

export const footerConfig = {
    brand: {
        text: 'Oh My Stars',
        description: 'An interactive journey through my projects. Explore the variety of creative works and contributions that make up my digital universe.'
    },
    navigation: {
        links: [
            { text: 'S&A', href: '#' },
            { text: 'JustSamGuy', href: 'https://justsamguy.myportfolio.com' },
            { text: 'About', href: '#about' },
            { text: 'Updates', href: 'https://github.com/justsamguy/oh-my-stars/commits/main/' },
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
    // Remove fixed width and fontSize; let CSS handle it
    headerDiv.style.background = 'none';
    headerDiv.style.color = '#afafaf';
    headerDiv.innerHTML = `<h1>${wrapTextInGlowSpans(headerConfig.text)}</h1>`;
    return headerDiv;
}

export function createFooterElement() {
    const footerDiv = document.createElement('div');
    footerDiv.className = 'css3d-element css3d-footer';
    footerDiv.style.background = 'rgba(0,0,0,0.5)';
    footerDiv.style.padding = '6px 15px';
    footerDiv.style.boxSizing = 'border-box';

    // Mobile detection
    const isMobile = window.matchMedia && window.matchMedia('(max-width: 600px)').matches;
    let navHTML = '';
    if (isMobile) {
        navHTML = `
            <nav class="footer-nav">
                ${footerConfig.navigation.links.map(link =>
                    `<a href="${link.href}" class="footer-link">${wrapTextInGlowSpans(link.text)}</a>`
                ).join('')}
            </nav>
        `;
    } else {
        const halfLength = Math.ceil(footerConfig.navigation.links.length / 2);
        const leftLinks = footerConfig.navigation.links.slice(0, halfLength);
        const rightLinks = footerConfig.navigation.links.slice(halfLength);
        navHTML = `
            <div style="display: flex; gap: 12px">
                <nav class="footer-nav">
                    ${leftLinks.map(link =>
                        `<a href="${link.href}" class="footer-link">${wrapTextInGlowSpans(link.text)}</a>`
                    ).join('')}
                </nav>
                <nav class="footer-nav">
                    ${rightLinks.map(link =>
                        `<a href="${link.href}" class="footer-link">${wrapTextInGlowSpans(link.text)}</a>`
                    ).join('')}
                </nav>
            </div>
        `;
    }

    footerDiv.innerHTML = `
        <div class="footer-content">
            <div class="footer-brand">
                <h2 style="font-size: 6px; margin: 0 0 3px 0; color: #afafaf; font-weight: normal">${wrapTextInGlowSpans(footerConfig.brand.text)}</h2>
                <p style="font-size: 4px; line-height: 1.2; color: #aaa; margin: 0">${wrapTextInGlowSpans(footerConfig.brand.description)}</p>
            </div>
            ${navHTML}
        </div>
        <div class="copyright" style="font-size: 2.75px; color: #aaa; text-align: center; margin-top: 2px; padding-top: 2px; border-top: 0.5px solid rgba(255,255,255,0.1)">${wrapTextInGlowSpans(footerConfig.copyright)}</div>
    `;

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
