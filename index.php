<?php
function e($value) {
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}

function asset_url($path) {
    $fullPath = __DIR__ . DIRECTORY_SEPARATOR . str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path);
    $version = file_exists($fullPath) ? (string)filemtime($fullPath) : (string)time();
    return $path . '?v=' . rawurlencode($version);
}

$fields = [
    'nombre' => '',
    'cargo' => '',
    'subdepto' => '',
    'depto' => '',
    'institucion' => 'Hospital Base Valdivia',
    'anexo' => '',
    'fono' => '',
    'email' => ''
];

$scriptDir = str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? ''));
$basePath = ($scriptDir === '/' || $scriptDir === '.') ? '' : rtrim($scriptDir, '/');

$logoIzqFile = __DIR__ . DIRECTORY_SEPARATOR . 'img' . DIRECTORY_SEPARATOR . 'logo-hbv.png';
$logoCentroFile = __DIR__ . DIRECTORY_SEPARATOR . 'img' . DIRECTORY_SEPARATOR . 'logo-100.png';
$logoDerFile = __DIR__ . DIRECTORY_SEPARATOR . 'img' . DIRECTORY_SEPARATOR . 'logo-acreditacion.png';

$logoIzq = file_exists($logoIzqFile) ? $basePath . '/img/logo-hbv.png' : '';
$logoCentro = file_exists($logoCentroFile) ? $basePath . '/img/logo-100.png' : '';
$logoDer = file_exists($logoDerFile) ? $basePath . '/img/logo-acreditacion.png' : '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach ($fields as $key => $value) {
        $fields[$key] = trim($_POST[$key] ?? '');
    }
}
?>
<!doctype html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Generador de firma de correo</title>
    <link rel="icon" type="image/png" href="<?= e(asset_url('img/logo-hbv.png')) ?>">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="<?= e(asset_url('assets/css/app.css')) ?>" rel="stylesheet">
