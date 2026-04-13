(function () {
    window.SignatureDesigns = window.SignatureDesigns || {};

    window.SignatureDesigns.franjas = function (ctx) {
        const {
            safe,
            standardHeight,
            standardTextHtml
        } = ctx;
        const logoHeightCompact = Math.max(95, standardHeight);

        return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Tahoma, Arial, sans-serif; width:auto; table-layout:auto; border-collapse:collapse; white-space:nowrap;">
  <tr>
    <td style="vertical-align:top; padding-right:8px;">
      ${safe.logo_izq ? `<img data-role="sync-logo compact-logo" data-maxw="165" src="${safe.logo_izq}" alt="Logo izquierdo" style="display:block; height:${logoHeightCompact}px; width:auto; max-width:165px; border:0;">` : `<div data-role="sync-logo-placeholder" style="height:${logoHeightCompact}px; width:165px;"></div>`}
    </td>
    <td data-role="compact-center sync-text-block" style="vertical-align:top; height:${logoHeightCompact}px; padding:0 10px; background-image:linear-gradient(to right, #0d6efd 0%, #0d6efd 33.333%, #dc2626 33.333%, #dc2626 100%), linear-gradient(to right, #0d6efd 0%, #0d6efd 33.333%, #dc2626 33.333%, #dc2626 100%); background-size:100% 4px, 100% 4px; background-position:top left, bottom left; background-repeat:no-repeat; overflow:hidden;">
      <div data-role="sync-text-inner" style="padding:8px 0;">${standardTextHtml}</div>
    </td>
    <td style="vertical-align:top; padding-left:0;">
      ${safe.logo_der ? `<img data-role="sync-logo compact-logo" data-maxw="150" src="${safe.logo_der}" alt="Logo derecho" style="display:block; height:${logoHeightCompact}px; width:auto; max-width:150px; object-fit:contain; object-position:left center; border:0;">` : `<div data-role="sync-logo-placeholder" style="height:${logoHeightCompact}px; width:150px;"></div>`}
    </td>
  </tr>
</table>`;
    };
})();
