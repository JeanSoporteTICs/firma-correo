(function () {
    window.SignatureDesigns = window.SignatureDesigns || {};

    window.SignatureDesigns.institucional = function (ctx) {
        const { safe, standardHeight, standardTextHtml } = ctx;
        const logoHeight = standardHeight;
        return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Tahoma, Arial, sans-serif; width:auto; table-layout:auto; border-collapse:collapse; white-space:nowrap;">
  <tr>
    <td style="vertical-align:top; padding-right:4px;">
      ${safe.logo_izq ? `<img data-role="sync-logo" data-maxw="165" src="${safe.logo_izq}" alt="Logo izquierdo" style="display:block; width:165px; max-width:165px; height:${logoHeight}px; object-fit:contain; object-position:center center; border:0;">` : `<div data-role="sync-logo-placeholder" style="width:165px; height:${logoHeight}px;"></div>`}
    </td>
    <td data-role="sync-text-block" style="vertical-align:top; padding:0 6px 0 2px;">
      <div data-role="sync-text-inner">${standardTextHtml}</div>
    </td>
    <td style="vertical-align:top; padding-left:0;">
      ${safe.logo_der ? `<img data-role="sync-logo" data-maxw="150" src="${safe.logo_der}" alt="Logo derecho" style="display:block; width:150px; max-width:150px; height:${logoHeight}px; object-fit:contain; object-position:left center; border:0;">` : `<div data-role="sync-logo-placeholder" style="width:150px; height:${logoHeight}px;"></div>`}
    </td>
  </tr>
</table>`;
    };
})();

