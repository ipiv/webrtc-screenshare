module.exports = (svgPath, color='#ffffff', size='24') => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width',size);
    svg.setAttribute('height',size);
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('fill',color);
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d',svgPath);
    svg.appendChild(path);

    return svg
}