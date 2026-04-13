(function () {
    window.SignatureDesigns = window.SignatureDesigns || {};

    window.SignatureDesigns.minimal = function (ctx) {
        const { safe, standardHeight, standardTextHtml } = ctx;

        return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Tahoma, Arial, sans-serif; width:auto; table-layout:auto; border-collapse:collapse; white-space:nowrap;">
  <tr>
    <td style="vertical-align:top; padding:0 10px; overflow:hidden;">
      <div data-role="sync-text-block" style="overflow:hidden; border-left:6px solid #0d6efd; border-radius:6px; padding-left:10px;">
      <div data-role="sync-text-inner">
      <div style="height:3px; width:100%; background:linear-gradient(90deg,#dc2626 0%,#dc2626 38%,#0d6efd 100%); margin:0 0 8px 0; border-radius:4px;"></div>
      ${standardTextHtml}
      </div>
      </div>
    </td>
    <td style="vertical-align:top; padding-left:0;">
      ${safe.logo_der ? `<img data-role="sync-logo" data-maxw="150" src="${safe.logo_der}" alt="Logo derecho" style="display:block; width:150px; max-width:150px; height:${standardHeight}px; object-fit:contain; object-position:left center; border:0;">` : `<div data-role="sync-logo-placeholder" style="height:${standardHeight}px; width:150px;"></div>`}
    </td>
  </tr>
</table>`;
    };
})();
