<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
 xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

<xsl:template match="/">
<html>
<head>
<title>Doppelganger Sitemap</title>
<style>
body { font-family: Arial; background:#f8fafc; }
table { border-collapse: collapse; width: 100%; }
th, td { border:1px solid #ccc; padding:10px; text-align:left; }
th { background:#2563eb; color:#fff; }
</style>
</head>
<body>
<h2>Doppelganger.world Sitemap</h2>
<table>
<tr>
<th>URL</th>
<th>Last Modified</th>
</tr>
<xsl:for-each select="urlset/url">
<tr>
<td><xsl:value-of select="loc"/></td>
<td><xsl:value-of select="lastmod"/></td>
</tr>
</xsl:for-each>
</table>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