</head>
<body>
<div class="container-fluid py-5 px-4 px-xl-5">
    <div class="row g-4">
        <div class="col-lg-4">
            <div class="card shadow-sm panel-card form-panel">
                <div class="card-body">
                    <h1 class="h4 mb-2 panel-title">Generador de firma</h1>
                    <p class="panel-subtitle">Completa los datos y genera una firma lista para copiar como PNG o descargar como GIF.</p>

                    <div class="view-switch mb-2">
                        <button type="button" class="btn btn-sm btn-outline-primary active" data-view-btn="data">Datos</button>
                        <button type="button" class="btn btn-sm btn-outline-primary" data-view-btn="designer">Designer</button>
                    </div>

                    <form id="signatureForm" method="post" class="row g-3" onsubmit="return false;" data-view="data">
                        <input type="hidden" id="diseno" name="diseno" value="institucional">
                        <div class="col-12">
                            <label for="preset" class="form-label">Tamaño tipográfico</label>
                            <select id="preset" class="form-control">
                                <option value="compacto">Compacto</option>
                                <option value="normal" selected>Normal</option>
                                <option value="grande">Grande</option>
                            </select>
                        </div>
                        <div class="col-12">
                            <label for="nombre" class="form-label">Nombre</label>
                            <input type="text" class="form-control" id="nombre" name="nombre" value="<?= e($fields['nombre']) ?>">
                            <small id="nombreError" class="field-error"></small>
                        </div>
                        <div class="col-12">
                            <label for="cargo" class="form-label">Cargo</label>
                            <input type="text" class="form-control" id="cargo" name="cargo" value="<?= e($fields['cargo']) ?>">
                            <small id="cargoError" class="field-error"></small>
                        </div>
                        <div class="col-12">
                            <label for="subdepto" class="form-label">Sub. Depto.</label>
                            <input type="text" class="form-control" id="subdepto" name="subdepto" value="<?= e($fields['subdepto']) ?>">
                            <small id="subdeptoError" class="field-error"></small>
                        </div>
                        <div class="col-12">
                            <label for="depto" class="form-label">Depto.</label>
                            <input type="text" class="form-control" id="depto" name="depto" value="<?= e($fields['depto']) ?>">
                            <small id="deptoError" class="field-error"></small>
                        </div>
                        <div class="col-12">
                            <label for="institucion" class="form-label">Institución (línea destacada)</label>
                            <input type="text" class="form-control" id="institucion" name="institucion" value="<?= e($fields['institucion']) ?>">
                            <small id="institucionError" class="field-error"></small>
                        </div>
                        <div class="col-md-6">
                            <label for="anexo" class="form-label">Anexo</label>
                            <input type="text" class="form-control" id="anexo" name="anexo" value="<?= e($fields['anexo']) ?>">
                            <small id="anexoError" class="field-error"></small>
                        </div>
                        <div class="col-md-6">
                            <label for="fono" class="form-label">Fono</label>
                            <input type="text" class="form-control" id="fono" name="fono" value="<?= e($fields['fono']) ?>">
                            <small id="fonoError" class="field-error"></small>
                        </div>
                        <div class="col-12">
                            <label for="email" class="form-label">Email</label>
                            <input type="email" class="form-control" id="email" name="email" value="<?= e($fields['email']) ?>">
                            <small id="emailError" class="field-error"></small>
                        </div>
                        <div class="col-12 d-none" id="customDataFieldsWrap">
                            <div class="form-label mb-1">Campos personalizados</div>
                            <div id="customDataFields" class="designer-custom-list"></div>
                        </div>

                        <div class="col-12 d-grid gap-2">
                            <button type="reset" class="btn btn-clean">Limpiar campos</button>
                        </div>
                    </form>

                    <div id="designerView" class="row g-2 d-none mt-1" data-view="designer">
                        <div class="col-6">
                            <label for="designer_color_primary" class="form-label">Color primario</label>
                            <input type="color" id="designer_color_primary" class="form-control form-control-color w-100" value="#0d6efd">
                        </div>
                        <div class="col-6">
                            <label for="designer_color_secondary" class="form-label">Color secundario</label>
                            <input type="color" id="designer_color_secondary" class="form-control form-control-color w-100" value="#dc2626">
                        </div>
                        <div class="col-6">
                            <label for="designer_color_text" class="form-label">Color texto</label>
                            <input type="color" id="designer_color_text" class="form-control form-control-color w-100" value="#111827">
                        </div>
                        <div class="col-6">
                            <label for="designer_color_muted" class="form-label">Color texto secundario</label>
                            <input type="color" id="designer_color_muted" class="form-control form-control-color w-100" value="#334155">
                        </div>

                        <div class="col-12">
                            <small class="text-muted">En Designer, edita y reordena los campos directamente en la vista previa.</small>
                        </div>

                        <div class="col-8">
                            <label for="designerNewName" class="form-label">Nuevo diseño</label>
                            <input type="text" id="designerNewName" class="form-control" placeholder="Ej: Diseño RRHH">
                        </div>
                        <div class="col-4 d-grid align-items-end">
                            <button type="button" id="designerCreateBtn" class="btn btn-outline-success">Crear diseño</button>
                        </div>
                        <div class="col-12 d-grid gap-2">
                            <button type="button" id="designerSaveBtn" class="btn btn-outline-primary">Guardar cambios de este diseño</button>
                            <button type="button" id="designerDeleteBtn" class="btn btn-outline-danger">Eliminar diseño actual</button>
                            <button type="button" id="designerResetBtn" class="btn btn-clean">Restablecer este diseño</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-8 preview-col">
            <div class="card shadow-sm panel-card preview-panel">
                <div class="card-body d-flex flex-column">
                    <div class="preview-content-wrap">
                        <div class="d-flex justify-content-between align-items-center mb-2 preview-toolbar">
                            <h2 class="h5 mb-0 panel-title">Vista previa</h2>
                            <div class="d-flex gap-2 align-items-center">
                                <button id="downloadGifBtn" class="btn btn-outline-secondary btn-download btn-sm d-none" disabled>Descargar GIF</button>
                                <button id="downloadBtn" class="btn btn-outline-primary btn-download btn-sm" disabled>Descargar PNG</button>
                            </div>
                        </div>

                    <div id="designCarousel" class="design-carousel mb-2">
                        <div class="design-carousel-stage">
                            <div class="design-item active" data-design="institucional" data-index="0">
                                <div class="design-slide active" data-design-click="institucional">
                                    <div class="design-thumb-stage">
                                        <div id="thumbInstitucional" class="design-thumb-canvas"></div>
                                    </div>
                                    <p class="design-slide-title">Institucional lateral</p>
                                </div>
                            </div>
                            <div class="design-item" data-design="franjas" data-index="1">
                                <div class="design-slide" data-design-click="franjas">
                                    <div class="design-thumb-stage">
                                        <div id="thumbFranjas" class="design-thumb-canvas"></div>
                                    </div>
                                    <p class="design-slide-title">Compacto con franjas</p>
                                </div>
                            </div>
                            <div class="design-item" data-design="minimal" data-index="2">
                                <div class="design-slide" data-design-click="minimal">
                                    <div class="design-thumb-stage">
                                        <div id="thumbMinimal" class="design-thumb-canvas"></div>
                                    </div>
                                    <p class="design-slide-title">Minimal corporativo</p>
                                </div>
                            </div>
                            <div class="design-item" data-design="lineal" data-index="3">
                                <div class="design-slide" data-design-click="lineal">
                                    <div class="design-thumb-stage">
                                        <div id="thumbLineal" class="design-thumb-canvas"></div>
                                    </div>
                                    <p class="design-slide-title">Animado GIF</p>
                                </div>
                            </div>
                            <div class="design-item" data-design="avanzado" data-index="4">
                                <div class="design-slide" data-design-click="avanzado">
                                    <div class="design-thumb-stage">
                                        <div id="thumbAvanzado" class="design-thumb-canvas"></div>
                                    </div>
                                    <p class="design-slide-title">Avanzado libre</p>
                                </div>
                            </div>
                        </div>
                        <button id="designPrevBtn" class="design-nav-btn design-nav-prev" type="button">
                            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Anterior</span>
                        </button>
                        <button id="designNextBtn" class="design-nav-btn design-nav-next" type="button">
                            <span class="carousel-control-next-icon" aria-hidden="true"></span>
                            <span class="visually-hidden">Siguiente</span>
                        </button>
                    </div>

                    <div id="signaturePreview" class="signature-box mb-3">
                        <p class="text-muted mb-0">Tu firma aparecerá aquí cuando completes el formulario.</p>
                    </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
