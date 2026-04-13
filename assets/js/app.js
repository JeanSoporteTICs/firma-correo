(function () {
    const cfg = window.APP_CONFIG || {};
    const downloadGifBtn = document.getElementById('downloadGifBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const restoreBtn = document.getElementById('restoreBtn');
    const signaturePreview = document.getElementById('signaturePreview');
    const form = document.getElementById('signatureForm');
    const designCarouselElement = document.getElementById('designCarousel');
    const designPrevBtn = document.getElementById('designPrevBtn');
    const designNextBtn = document.getElementById('designNextBtn');
    const designerView = document.getElementById('designerView');
    const viewButtons = Array.from(document.querySelectorAll('[data-view-btn]'));
    const dataView = document.getElementById('signatureForm');
    const designCarouselStage = designCarouselElement ? designCarouselElement.querySelector('.design-carousel-stage') : null;
    const GIF_DESIGN = 'lineal';
    const BUILTIN_DESIGNS = ['institucional', 'franjas', 'minimal', 'lineal', 'avanzado'];
    const DESIGNER_STORAGE_KEY = 'signature_designer_profiles_v1';
    const CUSTOM_DESIGNS_STORAGE_KEY = 'signature_custom_designs_v1';
    const DESIGNS_API = cfg.designsApi || '';
    let previewAnimFrameId = 0;

    const logos = cfg.logos || { izq: '', centro: '', der: '' };
    const defaults = cfg.defaults || {};
    const designerDefaults = cfg.designerDefaults || {};

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

    const designerFields = {
        color_primary: document.getElementById('designer_color_primary'),
        color_secondary: document.getElementById('designer_color_secondary'),
        color_text: document.getElementById('designer_color_text'),
        color_muted: document.getElementById('designer_color_muted'),
        info_order_1: document.getElementById('designer_info_order_1'),
        info_order_2: document.getElementById('designer_info_order_2'),
        info_order_3: document.getElementById('designer_info_order_3'),
        contact_order_1: document.getElementById('designer_contact_order_1'),
        contact_order_2: document.getElementById('designer_contact_order_2'),
        contact_order_3: document.getElementById('designer_contact_order_3'),
        inst_position: document.getElementById('designer_inst_position'),
        text_order: document.getElementById('designerTextOrder'),
        layout_order: document.getElementById('designerLayoutOrder'),
        new_name: document.getElementById('designerNewName'),
        create: document.getElementById('designerCreateBtn'),
        save: document.getElementById('designerSaveBtn'),
        delete: document.getElementById('designerDeleteBtn'),
        reset: document.getElementById('designerResetBtn')
    };
    const customDataFieldsWrap = document.getElementById('customDataFieldsWrap');
    const customDataFields = document.getElementById('customDataFields');

    const ORDER_GROUPS = {
        info: {
            keys: ['info_order_1', 'info_order_2', 'info_order_3'],
            allowed: ['cargo', 'subdepto', 'depto'],
            fallback: ['cargo', 'subdepto', 'depto']
        },
        contact: {
            keys: ['contact_order_1', 'contact_order_2', 'contact_order_3'],
            allowed: ['anexo', 'fono', 'email'],
            fallback: ['anexo', 'fono', 'email']
        }
    };
    const ORDER_FIELD_KEYS = [
        ...ORDER_GROUPS.info.keys,
        ...ORDER_GROUPS.contact.keys
    ];
    const BASE_FIELD_IDS = ['nombre', 'cargo', 'subdepto', 'depto', 'institucion', 'anexo', 'fono', 'email'];
    const FIELD_LABELS = {
        nombre: 'Nombre',
        cargo: 'Cargo',
        subdepto: 'Sub. Depto.',
        depto: 'Depto.',
        institucion: 'Institución',
        anexo: 'Anexo',
        fono: 'Fono',
        email: 'Email'
    };
    const TEXT_BLOCK_ALLOWED = ['name', 'info', 'institucion', 'contacto'];
    const LAYOUT_ALLOWED = ['logo_izq', 'texto', 'logo_der'];
    const TEXT_BLOCK_LABELS = {
        name: 'Nombre',
        info: 'Cargo/Subdepto/Depto',
        institucion: 'Institución',
        contacto: 'Anexo/Fono/Email'
    };
    const LAYOUT_LABELS = {
        logo_izq: 'Logo izquierdo',
        texto: 'Texto',
        logo_der: 'Logo acreditación'
    };
    let designerProfiles = {};
    let customDesigns = [];
    let designKeys = [...BUILTIN_DESIGNS];
    let sortDragState = { container: null, value: '' };

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

    function uniqueOrder(values, allowed) {
        const out = [];
        values.forEach((v) => {
            if (allowed.includes(v) && !out.includes(v)) out.push(v);
        });
        allowed.forEach((v) => {
            if (!out.includes(v)) out.push(v);
        });
        return out;
    }

    function sanitizeOrderedList(values, allowed, fallback) {
        const base = Array.isArray(fallback) && fallback.length ? fallback : allowed;
        return uniqueOrder(Array.isArray(values) ? values : base, allowed);
    }

    function normalizeOrderGroup(group) {
        const selects = group.keys.map((key) => designerFields[key]).filter(Boolean);
        if (selects.length === 0) return;

        const current = selects.map((el) => el.value);
        const normalized = uniqueOrder(current, group.allowed);
        selects.forEach((el, idx) => { el.value = normalized[idx] || group.fallback[idx]; });
    }

    function normalizeDesignerOrderSelectors() {
        normalizeOrderGroup(ORDER_GROUPS.info);
        normalizeOrderGroup(ORDER_GROUPS.contact);
    }

    function sanitizeCustomField(item, index = 0) {
        if (!item || typeof item !== 'object') return null;
        const rawLabel = String(item.label || '').trim().slice(0, 30);
        const label = /^Personalizado\s+\d+$/i.test(rawLabel) ? '' : rawLabel;
        const text = String(item.text || '').trim().slice(0, 80);
        const rawId = String(item.id || '').trim();
        const normalizedId = rawId.startsWith('custom_')
            ? rawId.replace(/[^a-zA-Z0-9_-]/g, '')
            : `custom_${index + 1}`;
        return { id: normalizedId || `custom_${index + 1}`, label, text };
    }

    function getNextCustomId(customFields) {
        let n = 1;
        const ids = new Set((customFields || []).map((f) => f.id));
        while (ids.has(`custom_${n}`)) n += 1;
        return `custom_${n}`;
    }

    function sanitizeFieldOrder(order, customFields) {
        const customIds = (customFields || []).map((f) => f.id);
        const allowed = [...BASE_FIELD_IDS, ...customIds];
        return sanitizeOrderedList(order, allowed, allowed);
    }

    function fieldLabelById(id) {
        if (FIELD_LABELS[id]) return FIELD_LABELS[id];
        if (id.startsWith('custom_')) return 'Personalizado';
        return id;
    }

    function renderCustomDataInputs() {
        if (!customDataFieldsWrap || !customDataFields) return;
        const key = currentDesignKey();
        const profile = sanitizeDesignerProfile(designerProfiles[key] || createDefaultDesignerProfile());
        const custom = profile.customFields || [];
        if (custom.length === 0) {
            customDataFieldsWrap.classList.add('d-none');
            customDataFields.innerHTML = '';
            return;
        }
        customDataFieldsWrap.classList.remove('d-none');
        customDataFields.innerHTML = custom.map((field, idx) => (
            `<div class="mb-2">
  <label class="form-label" for="custom_data_${escapeHtml(field.id)}">${escapeHtml(field.label || `Campo personalizado ${idx + 1}`)}</label>
  <input type="text" class="form-control custom-data-input" id="custom_data_${escapeHtml(field.id)}" data-custom-id="${escapeHtml(field.id)}" maxlength="80" value="${escapeHtml(field.text || '')}">
</div>`
        )).join('');
    }

    function cloneProfile(profile) {
        return {
            colors: { ...(profile.colors || {}) },
            infoOrder: [...(profile.infoOrder || ['cargo', 'subdepto', 'depto'])],
            contactOrder: [...(profile.contactOrder || ['anexo', 'fono', 'email'])],
            instPosition: profile.instPosition === 'before' ? 'before' : 'after',
            customFields: Array.isArray(profile.customFields) ? profile.customFields.map((x) => ({ ...x })) : [],
            fieldOrder: sanitizeFieldOrder(profile.fieldOrder, profile.customFields || []),
            textBlockOrder: sanitizeOrderedList(profile.textBlockOrder, TEXT_BLOCK_ALLOWED, TEXT_BLOCK_ALLOWED),
            layoutOrder: sanitizeOrderedList(profile.layoutOrder, LAYOUT_ALLOWED, LAYOUT_ALLOWED)
        };
    }

    function rebuildDesignKeys() {
        designKeys = [...BUILTIN_DESIGNS, ...customDesigns.map((d) => d.key)];
    }

    function isCustomDesignKey(key) {
        return customDesigns.some((d) => d.key === key);
    }

    function sanitizeDesignName(name) {
        const value = String(name || '').trim().slice(0, 40);
        return value || 'Nuevo diseño';
    }

    function createCustomDesignKey() {
        const now = Date.now().toString(36);
        let key = `custom_${now}`;
        let i = 1;
        while (designKeys.includes(key)) {
            i += 1;
            key = `custom_${now}_${i}`;
        }
        return key;
    }

    function loadCustomDesignsFromStorage() {
        customDesigns = [];
        try {
            const raw = localStorage.getItem(CUSTOM_DESIGNS_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed)) return;
            customDesigns = parsed
                .map((x) => ({
                    key: String(x?.key || ''),
                    name: sanitizeDesignName(x?.name || '')
                }))
                .filter((x) => /^custom_[a-z0-9_]+$/i.test(x.key));
        } catch (_) {
            customDesigns = [];
        }
    }

    function saveCustomDesignsToStorage() {
        try {
            localStorage.setItem(CUSTOM_DESIGNS_STORAGE_KEY, JSON.stringify(customDesigns));
        } catch (_) {
            // Ignore storage failures.
        }
    }

    async function apiRequest(payload = null) {
        if (!DESIGNS_API) return null;
        const opts = payload
            ? {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }
            : { method: 'GET' };
        const res = await fetch(DESIGNS_API, opts);
        if (!res.ok) throw new Error(`API ${res.status}`);
        return await res.json();
    }

    async function loadCustomDesignsFromApi() {
        try {
            const data = await apiRequest();
            if (!data || data.ok !== true || !Array.isArray(data.items)) return false;
            customDesigns = data.items
                .map((x) => ({
                    key: String(x?.key || ''),
                    name: sanitizeDesignName(x?.name || '')
                }))
                .filter((x) => /^custom_[a-z0-9_]+$/i.test(x.key));
            const byKey = {};
            (Array.isArray(data.items) ? data.items : []).forEach((x) => {
                const key = String(x?.key || '');
                if (!/^custom_[a-z0-9_]+$/i.test(key)) return;
                byKey[key] = sanitizeDesignerProfile(x?.profile || {});
            });
            Object.keys(byKey).forEach((key) => { designerProfiles[key] = byKey[key]; });
            return true;
        } catch (_) {
            return false;
        }
    }

    async function saveCustomDesignToApi(key, name, profile) {
        if (!DESIGNS_API) return false;
        try {
            const data = await apiRequest({
                action: 'save',
                key,
                name: sanitizeDesignName(name),
                profile: sanitizeDesignerProfile(profile)
            });
            return !!(data && data.ok);
        } catch (_) {
            return false;
        }
    }

    async function deleteCustomDesignFromApi(key) {
        if (!DESIGNS_API) return false;
        try {
            const data = await apiRequest({ action: 'delete', key });
            return !!(data && data.ok);
        } catch (_) {
            return false;
        }
    }

    function customSlideHtml(key, title, index) {
        return `<div class="design-item" data-design="${escapeHtml(key)}" data-index="${index}">
  <div class="design-slide" data-design-click="${escapeHtml(key)}">
    <div class="design-thumb-stage">
      <div class="design-thumb-canvas"></div>
    </div>
    <p class="design-slide-title">${escapeHtml(title)}</p>
  </div>
</div>`;
    }

    function renderCustomSlides() {
        if (!designCarouselStage) return;
        designCarouselStage.querySelectorAll('.design-item[data-custom="1"]').forEach((n) => n.remove());
        customDesigns.forEach((design, i) => {
            const idx = BUILTIN_DESIGNS.length + i;
            designCarouselStage.insertAdjacentHTML('beforeend', customSlideHtml(design.key, design.name, idx));
            const item = designCarouselStage.lastElementChild;
            if (item) item.setAttribute('data-custom', '1');
        });
    }

    function createDefaultDesignerProfile() {
        return {
            colors: {
                primary: designerDefaults.color_primary || '#0d6efd',
                secondary: designerDefaults.color_secondary || '#dc2626',
                text: designerDefaults.color_text || '#111827',
                muted: designerDefaults.color_muted || '#334155'
            },
            infoOrder: uniqueOrder(Array.isArray(designerDefaults.info_order) ? designerDefaults.info_order : ['cargo', 'subdepto', 'depto'], ['cargo', 'subdepto', 'depto']),
            contactOrder: uniqueOrder(Array.isArray(designerDefaults.contact_order) ? designerDefaults.contact_order : ['anexo', 'fono', 'email'], ['anexo', 'fono', 'email']),
            instPosition: designerDefaults.inst_position === 'before' ? 'before' : 'after',
            customFields: [],
            fieldOrder: [...BASE_FIELD_IDS],
            textBlockOrder: sanitizeOrderedList(designerDefaults.text_block_order, TEXT_BLOCK_ALLOWED, TEXT_BLOCK_ALLOWED),
            layoutOrder: sanitizeOrderedList(designerDefaults.layout_order, LAYOUT_ALLOWED, LAYOUT_ALLOWED)
        };
    }

    function initDesignerProfiles() {
        const template = createDefaultDesignerProfile();
        designerProfiles = {};
        designKeys.forEach((key) => {
            designerProfiles[key] = cloneProfile(template);
        });
    }

    function sanitizeDesignerProfile(raw) {
        const template = createDefaultDesignerProfile();
        if (!raw || typeof raw !== 'object') return cloneProfile(template);
        const profile = cloneProfile(template);
        if (raw.colors && typeof raw.colors === 'object') {
            profile.colors.primary = raw.colors.primary || profile.colors.primary;
            profile.colors.secondary = raw.colors.secondary || profile.colors.secondary;
            profile.colors.text = raw.colors.text || profile.colors.text;
            profile.colors.muted = raw.colors.muted || profile.colors.muted;
        }
        profile.infoOrder = uniqueOrder(Array.isArray(raw.infoOrder) ? raw.infoOrder : profile.infoOrder, ['cargo', 'subdepto', 'depto']);
        profile.contactOrder = uniqueOrder(Array.isArray(raw.contactOrder) ? raw.contactOrder : profile.contactOrder, ['anexo', 'fono', 'email']);
        profile.instPosition = raw.instPosition === 'before' ? 'before' : 'after';
        profile.customFields = (Array.isArray(raw.customFields) ? raw.customFields : [])
            .map((x, idx) => sanitizeCustomField(x, idx))
            .filter(Boolean)
            .slice(0, 12);
        profile.fieldOrder = sanitizeFieldOrder(raw.fieldOrder, profile.customFields);
        profile.textBlockOrder = sanitizeOrderedList(raw.textBlockOrder, TEXT_BLOCK_ALLOWED, TEXT_BLOCK_ALLOWED);
        profile.layoutOrder = sanitizeOrderedList(raw.layoutOrder, LAYOUT_ALLOWED, LAYOUT_ALLOWED);
        return profile;
    }

    function loadDesignerProfilesFromStorage() {
        try {
            const raw = localStorage.getItem(DESIGNER_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw);
            if (!parsed || typeof parsed !== 'object') return;
            designKeys.forEach((key) => {
                if (parsed[key]) designerProfiles[key] = sanitizeDesignerProfile(parsed[key]);
            });
        } catch (_) {
            // Ignore invalid stored config.
        }
    }

    function saveDesignerProfilesToStorage() {
        try {
            localStorage.setItem(DESIGNER_STORAGE_KEY, JSON.stringify(designerProfiles));
        } catch (_) {
            // Ignore storage failures.
        }
    }

    function currentDesignKey() {
        const value = fields.diseno?.value;
        return designKeys.includes(value) ? value : 'institucional';
    }

    function getSortOrder(container, allowed) {
        if (!container) return sanitizeOrderedList([], allowed, allowed);
        const values = Array.from(container.querySelectorAll('.designer-sort-item'))
            .map((item) => item.getAttribute('data-value') || '')
            .filter(Boolean);
        return sanitizeOrderedList(values, allowed, allowed);
    }

    function renderSortList(container, order, labels) {
        if (!container) return;
        const normalized = sanitizeOrderedList(order, Object.keys(labels), Object.keys(labels));
        container.innerHTML = normalized
            .map((value, idx) => (
                `<div class="designer-sort-item" draggable="true" data-value="${value}">
  <span class="designer-sort-index">${idx + 1}</span>
  <span class="designer-sort-label">${escapeHtml(labels[value] || value)}</span>
</div>`
            ))
            .join('');
    }

    function moveSortValue(order, value, toIndex) {
        const current = [...order];
        const from = current.indexOf(value);
        if (from < 0 || toIndex < 0 || toIndex >= current.length || from === toIndex) return current;
        current.splice(from, 1);
        current.splice(toIndex, 0, value);
        return current;
    }

    function bindSortDnd(container, allowed, labels, onChange) {
        if (!container) return;
        container.addEventListener('dragstart', (ev) => {
            const item = ev.target.closest('.designer-sort-item');
            if (!item) return;
            sortDragState = { container, value: item.getAttribute('data-value') || '' };
            item.classList.add('is-dragging');
            if (ev.dataTransfer) {
                ev.dataTransfer.effectAllowed = 'move';
                ev.dataTransfer.setData('text/plain', sortDragState.value);
            }
        });
        container.addEventListener('dragover', (ev) => {
            if (sortDragState.container !== container || !sortDragState.value) return;
            ev.preventDefault();
        });
        container.addEventListener('drop', (ev) => {
            if (sortDragState.container !== container || !sortDragState.value) return;
            ev.preventDefault();
            const target = ev.target.closest('.designer-sort-item');
            if (!target) return;
            const targetValue = target.getAttribute('data-value') || '';
            if (!targetValue || targetValue === sortDragState.value) return;
            const current = getSortOrder(container, allowed);
            const targetIndex = current.indexOf(targetValue);
            const next = moveSortValue(current, sortDragState.value, targetIndex);
            renderSortList(container, next, labels);
            onChange(next);
        });
        container.addEventListener('dragend', () => {
            container.querySelectorAll('.designer-sort-item.is-dragging').forEach((item) => item.classList.remove('is-dragging'));
            sortDragState = { container: null, value: '' };
        });
    }

    function readDesignerFormToProfile() {
        normalizeDesignerOrderSelectors();
        const currentProfile = sanitizeDesignerProfile(designerProfiles[currentDesignKey()] || createDefaultDesignerProfile());
        return {
            colors: {
                primary: designerFields.color_primary?.value || '#0d6efd',
                secondary: designerFields.color_secondary?.value || '#dc2626',
                text: designerFields.color_text?.value || '#111827',
                muted: designerFields.color_muted?.value || '#334155'
            },
            infoOrder: uniqueOrder([
                designerFields.info_order_1?.value,
                designerFields.info_order_2?.value,
                designerFields.info_order_3?.value
            ], ['cargo', 'subdepto', 'depto']),
            contactOrder: uniqueOrder([
                designerFields.contact_order_1?.value,
                designerFields.contact_order_2?.value,
                designerFields.contact_order_3?.value
            ], ['anexo', 'fono', 'email']),
            instPosition: designerFields.inst_position?.value === 'before' ? 'before' : 'after',
            customFields: currentProfile.customFields || [],
            fieldOrder: sanitizeFieldOrder(currentProfile.fieldOrder, currentProfile.customFields || []),
            textBlockOrder: getSortOrder(designerFields.text_order, TEXT_BLOCK_ALLOWED),
            layoutOrder: getSortOrder(designerFields.layout_order, LAYOUT_ALLOWED)
        };
    }

    function applyDesignerProfileToForm(profile) {
        const p = sanitizeDesignerProfile(profile);
        if (designerFields.color_primary) designerFields.color_primary.value = p.colors.primary;
        if (designerFields.color_secondary) designerFields.color_secondary.value = p.colors.secondary;
        if (designerFields.color_text) designerFields.color_text.value = p.colors.text;
        if (designerFields.color_muted) designerFields.color_muted.value = p.colors.muted;
        if (designerFields.info_order_1) designerFields.info_order_1.value = p.infoOrder[0];
        if (designerFields.info_order_2) designerFields.info_order_2.value = p.infoOrder[1];
        if (designerFields.info_order_3) designerFields.info_order_3.value = p.infoOrder[2];
        if (designerFields.contact_order_1) designerFields.contact_order_1.value = p.contactOrder[0];
        if (designerFields.contact_order_2) designerFields.contact_order_2.value = p.contactOrder[1];
        if (designerFields.contact_order_3) designerFields.contact_order_3.value = p.contactOrder[2];
        if (designerFields.inst_position) designerFields.inst_position.value = p.instPosition;
        renderSortList(designerFields.text_order, p.textBlockOrder, TEXT_BLOCK_LABELS);
        renderSortList(designerFields.layout_order, p.layoutOrder, LAYOUT_LABELS);
        normalizeDesignerOrderSelectors();
        ORDER_FIELD_KEYS.forEach((key) => {
            if (designerFields[key]) designerFields[key].setAttribute('data-prev-value', designerFields[key].value);
        });
    }

    function getOrderGroupByKey(fieldKey) {
        if (ORDER_GROUPS.info.keys.includes(fieldKey)) return ORDER_GROUPS.info;
        if (ORDER_GROUPS.contact.keys.includes(fieldKey)) return ORDER_GROUPS.contact;
        return null;
    }

    function handleDesignerOrderChange(fieldKey) {
        const group = getOrderGroupByKey(fieldKey);
        if (!group) return;
        const selects = group.keys.map((key) => designerFields[key]).filter(Boolean);
        const changed = designerFields[fieldKey];
        if (!changed) return;

        const changedValue = changed.value;
        const duplicate = selects.find((el) => el !== changed && el.value === changedValue);
        if (duplicate) {
            const prev = changed.getAttribute('data-prev-value') || '';
            if (prev && prev !== changedValue && group.allowed.includes(prev)) {
                duplicate.value = prev;
            } else {
                const free = group.allowed.find((v) => !selects.some((el) => el.value === v || (el === changed && v === changedValue)));
                duplicate.value = free || duplicate.value;
            }
        }
        normalizeOrderGroup(group);
        group.keys.forEach((key) => {
            if (designerFields[key]) designerFields[key].setAttribute('data-prev-value', designerFields[key].value);
        });
        renderSignature();
    }

    function buildDesignerConfig(targetDesign) {
        const current = currentDesignKey();
        const design = designKeys.includes(targetDesign) ? targetDesign : current;
        const profile = design === current ? readDesignerFormToProfile() : sanitizeDesignerProfile(designerProfiles[design]);
        return {
            colors: {
                primary: profile.colors.primary,
                secondary: profile.colors.secondary,
                text: profile.colors.text,
                muted: profile.colors.muted
            },
            infoOrder: profile.infoOrder,
            contactOrder: profile.contactOrder,
            instPosition: profile.instPosition,
            customFields: profile.customFields || [],
            fieldOrder: sanitizeFieldOrder(profile.fieldOrder, profile.customFields || []),
            textBlockOrder: sanitizeOrderedList(profile.textBlockOrder, TEXT_BLOCK_ALLOWED, TEXT_BLOCK_ALLOWED),
            layoutOrder: sanitizeOrderedList(profile.layoutOrder, LAYOUT_ALLOWED, LAYOUT_ALLOWED)
        };
    }

    function applyThemeTokens(html, colors) {
        return html
            .replaceAll('#0d6efd', colors.primary)
            .replaceAll('#dc2626', colors.secondary)
            .replaceAll('#111827', colors.text)
            .replaceAll('#0f172a', colors.text)
            .replaceAll('#334155', colors.muted);
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

    function isDesignerActive() {
        return !!designerView && !designerView.classList.contains('d-none');
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
        const designer = buildDesignerConfig(diseno);
        const hasAnyData = Object.values(data).some((v) => v !== '');
        const showGhost = isDesignerActive();
        if (!hasAnyData && !showGhost) return '';

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

        const ghostStyle = `color:#94a3b8; font-style:italic;`;
        const wrapLine = (id, html) => {
            if (!html) return '';
            if (!showGhost) return html;
            return `<div class="preview-editable-line" data-field-id="${id}" draggable="true">${html}</div>`;
        };
        const infoMap = {
            cargo: safe.cargo
                ? `<div style="font-size:${withScale(14, scale)}; line-height:1.28; color:#111827; font-weight:500; margin-bottom:${withScale(2, scale)}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${safe.cargo}</div>`
                : (showGhost ? `<div style="font-size:${withScale(14, scale)}; line-height:1.28; ${ghostStyle} margin-bottom:${withScale(2, scale)};">[Cargo]</div>` : ''),
            subdepto: safe.subdepto
                ? `<div style="font-size:${withScale(14, scale)}; line-height:1.28; color:#111827; font-weight:500; margin-bottom:${withScale(2, scale)}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${safe.subdepto}</div>`
                : (showGhost ? `<div style="font-size:${withScale(14, scale)}; line-height:1.28; ${ghostStyle} margin-bottom:${withScale(2, scale)};">[Sub. Depto.]</div>` : ''),
            depto: safe.depto
                ? `<div style="font-size:${withScale(14, scale)}; line-height:1.28; color:#111827; font-weight:500; margin-bottom:${withScale(2, scale)}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${safe.depto}</div>`
                : (showGhost ? `<div style="font-size:${withScale(14, scale)}; line-height:1.28; ${ghostStyle} margin-bottom:${withScale(2, scale)};">[Depto.]</div>` : '')
        };
        const contactMap = {
            anexo: safe.anexo
                ? `<div style="font-size:${withScale(14, scale)}; line-height:1.28; color:#111827; font-weight:500; margin-bottom:${withScale(2, scale)}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Anexo: ${safe.anexo}</div>`
                : (showGhost ? `<div style="font-size:${withScale(14, scale)}; line-height:1.28; ${ghostStyle} margin-bottom:${withScale(2, scale)};">Anexo: [vacío]</div>` : ''),
            fono: safe.fono
                ? `<div style="font-size:${withScale(14, scale)}; line-height:1.28; color:#111827; font-weight:500; margin-bottom:${withScale(2, scale)}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">Fono: ${safe.fono}</div>`
                : (showGhost ? `<div style="font-size:${withScale(14, scale)}; line-height:1.28; ${ghostStyle} margin-bottom:${withScale(2, scale)};">Fono: [vacío]</div>` : ''),
            email: safe.email
                ? `<div style="font-size:${withScale(14, scale)}; line-height:1.28; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><a href="mailto:${safe.email}" style="color:#111827; text-decoration:none;">${safe.email}</a></div>`
                : (showGhost ? `<div style="font-size:${withScale(14, scale)}; line-height:1.28; ${ghostStyle}">Email: [vacío]</div>` : '')
        };
        const lineasCargo = designer.infoOrder.map((k) => infoMap[k] || '').join('');
        const contacto = designer.contactOrder.map((k) => contactMap[k] || '').join('');
        const customMap = Object.fromEntries((designer.customFields || []).map((f, idx) => {
            const normalized = sanitizeCustomField(f, idx);
            return [normalized.id, normalized];
        }));
        const fieldOrder = sanitizeFieldOrder(designer.fieldOrder, designer.customFields || []);
        const fieldHtmlMap = {
            nombre: wrapLine('nombre', safe.nombre
                ? `<div style="font-size:${withScale(22, scale)}; line-height:1.2; font-weight:700; color:#111827; margin-bottom:${withScale(6, scale)}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${safe.nombre}</div>`
                : (showGhost ? `<div style="font-size:${withScale(22, scale)}; line-height:1.2; font-weight:700; ${ghostStyle} margin-bottom:${withScale(6, scale)};">[Nombre]</div>` : '')),
            cargo: wrapLine('cargo', infoMap.cargo),
            subdepto: wrapLine('subdepto', infoMap.subdepto),
            depto: wrapLine('depto', infoMap.depto),
            institucion: wrapLine('institucion', safe.institucion
                ? `<div style="font-size:${withScale(20, scale)}; line-height:1.2; font-weight:700; color:#dc2626; margin:${withScale(8, scale)} 0 ${withScale(6, scale)}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${safe.institucion}</div>`
                : (showGhost ? `<div style="font-size:${withScale(20, scale)}; line-height:1.2; font-weight:700; color:#f87171; margin:${withScale(8, scale)} 0 ${withScale(6, scale)};">[Institución]</div>` : '')),
            anexo: wrapLine('anexo', contactMap.anexo),
            fono: wrapLine('fono', contactMap.fono),
            email: wrapLine('email', contactMap.email)
        };
        const customHtml = (id) => {
            const item = customMap[id] || { label: '', text: '' };
            const label = escapeHtml(item.label || '');
            const value = escapeHtml(item.text || '');
            if (!value && !showGhost) return '';
            const line = label
                ? (value ? `<strong>${label}:</strong> ${value}` : `<strong>${label}:</strong>`)
                : value;
            const removeBtn = showGhost
                ? `<button type="button" class="preview-remove-field-btn" data-field-id="${id}" title="Eliminar campo">x</button>`
                : '';
            return wrapLine(id, `<div style="font-size:${withScale(13, scale)}; line-height:1.28; color:#334155; font-weight:500; margin-bottom:${withScale(2, scale)}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${line}${removeBtn}</div>`);
        };
        const standardTextHtml = fieldOrder
            .map((id) => (id.startsWith('custom_') ? customHtml(id) : (fieldHtmlMap[id] || '')))
            .join('');
        const standardHeight = measureTextHeight(standardTextHtml);
        const rendererKey = isCustomDesignKey(diseno) ? 'institucional' : diseno;
        const renderer = (window.SignatureDesigns && window.SignatureDesigns[rendererKey]) || (window.SignatureDesigns && window.SignatureDesigns.institucional);
        if (!renderer) return '';
        const renderedHtml = renderer({
            safe,
            scale,
            withScale,
            standardHeight,
            standardTextHtml,
            lineasCargo,
            contacto,
            textColumnHtmlCompact,
            compactBlockHtml,
            designer
        });
        return applyThemeTokens(renderedHtml, designer.colors);
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
        if (!container) return;
        if (!html) {
            container.innerHTML = '<div style="padding:10px; font-size:12px; color:#64748b;">Sin datos</div>';
            return;
        }
        container.innerHTML = html;
        syncLogoHeightsDeferred(container);
    }

    function renderCarouselPreviews(data) {
        designCarouselElement.querySelectorAll('.design-item').forEach((item) => {
            const design = item.getAttribute('data-design') || '';
            const thumb = item.querySelector('.design-thumb-canvas');
            renderThumb(thumb, buildSignature(data, design));
        });
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
        downloadBtn.classList.toggle('d-none', isGifDesign);
        downloadBtn.disabled = !hasSignature || isGifDesign;
        updateGifButtonVisibility(diseno, hasSignature);
    }

    function refreshDesignerButtonsState() {
        if (!designerFields.delete) return;
        const key = currentDesignKey();
        const canDelete = isCustomDesignKey(key);
        designerFields.delete.disabled = !canDelete;
        designerFields.delete.classList.toggle('d-none', !canDelete);
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
        if (isDesignerActive()) {
            signaturePreview.insertAdjacentHTML('beforeend', '<button type="button" class="btn btn-sm btn-outline-secondary preview-add-field-btn">+ Campo</button>');
        }
        syncLogoHeightsDeferred(signaturePreview);
        if (updateThumbs) renderCarouselPreviews(data);
        updateActiveSlideVisual(diseno);
        updateExportButtonsByDesign(diseno, true);
        if (diseno === GIF_DESIGN) startLinealPreviewAnimation();
        else stopLinealPreviewAnimation();
    }

    function updateCurrentDesignerProfile(mutator, options = {}) {
        const key = currentDesignKey();
        const profile = readDesignerFormToProfile();
        mutator(profile);
        designerProfiles[key] = sanitizeDesignerProfile(profile);
        saveDesignerProfilesToStorage();
        if (options.renderCustomDataInputs !== false) renderCustomDataInputs();
        renderSignature();
    }

    function addCustomFieldFromPreview() {
        const key = currentDesignKey();
        const profile = sanitizeDesignerProfile(designerProfiles[key] || createDefaultDesignerProfile());
        const nextCustom = [...(profile.customFields || [])];
        if (nextCustom.length >= 12) return;
        const id = getNextCustomId(nextCustom);
        const label = window.prompt('Etiqueta del nuevo campo personalizado:', '');
        if (label === null) return;
        const value = window.prompt('Valor del nuevo campo personalizado:', '');
        if (value === null) return;
        nextCustom.push(sanitizeCustomField({ id, label, text: value }, nextCustom.length));
        profile.customFields = nextCustom.filter(Boolean);
        profile.fieldOrder = sanitizeFieldOrder([...(profile.fieldOrder || []), id], profile.customFields);
        designerProfiles[key] = sanitizeDesignerProfile(profile);
        renderCustomDataInputs();
        renderSignature();
    }

    async function createCustomDesignFromCurrent(nameInput) {
        const name = sanitizeDesignName(nameInput || '');
        const key = createCustomDesignKey();
        const baseProfile = createDefaultDesignerProfile();
        customDesigns.push({ key, name });
        rebuildDesignKeys();
        designerProfiles[key] = cloneProfile(baseProfile);
        renderCustomSlides();
        saveCustomDesignsToStorage();
        saveDesignerProfilesToStorage();
        await saveCustomDesignToApi(key, name, designerProfiles[key]);
        applyDesign(key);
        if (designerFields.new_name) designerFields.new_name.value = '';
    }

    function onPreviewFieldEdit(fieldId) {
        if (!fieldId || !isDesignerActive()) return;
        if (BASE_FIELD_IDS.includes(fieldId) && fields[fieldId]) {
            const label = fieldLabelById(fieldId);
            const next = window.prompt(`Editar ${label}:`, fields[fieldId].value || '');
            if (next === null) return;
            fields[fieldId].value = next;
            renderSignature();
            return;
        }
        if (!fieldId.startsWith('custom_')) return;
        updateCurrentDesignerProfile((profile) => {
            const current = (profile.customFields || []).find((f) => f.id === fieldId);
            const nextLabel = window.prompt('Etiqueta del campo personalizado:', current?.label || '');
            if (nextLabel === null) return;
            const next = window.prompt('Valor del campo personalizado:', current?.text || '');
            if (next === null) return;
            profile.customFields = (profile.customFields || []).map((f, idx) => {
                const normalized = sanitizeCustomField(f, idx);
                if (!normalized) return null;
                if (normalized.id !== fieldId) return normalized;
                return sanitizeCustomField({ id: fieldId, label: nextLabel, text: next }, idx);
            }).filter(Boolean);
            profile.fieldOrder = sanitizeFieldOrder(profile.fieldOrder, profile.customFields);
        });
    }

    async function deleteCurrentCustomDesign() {
        const key = currentDesignKey();
        if (!isCustomDesignKey(key)) return;
        const target = customDesigns.find((d) => d.key === key);
        const ok = window.confirm(`¿Eliminar el diseño "${target?.name || key}"?`);
        if (!ok) return;
        customDesigns = customDesigns.filter((d) => d.key !== key);
        delete designerProfiles[key];
        rebuildDesignKeys();
        renderCustomSlides();
        saveCustomDesignsToStorage();
        saveDesignerProfilesToStorage();
        await deleteCustomDesignFromApi(key);
        applyDesign('institucional');
    }

    async function elementToPngBlob(element) {
        if (typeof html2canvas !== 'function') throw new Error('html2canvas no disponible');
        element.classList.add('export-static-mode');
        try {
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                allowTaint: true
            });
            return await new Promise((resolve, reject) => {
                canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo generar PNG.')), 'image/png');
            });
        } finally {
            element.classList.remove('export-static-mode');
        }
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
        element.classList.add('export-static-mode', 'export-gif-mode');
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
            element.classList.remove('export-static-mode');
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

    function applyDesign(design) {
        if (!design) return;
        if (fields.diseno.value === design) {
            updateActiveSlideVisual(design);
            return;
        }
        const previous = currentDesignKey();
        designerProfiles[previous] = readDesignerFormToProfile();
        fields.diseno.value = design;
        designerProfiles[design] = sanitizeDesignerProfile(designerProfiles[design]);
        applyDesignerProfileToForm(designerProfiles[design]);
        renderCustomDataInputs();
        if (designerFields.new_name) {
            const meta = customDesigns.find((d) => d.key === design);
            designerFields.new_name.value = meta ? meta.name : '';
        }
        saveDesignerProfilesToStorage();
        refreshDesignerButtonsState();
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
        renderCustomDataInputs();
        renderSignature();
    }

    function restoreDesignerBase() {
        const key = currentDesignKey();
        designerProfiles[key] = createDefaultDesignerProfile();
        applyDesignerProfileToForm(designerProfiles[key]);
        saveDesignerProfilesToStorage();
        renderCustomDataInputs();
    }

    function activateView(viewName) {
        const isDesigner = viewName === 'designer';
        if (dataView) dataView.classList.toggle('d-none', isDesigner);
        if (designerView) designerView.classList.toggle('d-none', !isDesigner);
        viewButtons.forEach((btn) => {
            btn.classList.toggle('active', btn.getAttribute('data-view-btn') === viewName);
        });
        refreshDesignerButtonsState();
        renderSignature();
    }

    Object.values(fields).forEach((input) => {
        if (!input) return;
        input.addEventListener('input', renderSignature);
        input.addEventListener('change', renderSignature);
    });

    if (customDataFields) {
        customDataFields.addEventListener('input', (ev) => {
            const input = ev.target.closest('.custom-data-input');
            if (!input) return;
            const customId = input.getAttribute('data-custom-id') || '';
            if (!customId) return;
            updateCurrentDesignerProfile((profile) => {
                profile.customFields = (profile.customFields || [])
                    .map((field, idx) => {
                        const normalized = sanitizeCustomField(field, idx);
                        if (!normalized) return null;
                        if (normalized.id !== customId) return normalized;
                        const next = { ...normalized };
                        next.text = input.value;
                        return sanitizeCustomField({ id: customId, label: next.label, text: next.text }, idx);
                    })
                    .filter(Boolean);
                profile.fieldOrder = sanitizeFieldOrder(profile.fieldOrder, profile.customFields);
            }, { renderCustomDataInputs: false });
        });
    }

    Object.values(designerFields).forEach((input) => {
        if (!input || input === designerFields.reset || input === designerFields.save) return;
        if (ORDER_FIELD_KEYS.some((k) => designerFields[k] === input)) return;
        input.addEventListener('input', renderSignature);
        input.addEventListener('change', renderSignature);
    });

    bindSortDnd(designerFields.text_order, TEXT_BLOCK_ALLOWED, TEXT_BLOCK_LABELS, (nextOrder) => {
        updateCurrentDesignerProfile((profile) => {
            profile.textBlockOrder = sanitizeOrderedList(nextOrder, TEXT_BLOCK_ALLOWED, TEXT_BLOCK_ALLOWED);
        });
    });
    bindSortDnd(designerFields.layout_order, LAYOUT_ALLOWED, LAYOUT_LABELS, (nextOrder) => {
        updateCurrentDesignerProfile((profile) => {
            profile.layoutOrder = sanitizeOrderedList(nextOrder, LAYOUT_ALLOWED, LAYOUT_ALLOWED);
        });
    });

    signaturePreview.addEventListener('click', (ev) => {
        const removeBtn = ev.target.closest('.preview-remove-field-btn');
        if (removeBtn) {
            const customId = removeBtn.getAttribute('data-field-id') || '';
            if (!customId) return;
            updateCurrentDesignerProfile((profile) => {
                profile.customFields = (profile.customFields || [])
                    .map((field, idx) => sanitizeCustomField(field, idx))
                    .filter(Boolean)
                    .filter((field) => field.id !== customId);
                profile.fieldOrder = sanitizeFieldOrder(
                    (profile.fieldOrder || []).filter((id) => id !== customId),
                    profile.customFields
                );
            });
            return;
        }
        const addBtn = ev.target.closest('.preview-add-field-btn');
        if (addBtn) {
            addCustomFieldFromPreview();
            return;
        }
        const line = ev.target.closest('.preview-editable-line');
        if (!line) return;
        onPreviewFieldEdit(line.getAttribute('data-field-id') || '');
    });
    signaturePreview.addEventListener('dragstart', (ev) => {
        const line = ev.target.closest('.preview-editable-line');
        if (!line || !isDesignerActive()) return;
        sortDragState = { container: signaturePreview, value: line.getAttribute('data-field-id') || '' };
        line.classList.add('is-dragging');
        if (ev.dataTransfer) {
            ev.dataTransfer.effectAllowed = 'move';
            ev.dataTransfer.setData('text/plain', sortDragState.value);
        }
    });
    signaturePreview.addEventListener('dragover', (ev) => {
        if (sortDragState.container !== signaturePreview || !sortDragState.value || !isDesignerActive()) return;
        if (ev.target.closest('.preview-editable-line')) ev.preventDefault();
    });
    signaturePreview.addEventListener('drop', (ev) => {
        if (sortDragState.container !== signaturePreview || !sortDragState.value || !isDesignerActive()) return;
        const target = ev.target.closest('.preview-editable-line');
        if (!target) return;
        ev.preventDefault();
        const targetValue = target.getAttribute('data-field-id') || '';
        if (!targetValue || targetValue === sortDragState.value) return;
        updateCurrentDesignerProfile((profile) => {
            const currentOrder = sanitizeFieldOrder(profile.fieldOrder, profile.customFields || []);
            const targetIndex = currentOrder.indexOf(targetValue);
            profile.fieldOrder = moveSortValue(currentOrder, sortDragState.value, targetIndex);
        });
    });
    signaturePreview.addEventListener('dragend', () => {
        signaturePreview.querySelectorAll('.preview-editable-line.is-dragging').forEach((item) => item.classList.remove('is-dragging'));
        sortDragState = { container: null, value: '' };
    });

    ORDER_FIELD_KEYS.forEach((key) => {
        const el = designerFields[key];
        if (!el) return;
        el.setAttribute('data-prev-value', el.value);
        el.addEventListener('focus', () => el.setAttribute('data-prev-value', el.value));
        el.addEventListener('change', () => handleDesignerOrderChange(key));
    });

    designCarouselElement.addEventListener('click', (ev) => {
        const card = ev.target.closest('[data-design-click]');
        if (!card) return;
        applyDesign(card.getAttribute('data-design-click'));
    });
    designPrevBtn.addEventListener('click', () => moveDesign(-1));
    designNextBtn.addEventListener('click', () => moveDesign(1));

    form.addEventListener('reset', () => {
        setTimeout(() => restoreBase(), 0);
    });

    if (restoreBtn) restoreBtn.addEventListener('click', restoreBase);
    if (designerFields.save) {
        designerFields.save.addEventListener('click', async () => {
            const key = currentDesignKey();
            designerProfiles[key] = readDesignerFormToProfile();
            if (isCustomDesignKey(key)) {
                const meta = customDesigns.find((d) => d.key === key);
                const nextName = sanitizeDesignName(designerFields.new_name?.value || meta?.name || 'Nuevo dise�o');
                if (meta) meta.name = nextName;
                renderCustomSlides();
                if (designerFields.new_name) designerFields.new_name.value = nextName;
            }
            saveCustomDesignsToStorage();
            saveDesignerProfilesToStorage();
            if (isCustomDesignKey(key)) {
                const meta = customDesigns.find((d) => d.key === key);
                await saveCustomDesignToApi(key, meta?.name || 'Nuevo dise�o', designerProfiles[key]);
            }
            designerFields.save.textContent = 'Cambios guardados';
            setTimeout(() => { designerFields.save.textContent = 'Guardar cambios de este dise�o'; }, 1300);
        });
    }
    if (designerFields.reset) {
        designerFields.reset.addEventListener('click', () => {
            restoreDesignerBase();
            renderSignature();
        });
    }
    if (designerFields.delete) {
        designerFields.delete.addEventListener('click', async () => {
            await deleteCurrentCustomDesign();
        });
    }
    if (designerFields.create) {
        designerFields.create.addEventListener('click', async () => {
            await createCustomDesignFromCurrent(designerFields.new_name?.value || '');
        });
    }
    if (designerFields.new_name) {
        designerFields.new_name.addEventListener('keydown', async (ev) => {
            if (ev.key !== 'Enter') return;
            ev.preventDefault();
            await createCustomDesignFromCurrent(designerFields.new_name?.value || '');
        });
    }

    viewButtons.forEach((btn) => {
        btn.addEventListener('click', () => activateView(btn.getAttribute('data-view-btn') || 'data'));
    });

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
        throw new Error('La copia al portapapeles no esta disponible en este navegador o contexto.');
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

    async function bootstrap() {
        loadCustomDesignsFromStorage();
        rebuildDesignKeys();
        initDesignerProfiles();
        loadDesignerProfilesFromStorage();
        const apiLoaded = await loadCustomDesignsFromApi();
        if (apiLoaded) {
            rebuildDesignKeys();
            designKeys.forEach((key) => {
                if (!designerProfiles[key]) designerProfiles[key] = createDefaultDesignerProfile();
            });
        }
        renderCustomSlides();
        applyDesignerProfileToForm(designerProfiles[currentDesignKey()]);
        renderCustomDataInputs();
        activateView('data');
        restoreBase();
    }

    bootstrap();
})();

