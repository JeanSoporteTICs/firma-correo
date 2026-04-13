(function () {
    window.SignatureDesigns = window.SignatureDesigns || {};

    window.SignatureDesigns.lineal = function (ctx) {
        const { safe, scale, withScale, standardHeight, standardTextHtml } = ctx;
        return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Tahoma, Arial, sans-serif; width:auto; table-layout:auto; border-collapse:collapse; white-space:nowrap;">
  <tr>
    <td style="vertical-align:top; padding-right:8px;">
      ${safe.logo_izq ? `<img data-role="sync-logo" data-logo-pad="12" class="lineal-logo-anim" src="${safe.logo_izq}" alt="Logo izquierdo" style="display:block; height:${standardHeight}px; width:auto; border:0;">` : `<div data-role="sync-logo-placeholder" style="height:${standardHeight}px; width:165px;"></div>`}
    </td>
    <td data-role="sync-text-block" style="vertical-align:top; padding:0 10px;">
      <div data-role="sync-text-inner" style="padding:6px 0;">
        <div class="anim-strip" style="height:3px; margin:0 0 6px 0; border-radius:3px; background:linear-gradient(90deg,#dc2626 0%,#dc2626 35%,#0d6efd 65%,#0d6efd 100%); background-size:220% 100%; background-position:var(--gif-shift,var(--live-shift,0%)) 0;"></div>
        <div class="lineal-copy-anim">${standardTextHtml}</div>
        <div class="anim-strip" style="height:3px; margin:6px 0 0 0; border-radius:3px; background:linear-gradient(90deg,#0d6efd 0%,#0d6efd 35%,#dc2626 65%,#dc2626 100%); background-size:220% 100%; background-position:var(--gif-shift,var(--live-shift,0%)) 0;"></div>
      </div>
    </td>
    <td style="vertical-align:top; padding-left:0;">
      ${safe.logo_der ? `<img data-role="sync-logo" data-logo-pad="12" class="lineal-logo-anim lineal-logo-right-anim" src="${safe.logo_der}" alt="Logo derecho" style="display:block; height:${standardHeight}px; width:auto; object-fit:contain; object-position:left center; border:0;">` : `<div data-role="sync-logo-placeholder" style="height:${standardHeight}px; width:150px;"></div>`}
    </td>
  </tr>
</table>`;
    };
})();
