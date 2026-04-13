(function () {
    window.SignatureDesigns = window.SignatureDesigns || {};

    window.SignatureDesigns.avanzado = function (ctx) {
        const { safe, standardHeight, standardTextHtml, designer } = ctx;
        const order = Array.isArray(designer.layoutOrder) ? designer.layoutOrder : ['logo_izq', 'texto', 'logo_der'];
        const normalized = ['logo_izq', 'texto', 'logo_der'].filter((k) => order.includes(k));

        const cellHtml = {
            logo_izq: `<td style="vertical-align:top; padding-right:6px;">
      ${safe.logo_izq ? `<img data-role="sync-logo" data-maxw="165" src="${safe.logo_izq}" alt="Logo izquierdo" style="display:block; width:165px; max-width:165px; height:${standardHeight}px; object-fit:contain; object-position:center center; border:0;">` : `<div data-role="sync-logo-placeholder" style="width:165px; height:${standardHeight}px;"></div>`}
    </td>`,
            texto: `<td data-role="sync-text-block" style="vertical-align:top; padding:0 8px;">
      <div data-role="sync-text-inner">${standardTextHtml}</div>
    </td>`,
            logo_der: `<td style="vertical-align:top; padding-left:6px;">
      ${safe.logo_der ? `<img data-role="sync-logo" data-maxw="150" src="${safe.logo_der}" alt="Logo derecho" style="display:block; width:150px; max-width:150px; height:${standardHeight}px; object-fit:contain; object-position:left center; border:0;">` : `<div data-role="sync-logo-placeholder" style="width:150px; height:${standardHeight}px;"></div>`}
    </td>`
        };

        return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Tahoma, Arial, sans-serif; width:auto; table-layout:auto; border-collapse:collapse; white-space:nowrap;">
  <tr>
    ${normalized.map((k) => cellHtml[k]).join('')}
  </tr>
</table>`;
    };
})();

