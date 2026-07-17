/**
 * Breadcrumb — Doppelganger.world
 * Auto-generates breadcrumb HTML + JSON-LD BreadcrumbList structured data.
 *
 * Usage: add <div id="breadcrumb-container"></div> to page,
 * then call initBreadcrumb([{name:'Home',url:'/'},{name:'FAQ',url:'/faq.html'}])
 */

function initBreadcrumb(items) {
  var container = document.getElementById('breadcrumb-container');
  if (!container || !items || !items.length) return;

  // Build HTML
  var html = '<nav aria-label="Breadcrumb" class="breadcrumb">';
  html += '<ol itemscope itemtype="https://schema.org/BreadcrumbList">';
  items.forEach(function (item, idx) {
    var isLast = idx === items.length - 1;
    html += '<li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">';
    if (!isLast && item.url) {
      html += '<a itemprop="item" href="' + item.url + '"><span itemprop="name">' + item.name + '</span></a>';
    } else {
      html += '<span itemprop="name" aria-current="page">' + item.name + '</span>';
    }
    html += '<meta itemprop="position" content="' + (idx + 1) + '">';
    if (!isLast) html += '<span class="breadcrumb-sep" aria-hidden="true">&rsaquo;</span>';
    html += '</li>';
  });
  html += '</ol></nav>';
  container.innerHTML = html;

  // Inject JSON-LD BreadcrumbList
  var jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items.map(function (item, idx) {
      return {
        '@type': 'ListItem',
        'position': idx + 1,
        'name': item.name,
        'item': item.url ? 'https://www.doppelganger.world' + item.url : undefined
      };
    }).filter(function (i) { return i.item; })
  };

  var script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(jsonLd);
  document.head.appendChild(script);
}
