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
  headerDiv.style.background = 'none';
  headerDiv.style.boxSizing = 'border-box';
  const title = headerConfig.text;
  const glowTitle = wrapTextInGlowSpans(title);
  headerDiv.innerHTML = `<h1>${glowTitle}</h1>`;
  return headerDiv;
}

export function createFooterElement() {
  const footerDiv = document.createElement('div');
  footerDiv.className = 'css3d-element css3d-footer';
  footerDiv.style.background = 'none';
  footerDiv.style.boxSizing = 'border-box';
  footerDiv.innerHTML = `
    <div class="footer-content">
      <div class="footer-brand">
        <h2>${wrapTextInGlowSpans(footerConfig.brand.text)}</h2>
        <p>${wrapTextInGlowSpans(footerConfig.brand.description)}</p>
      </div>
      <nav class="footer-nav">
        ${footerConfig.navigation.links.map(link =>
          `<a href="${link.href}" class="footer-link">${wrapTextInGlowSpans(link.text)}</a>`
        ).join('')}
      </nav>
    </div>
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
