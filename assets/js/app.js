(function () {
    const cfg = window.APP_CONFIG || {};
    const copyBtn = document.getElementById('copyBtn');
    const downloadGifBtn = document.getElementById('downloadGifBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    const signaturePreview = document.getElementById('signaturePreview');
    const form = document.getElementById('signatureForm');
    const designCarouselElement = document.getElementById('designCarousel');
    const designPrevBtn = document.getElementById('designPrevBtn');
    const designNextBtn = document.getElementById('designNextBtn');
    const thumbInstitucional = document.getElementById('thumbInstitucional');
    const thumbFranjas = document.getElementById('thumbFranjas');
    const thumbMinimal = document.getElementById('thumbMinimal');
    const thumbLineal = document.getElementById('thumbLineal');
    const GIF_DESIGN = 'lineal';
    let previewAnimFrameId = 0;

    const logos = cfg.logos || { izq: '', centro: '', der: '' };
    const defaults = cfg.defaults || {};

    const fields = {
        diseno: document.getElementById('diseno'),
        preset: document.getElementById('preset'),
        nombre: document.getElementById('nombre'),
        cargo: document.getElementById('cargo'),
        subdepto: document.getElementById('subdepto'),
        depto: document.getElementById('depto'),
        institucion: document.getElementById('institucion'),
        anexo: document.getElementById('anexo'),
        fono: document.getElementById('fono'),
        email: document.getElementById('email')
    };

    function escapeHtml(value) {
        return value
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function normalizeUrl(url) {
        if (!url) return '';
        if (/^(https?:)?\/\//i.test(url) || /^data:image\//i.test(url)) return url;
        return url;
    }

    function withScale(v, scale) {
        return `${Math.round(v * scale * 100) / 100}px`;
    }

    function getScale() {
        const preset = fields.preset?.value || 'normal';
        if (preset === 'compacto') return 0.92;
        if (preset === 'grande') return 1.12;
        return 1;
    }

    function buildData() {
        return {
            nombre: fields.nombre.value.trim(),
            cargo: fields.cargo.value.trim(),
            subdepto: fields.subdepto.value.trim(),
            depto: fields.depto.value.trim(),
            institucion: fields.institucion.value.trim(),
            anexo: fields.anexo.value.trim(),
            fono: fields.fono.value.trim(),
            email: fields.email.value.trim()
        };
    }

    function textColumnHtml(safe, lineasCargo, contacto, scale) {
        return `${safe.nombre ? `<div style="font-size:${withScale(22, scale)}; line-height:1.2; font-weight:700; color:#111827; margin-bottom:${withScale(6, scale)}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${safe.nombre}</div>` : ''}
      ${lineasCargo}
      ${safe.institucion ? `<div style="font-size:${withScale(20, scale)}; line-height:1.2; font-weight:700; color:#dc2626; margin:${withScale(8, scale)} 0 ${withScale(6, scale)}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${safe.institucion}</div>` : ''}
      ${contacto}`;
    }

    function textColumnHtmlCompact(safe, lineasCargo, contacto, scale) {
        return `${safe.nombre ? `<div style="font-size:${withScale(22, scale)}; line-height:1.2; font-weight:700; color:#111827; margin-bottom:${withScale(6, scale)};">${safe.nombre}</div>` : ''}
      ${lineasCargo}
      ${safe.institucion ? `<div style="font-size:${withScale(20, scale)}; line-height:1.2; font-weight:700; color:#dc2626; margin:${withScale(8, scale)} 0 ${withScale(6, scale)}; text-transform:uppercase;">${safe.institucion}</div>` : ''}
      ${contacto}`;
    }

    function compactBlockHtml(textCompact) {
        return `<div data-role="sync-text-inner" style="padding:8px 0;">${textCompact}</div>`;
    }

    function measureTextHeight(html) {
        const probe = document.createElement('div');
        probe.style.position = 'absolute';
        probe.style.visibility = 'hidden';
        probe.style.left = '-9999px';
        probe.style.top = '0';
        probe.style.width = '340px';
        probe.style.padding = '0 10px 0 8px';
        probe.style.fontFamily = 'Tahoma, Arial, sans-serif';
        probe.innerHTML = html;
        document.body.appendChild(probe);
        const height = Math.ceil(probe.getBoundingClientRect().height);
        document.body.removeChild(probe);
        return height;
    }

    function buildSignature(data, diseno) {
        const scale = getScale();
        const hasAnyData = Object.values(data).some((v) => v !== '');
        if (!hasAnyData) return '';

        const safe = {
            nombre: escapeHtml(data.nombre),
            cargo: escapeHtml(data.cargo),
            subdepto: escapeHtml(data.subdepto),
            depto: escapeHtml(data.depto),
            institucion: escapeHtml(data.institucion),
            anexo: escapeHtml(data.anexo),
            fono: escapeHtml(data.fono),
            email: escapeHtml(data.email),
            logo_izq: normalizeUrl(logos.izq),
            logo_centro: normalizeUrl(logos.centro),
            logo_der: normalizeUrl(logos.der)
        };

        const lineasCargo = [safe.cargo, safe.subdepto, safe.depto]
            .filter(Boolean)
            .map((linea) => `<div style="font-size:${withScale(14, scale)}; line-height:1.28; color:#111827; font-weight:500; margin-bottom:${withScale(2, scale)}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${linea}</div>`)
            .join('');
        const contacto = [
            safe.anexo ? `<div style="font-size:${withScale(14, scale)}; line-height:1.28; color:#111827; font-weight:500; margin-bottom:${withScale(2, scale)}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Anexo: ${safe.anexo}</div>` : '',
            safe.fono ? `<div style="font-size:${withScale(14, scale)}; line-height:1.28; color:#111827; font-weight:500; margin-bottom:${withScale(2, scale)}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Fono: ${safe.fono}</div>` : '',
            safe.email ? `<div style="font-size:${withScale(14, scale)}; line-height:1.28; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><a href="mailto:${safe.email}" style="color:#111827; text-decoration:none;">${safe.email}</a></div>` : ''
        ].join('');

        const standardTextHtml = textColumnHtml(safe, lineasCargo, contacto, scale);
        const standardHeight = measureTextHeight(standardTextHtml);

        if (diseno === 'franjas') {
            const lineasCargoCompact = [safe.cargo, safe.subdepto, safe.depto]
                .filter(Boolean)
                .map((linea) => `<div style="font-size:${withScale(14, scale)}; line-height:1.28; color:#111827; font-weight:500; margin-bottom:${withScale(2, scale)};">${linea}</div>`)
                .join('');
            const contactoCompact = [
                safe.anexo ? `<div style="font-size:${withScale(13, scale)}; line-height:1.28; color:#111827; font-weight:500; margin-bottom:${withScale(2, scale)};">Anexo: ${safe.anexo}</div>` : '',
                safe.fono ? `<div style="font-size:${withScale(13, scale)}; line-height:1.28; color:#111827; font-weight:500; margin-bottom:${withScale(2, scale)};">Fono: ${safe.fono}</div>` : '',
                safe.email ? `<div style="font-size:${withScale(13, scale)}; line-height:1.28; font-weight:500;"><a href="mailto:${safe.email}" style="color:#111827; text-decoration:none;">${safe.email}</a></div>` : ''
            ].join('');
            const textCompact = textColumnHtmlCompact(safe, lineasCargoCompact, contactoCompact, scale);
            const blockCompact = compactBlockHtml(textCompact);
            const logoHeightCompact = Math.max(95, standardHeight);

            return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Tahoma, Arial, sans-serif; width:auto; table-layout:auto; border-collapse:collapse; white-space:nowrap;">
  <tr>
    <td style="vertical-align:top; padding-right:8px;">
      ${safe.logo_izq ? `<img data-role="sync-logo compact-logo" data-maxw="165" src="${safe.logo_izq}" alt="Logo izquierdo" style="display:block; height:${logoHeightCompact}px; width:auto; max-width:165px; border:0;">` : `<div data-role="sync-logo-placeholder" style="height:${logoHeightCompact}px; width:165px;"></div>`}
    </td>
    <td data-role="compact-center sync-text-block" style="vertical-align:top; height:${logoHeightCompact}px; padding:0 10px; background-image:linear-gradient(to right, #0d6efd 0%, #0d6efd 33.333%, #dc2626 33.333%, #dc2626 100%), linear-gradient(to right, #0d6efd 0%, #0d6efd 33.333%, #dc2626 33.333%, #dc2626 100%); background-size:100% 4px, 100% 4px; background-position:top left, bottom left; background-repeat:no-repeat; overflow:hidden;">
      ${blockCompact}
    </td>
    <td style="vertical-align:top; padding-left:0;">
      ${safe.logo_der ? `<img data-role="sync-logo compact-logo" data-maxw="150" src="${safe.logo_der}" alt="Logo derecho" style="display:block; height:${logoHeightCompact}px; width:auto; max-width:150px; object-fit:contain; object-position:left center; border:0;">` : `<div data-role="sync-logo-placeholder" style="height:${logoHeightCompact}px; width:150px;"></div>`}
    </td>
  </tr>
</table>`;
        }

        if (diseno === 'minimal') {
            const minimalLines = [
                safe.cargo ? `<div style="font-size:${withScale(15, scale)}; line-height:1.28; color:#0f172a; font-weight:600; margin-bottom:${withScale(2, scale)};">${safe.cargo}</div>` : '',
                safe.subdepto ? `<div style="font-size:${withScale(13, scale)}; line-height:1.28; color:#334155; font-weight:500; margin-bottom:${withScale(2, scale)};">${safe.subdepto}</div>` : '',
                safe.depto ? `<div style="font-size:${withScale(13, scale)}; line-height:1.28; color:#334155; font-weight:500;">${safe.depto}</div>` : ''
            ].join('');
            const minimalMeta = [
                safe.anexo ? `<span style="display:inline-block; font-size:${withScale(12, scale)}; color:#334155; font-weight:500; margin-right:${withScale(10, scale)};">Anexo: ${safe.anexo}</span>` : '',
                safe.fono ? `<span style="display:inline-block; font-size:${withScale(12, scale)}; color:#334155; font-weight:500;">Fono: ${safe.fono}</span>` : ''
            ].join('');
            const minimalMail = safe.email
                ? `<div style="font-size:${withScale(12, scale)}; line-height:1.28; font-weight:500; margin-top:${withScale(6, scale)};"><a href="mailto:${safe.email}" style="color:#0f172a; text-decoration:none;">${safe.email}</a></div>`
                : '';
            return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Tahoma, Arial, sans-serif; width:auto; table-layout:auto; border-collapse:collapse; white-space:nowrap;">
  <tr>
    <td style="vertical-align:top; padding:0 10px; overflow:hidden;">
      <div data-role="sync-text-block" style="overflow:hidden; border-left:6px solid #0d6efd; border-radius:6px; padding-left:10px;">
      <div data-role="sync-text-inner">
      <div style="height:3px; width:100%; background:linear-gradient(90deg,#dc2626 0%,#dc2626 38%,#0d6efd 100%); margin:0 0 8px 0; border-radius:4px;"></div>
      ${safe.nombre ? `<div style="font-size:${withScale(27, scale)}; line-height:1.2; font-weight:700; color:#0f172a; margin-bottom:${withScale(6, scale)};">${safe.nombre}</div>` : ''}
      ${minimalLines}
      ${safe.institucion ? `<div style="font-size:${withScale(13, scale)}; line-height:1.28; color:#dc2626; font-weight:700; margin-top:${withScale(8, scale)};">${safe.institucion}</div>` : ''}
      ${minimalMeta ? `<div style="margin-top:${withScale(6, scale)};">${minimalMeta}</div>` : ''}
      ${minimalMail}
      </div>
      </div>
    </td>
    <td style="vertical-align:top; padding-left:0;">
      ${safe.logo_der ? `<img data-role="sync-logo" data-maxw="150" src="${safe.logo_der}" alt="Logo derecho" style="display:block; width:150px; max-width:150px; height:${standardHeight}px; object-fit:contain; object-position:left center; border:0;">` : `<div data-role="sync-logo-placeholder" style="height:${standardHeight}px; width:150px;"></div>`}
    </td>
  </tr>
</table>`;
        }

        if (diseno === 'lineal') {
            return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Tahoma, Arial, sans-serif; width:auto; table-layout:auto; border-collapse:collapse; white-space:nowrap;">
  <tr>
    <td style="vertical-align:top; padding-right:8px;">
      ${safe.logo_izq ? `<img data-role="sync-logo" data-logo-pad="12" class="lineal-logo-anim" src="${safe.logo_izq}" alt="Logo izquierdo" style="display:block; height:${standardHeight}px; width:auto; border:0;">` : `<div data-role="sync-logo-placeholder" style="height:${standardHeight}px; width:165px;"></div>`}
    </td>
    <td data-role="sync-text-block" style="vertical-align:top; padding:0 10px;">
      <div data-role="sync-text-inner" style="padding:6px 0;">
        <div class="anim-strip" style="height:3px; margin:0 0 6px 0; border-radius:3px; background:linear-gradient(90deg,#dc2626 0%,#dc2626 35%,#0d6efd 65%,#0d6efd 100%); background-size:220% 100%; background-position:var(--gif-shift,var(--live-shift,0%)) 0;"></div>
        ${safe.nombre ? `<div class="lineal-name-anim" style="font-size:${withScale(23, scale)}; line-height:1.2; font-weight:700; color:#111827; margin-bottom:${withScale(6, scale)}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${safe.nombre}</div>` : ''}
        <div class="lineal-copy-anim">${lineasCargo}</div>
        ${safe.institucion ? `<div class="lineal-inst-anim" style="font-size:${withScale(20, scale)}; line-height:1.2; font-weight:700; color:#dc2626; margin:${withScale(8, scale)} 0 ${withScale(6, scale)}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${safe.institucion}</div>` : ''}
        <div class="lineal-copy-anim">${contacto}</div>
        <div class="anim-strip" style="height:3px; margin:6px 0 0 0; border-radius:3px; background:linear-gradient(90deg,#0d6efd 0%,#0d6efd 35%,#dc2626 65%,#dc2626 100%); background-size:220% 100%; background-position:var(--gif-shift,var(--live-shift,0%)) 0;"></div>
      </div>
    </td>
    <td style="vertical-align:top; padding-left:0;">
      ${safe.logo_der ? `<img data-role="sync-logo" data-logo-pad="12" class="lineal-logo-anim lineal-logo-right-anim" src="${safe.logo_der}" alt="Logo derecho" style="display:block; height:${standardHeight}px; width:auto; object-fit:contain; object-position:left center; border:0;">` : `<div data-role="sync-logo-placeholder" style="height:${standardHeight}px; width:150px;"></div>`}
    </td>
  </tr>
</table>`;
        }

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
    }

    function syncLogoHeights(root) {
        const textInner = root.querySelector('[data-role~="sync-text-inner"]');
        const textBlock = root.querySelector('[data-role~="sync-text-block"]') || root.querySelector('[data-role~="compact-center"]');
        const row = root.querySelector('table tr');
        const source = textInner || textBlock;
        if (!source) return;
        const sourceHeight = Math.ceil(Math.max(source.scrollHeight || 0, source.getBoundingClientRect().height));
        if (!sourceHeight) return;

        const applyHeight = (h) => {
            root.querySelectorAll('[data-role~="sync-text-block"], [data-role~="compact-center"]').forEach((block) => {
                block.style.height = `${h}px`;
                block.style.minHeight = `${h}px`;
            });

            root.querySelectorAll('img[data-role~="sync-logo"], img[data-role="sync-logo"], img[data-role="compact-logo"]').forEach((img) => {
                const pad = parseInt(img.getAttribute('data-logo-pad') || '0', 10);
                const imageHeight = Math.max(20, h - (Number.isNaN(pad) ? 0 : pad));
                img.style.height = `${imageHeight}px`;
                img.style.width = 'auto';
                img.style.maxWidth = 'none';
            });
            root.querySelectorAll('[data-role="sync-logo-placeholder"]').forEach((block) => {
                block.style.height = `${h}px`;
            });
        };

        applyHeight(sourceHeight);

        const rowHeight = row ? Math.ceil(row.getBoundingClientRect().height) : sourceHeight;
        const finalHeight = Math.max(sourceHeight, rowHeight);
        applyHeight(finalHeight);
    }

    function syncLogoHeightsDeferred(root) {
        syncLogoHeights(root);
        requestAnimationFrame(() => syncLogoHeights(root));
        setTimeout(() => syncLogoHeights(root), 70);
    }

    function renderThumb(container, html) {
        if (!html) {
            container.innerHTML = '<div style="padding:10px; font-size:12px; color:#64748b;">Sin datos</div>';
            return;
        }
        container.innerHTML = html;
        syncLogoHeightsDeferred(container);
    }

    function renderCarouselPreviews(data) {
        renderThumb(thumbInstitucional, buildSignature(data, 'institucional'));
        renderThumb(thumbFranjas, buildSignature(data, 'franjas'));
        renderThumb(thumbMinimal, buildSignature(data, 'minimal'));
        renderThumb(thumbLineal, buildSignature(data, 'lineal'));
    }

    function updateActiveSlideVisual(design) {
        designCarouselElement.querySelectorAll('.design-slide').forEach((card) => {
            card.classList.toggle('active', card.getAttribute('data-design-click') === design);
        });
        designCarouselElement.querySelectorAll('.design-item').forEach((item) => {
            item.classList.toggle('active', item.getAttribute('data-design') === design);
        });
    }

    function updateGifButtonVisibility(diseno, hasSignature) {
        if (!downloadGifBtn) return;
        const show = hasSignature && diseno === GIF_DESIGN;
        downloadGifBtn.classList.toggle('d-none', !show);
        downloadGifBtn.disabled = !show;
    }

    function updateExportButtonsByDesign(diseno, hasSignature) {
        const isGifDesign = diseno === GIF_DESIGN;
        copyBtn.classList.toggle('d-none', isGifDesign);
        downloadBtn.classList.toggle('d-none', isGifDesign);
        copyBtn.disabled = !hasSignature || isGifDesign;
        downloadBtn.disabled = !hasSignature || isGifDesign;
        updateGifButtonVisibility(diseno, hasSignature);
    }

    function stopLinealPreviewAnimation() {
        if (previewAnimFrameId) {
            cancelAnimationFrame(previewAnimFrameId);
            previewAnimFrameId = 0;
        }
        const table = signaturePreview.querySelector('table');
        if (!table) return;
        table.style.removeProperty('--live-shift');
        table.style.removeProperty('--live-bob');
        table.style.removeProperty('--live-bob-x');
    }

    function startLinealPreviewAnimation() {
        stopLinealPreviewAnimation();
        if (fields.diseno.value !== GIF_DESIGN) return;
        const table = signaturePreview.querySelector('table');
        if (!table) return;
        const t0 = performance.now();
        const tick = (now) => {
            const p = ((now - t0) / 1800) % 1;
            const a = p * Math.PI * 2;
            table.style.setProperty('--live-shift', `${p * 100}%`);
            table.style.setProperty('--live-bob', `${((Math.sin(a) + 1) / 2) * 3}px`);
            table.style.setProperty('--live-bob-x', `${((Math.cos(a) + 1) / 2) * 1.2}px`);
            previewAnimFrameId = requestAnimationFrame(tick);
        };
        previewAnimFrameId = requestAnimationFrame(tick);
    }

    function validateField(input, maxLen, validator, message) {
        const err = document.getElementById(`${input.id}Error`);
        const value = input.value.trim();
        let text = '';
        if (value.length > maxLen) text = `Máximo ${maxLen} caracteres.`;
        if (!text && validator && value && !validator(value)) text = message;
        input.classList.toggle('is-invalid', text !== '');
        if (err) err.textContent = text;
        return text === '';
    }

    function validateForm() {
        const checks = [
            validateField(fields.nombre, 60, null, ''),
            validateField(fields.cargo, 50, null, ''),
            validateField(fields.subdepto, 50, null, ''),
            validateField(fields.depto, 50, null, ''),
            validateField(fields.institucion, 55, null, ''),
            validateField(fields.anexo, 30, null, ''),
            validateField(fields.fono, 30, null, ''),
            validateField(fields.email, 80, (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Email inválido.')
        ];
        return checks.every(Boolean);
    }

    function renderSignature(options = {}) {
        const updateThumbs = options.updateThumbs !== false;
        validateForm();
        const data = buildData();
        const diseno = fields.diseno.value;
        const html = buildSignature(data, diseno);

        if (!html) {
            signaturePreview.innerHTML = '<p class="text-muted mb-0">Tu firma aparecerá aquí cuando completes el formulario.</p>';
            if (updateThumbs) renderCarouselPreviews(data);
            updateExportButtonsByDesign(diseno, false);
            stopLinealPreviewAnimation();
            return;
        }

        signaturePreview.innerHTML = html;
        syncLogoHeightsDeferred(signaturePreview);
        if (updateThumbs) renderCarouselPreviews(data);
        updateActiveSlideVisual(diseno);
        updateExportButtonsByDesign(diseno, true);
        if (diseno === GIF_DESIGN) startLinealPreviewAnimation();
        else stopLinealPreviewAnimation();
    }

    async function elementToPngBlob(element) {
        if (typeof html2canvas !== 'function') throw new Error('html2canvas no disponible');
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2,
            useCORS: true,
            allowTaint: true
        });
        return await new Promise((resolve, reject) => {
            canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo generar PNG.')), 'image/png');
        });
    }

    async function elementToGifBlob(element) {
        if (typeof html2canvas !== 'function') throw new Error('html2canvas no disponible');
        if (typeof window.GIF !== 'function') await ensureGifjsLoaded();
        if (typeof window.GIF !== 'function') throw new Error('gif.js no disponible');

        const presets = [
            { scale: 1.8, frames: 16, bob: 3, bobX: 1.2, delayMs: 80, workers: 2, quality: 9 },
            { scale: 1.4, frames: 12, bob: 2.6, bobX: 1, delayMs: 90, workers: 2, quality: 10 },
            { scale: 1, frames: 8, bob: 2.2, bobX: 0.8, delayMs: 100, workers: 1, quality: 11 }
        ];

        let lastError = null;
        element.classList.add('export-gif-mode');
        try {
            for (const preset of presets) {
                try {
                    const frames = [];
                    let gifWidth = 0;
                    let gifHeight = 0;
                    for (let i = 0; i < preset.frames; i += 1) {
                        const angle = (Math.PI * 2 * i) / preset.frames;
                        const shift = (i / preset.frames) * 100;
                        element.style.setProperty('--gif-shift', `${shift}%`);
                        element.style.setProperty('--gif-bob', `${((Math.sin(angle) + 1) / 2) * preset.bob}px`);
                        element.style.setProperty('--gif-bob-x', `${((Math.cos(angle) + 1) / 2) * preset.bobX}px`);
                        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
                        const canvas = await html2canvas(element, {
                            backgroundColor: '#ffffff',
                            scale: preset.scale,
                            useCORS: true,
                            allowTaint: true
                        });
                        if (!gifWidth || !gifHeight) {
                            gifWidth = canvas.width;
                            gifHeight = canvas.height;
                        }
                        frames.push(canvas);
                    }

                    const blob = await new Promise((resolve, reject) => {
                        const workerScript = getGifWorkerUrl();
                        const gif = new window.GIF({
                            workers: preset.workers,
                            quality: preset.quality,
                            workerScript,
                            width: gifWidth,
                            height: gifHeight
                        });
                        frames.forEach((frameCanvas) => {
                            gif.addFrame(frameCanvas, { delay: preset.delayMs, copy: true });
                        });
                        gif.on('finished', (resultBlob) => resolve(resultBlob));
                        gif.on('abort', () => reject(new Error('Se abortó la codificación GIF.')));
                        gif.on('error', (e) => reject(e instanceof Error ? e : new Error(String(e || 'Error GIF'))));
                        gif.render();
                    });
                    return blob;
                } catch (error) {
                    lastError = error;
                }
            }
        } finally {
            element.classList.remove('export-gif-mode');
            element.style.removeProperty('--gif-shift');
            element.style.removeProperty('--gif-bob');
            element.style.removeProperty('--gif-bob-x');
        }
        throw lastError || new Error('No se pudo generar GIF.');
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.async = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`No se pudo cargar: ${src}`));
            document.head.appendChild(script);
        });
    }

    function getGifWorkerUrl() {
        const candidates = [
            'assets/js/gif.worker.proxy.js',
            'https://cdn.jsdelivr.net/npm/gif.js.optimized/dist/gif.worker.js',
            'https://unpkg.com/gif.js.optimized/dist/gif.worker.js'
        ];
        return candidates[0];
    }

    async function ensureGifjsLoaded() {
        if (typeof window.GIF === 'function') return;
        const sources = [
            'https://cdn.jsdelivr.net/npm/gif.js.optimized/dist/gif.js',
            'https://unpkg.com/gif.js.optimized/dist/gif.js'
        ];
        let lastError = null;
        for (const src of sources) {
            try {
                await loadScript(src);
                if (typeof window.GIF === 'function') return;
            } catch (error) {
                lastError = error;
            }
        }
        throw lastError || new Error('gif.js no disponible');
    }

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    function buildDownloadFilename(ext = 'png') {
        const rawName = (fields.nombre?.value || '').trim();
        const base = rawName || 'firma-correo';
        const safe = base
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, '')
            .replace(/\s+/g, '-')
            .replace(/[. ]+$/g, '')
            .slice(0, 80);
        return `${safe || 'firma-correo'}.${ext}`;
    }

    function setCopyButtonState(label, mode) {
        copyBtn.textContent = label;
        copyBtn.classList.remove('btn-success', 'btn-danger');
        if (mode === 'success') copyBtn.classList.add('btn-success');
        if (mode === 'danger') copyBtn.classList.add('btn-danger');
    }

    function applyDesign(design) {
        if (!design) return;
        if (fields.diseno.value === design) {
            updateActiveSlideVisual(design);
            return;
        }
        fields.diseno.value = design;
        renderSignature({ updateThumbs: false });
    }

    function currentDesignIndex() {
        const items = Array.from(designCarouselElement.querySelectorAll('.design-item'));
        const current = fields.diseno.value;
        return items.findIndex((item) => item.getAttribute('data-design') === current);
    }

    function moveDesign(step) {
        const items = Array.from(designCarouselElement.querySelectorAll('.design-item'));
        if (items.length === 0) return;
        const current = currentDesignIndex();
        const safeCurrent = current >= 0 ? current : 0;
        const next = (safeCurrent + step + items.length) % items.length;
        applyDesign(items[next].getAttribute('data-design'));
    }

    function restoreBase() {
        Object.keys(defaults).forEach((key) => {
            if (!fields[key]) return;
            const el = fields[key];
            if (el.type === 'checkbox') {
                el.checked = !!defaults[key];
            } else {
                el.value = defaults[key];
            }
        });
        renderSignature();
    }

    Object.values(fields).forEach((input) => {
        if (!input) return;
        input.addEventListener('input', renderSignature);
        input.addEventListener('change', renderSignature);
    });

    designCarouselElement.querySelectorAll('[data-design-click]').forEach((card) => {
        card.addEventListener('click', () => applyDesign(card.getAttribute('data-design-click')));
    });
    designPrevBtn.addEventListener('click', () => moveDesign(-1));
    designNextBtn.addEventListener('click', () => moveDesign(1));

    form.addEventListener('reset', () => {
        setTimeout(() => restoreBase(), 0);
    });

    if (restoreBtn) restoreBtn.addEventListener('click', restoreBase);

    async function exportPng(mode) {
        const signatureTable = signaturePreview.querySelector('table');
        if (!signatureTable) return;
        const filename = buildDownloadFilename('png');
        const pngBlob = await elementToPngBlob(signatureTable);
        if (mode === 'download') {
            downloadBlob(pngBlob, filename);
            return;
        }
        if (
            window.isSecureContext &&
            navigator.clipboard &&
            typeof ClipboardItem !== 'undefined' &&
            typeof navigator.clipboard.write === 'function'
        ) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob })]);
            return;
        }
        downloadBlob(pngBlob, filename);
    }

    async function exportGif() {
        const signatureTable = signaturePreview.querySelector('table');
        if (!signatureTable) return;
        if (fields.diseno.value !== GIF_DESIGN) throw new Error('GIF disponible solo en diseno animado.');
        stopLinealPreviewAnimation();
        const filename = buildDownloadFilename('gif');
        try {
            const gifBlob = await elementToGifBlob(signatureTable);
            downloadBlob(gifBlob, filename);
        } finally {
            startLinealPreviewAnimation();
        }
    }

    copyBtn.addEventListener('click', async () => {
        try {
            await exportPng('copy');
            setCopyButtonState('PNG copiado', 'success');
            setTimeout(() => setCopyButtonState('Copiar firma PNG', 'default'), 1600);
        } catch (error) {
            setCopyButtonState('Error al generar PNG', 'danger');
            setTimeout(() => setCopyButtonState('Copiar firma PNG', 'default'), 1600);
        }
    });

    downloadBtn.addEventListener('click', async () => {
        try {
            await exportPng('download');
            downloadBtn.textContent = 'PNG descargado';
            setTimeout(() => { downloadBtn.textContent = 'Descargar PNG'; }, 1400);
        } catch (error) {
            downloadBtn.textContent = 'Error al descargar';
            setTimeout(() => { downloadBtn.textContent = 'Descargar PNG'; }, 1400);
        }
    });

    if (downloadGifBtn) {
        downloadGifBtn.addEventListener('click', async () => {
            try {
                await exportGif();
                downloadGifBtn.textContent = 'GIF descargado';
                setTimeout(() => { downloadGifBtn.textContent = 'Descargar GIF'; }, 1400);
            } catch (error) {
                console.error('GIF export error:', error);
                downloadGifBtn.textContent = 'Error GIF';
                setTimeout(() => { downloadGifBtn.textContent = 'Descargar GIF'; }, 1400);
            }
        });
    }

    window.addEventListener('resize', () => syncLogoHeightsDeferred(signaturePreview));

    restoreBase();
})();