window.APP_CONFIG = {
    logos: {
        izq: <?= json_encode($logoIzq, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>,
        centro: <?= json_encode($logoCentro, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>,
        der: <?= json_encode($logoDer, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?>
    },
    defaults: {
        diseno: 'institucional',
        preset: 'normal',
        nombre: <?= json_encode($fields['nombre'], JSON_UNESCAPED_UNICODE) ?>,
        cargo: <?= json_encode($fields['cargo'], JSON_UNESCAPED_UNICODE) ?>,
        subdepto: <?= json_encode($fields['subdepto'], JSON_UNESCAPED_UNICODE) ?>,
        depto: <?= json_encode($fields['depto'], JSON_UNESCAPED_UNICODE) ?>,
        institucion: <?= json_encode($fields['institucion'], JSON_UNESCAPED_UNICODE) ?>,
        anexo: <?= json_encode($fields['anexo'], JSON_UNESCAPED_UNICODE) ?>,
        fono: <?= json_encode($fields['fono'], JSON_UNESCAPED_UNICODE) ?>,
        email: <?= json_encode($fields['email'], JSON_UNESCAPED_UNICODE) ?>
    },
    designerDefaults: {
        color_primary: '#0d6efd',
        color_secondary: '#dc2626',
        color_text: '#111827',
        color_muted: '#334155',
        info_order: ['cargo', 'subdepto', 'depto'],
        contact_order: ['anexo', 'fono', 'email'],
        inst_position: 'after',
        text_block_order: ['name', 'info', 'institucion', 'contacto'],
        layout_order: ['logo_izq', 'texto', 'logo_der']
    },
    designsApi: 'api/designs.php'
};
</script>
<script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gif.js.optimized/dist/gif.js"></script>
<script src="<?= e(asset_url('assets/js/designs/institucional.js')) ?>"></script>
<script src="<?= e(asset_url('assets/js/designs/franjas.js')) ?>"></script>
<script src="<?= e(asset_url('assets/js/designs/minimal.js')) ?>"></script>
<script src="<?= e(asset_url('assets/js/designs/lineal.js')) ?>"></script>
<script src="<?= e(asset_url('assets/js/designs/avanzado.js')) ?>"></script>
<script src="<?= e(asset_url('assets/js/app.js')) ?>"></script>
</body>
</html>
