/* ============================================================
   ADMIN.CSS - Panel de Administración CINEMARKET
   Estilo claro, similar a la vista de usuario
   ============================================================ */

/* ===== VARIABLES ===== */
:root {
    --primary: #e50914;
    --primary-dark: #b20710;
    --primary-glow: rgba(229, 9, 20, 0.15);
    --bg-body: #f5f5f5;
    --bg-sidebar: #ffffff;
    --bg-card: #ffffff;
    --bg-card-hover: #f8f8f8;
    --bg-input: #f9f9f9;
    --text-primary: #222222;
    --text-secondary: #555555;
    --text-muted: #888888;
    --border-color: #e6e6e6;
    --border-glow: rgba(229, 9, 20, 0.15);
    --success: #2ecc71;
    --danger: #e74c3c;
    --warning: #f39c12;
    --info: #3498db;
    --radius: 10px;
    --shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    --shadow-hover: 0 4px 20px rgba(0, 0, 0, 0.12);
}

/* ===== RESET Y BASE ===== */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
    background: var(--bg-body);
    color: var(--text-primary);
    min-height: 100vh;
    display: flex;
    overflow: hidden;
}

/* ===== SCROLLBAR ===== */
::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}
::-webkit-scrollbar-track {
    background: var(--bg-body);
}
::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 10px;
}
::-webkit-scrollbar-thumb:hover {
    background: #aaa;
}

/* ===== SIDEBAR ===== */
.sidebar {
    width: 280px;
    background: var(--bg-sidebar);
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    padding: 30px 20px;
    border-right: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    z-index: 100;
    transition: all 0.3s ease;
    box-shadow: 2px 0 12px rgba(0, 0, 0, 0.04);
}

.sidebar .brand {
    display: flex;
    align-items: center;
    gap: 14px;
    padding-bottom: 28px;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 24px;
}

.sidebar .brand .logo-icon {
    width: 44px;
    height: 44px;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    color: #fff;
}

.sidebar .brand .logo-text {
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.5px;
    color: var(--text-primary);
}

.sidebar .brand .logo-text span {
    color: var(--primary);
}

/* ===== USUARIO ===== */
.sidebar .user-card {
    background: var(--bg-body);
    border-radius: var(--radius);
    padding: 16px 18px;
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 14px;
    border: 1px solid var(--border-color);
}

.sidebar .user-card .avatar {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
}

.sidebar .user-card .user-info .name {
    font-weight: 600;
    font-size: 15px;
    color: var(--text-primary);
}
.sidebar .user-card .user-info .username {
    font-size: 12px;
    color: var(--text-muted);
}

/* ===== NAVEGACIÓN ===== */
.sidebar nav ul {
    list-style: none;
    flex: 1;
}

.sidebar nav ul li {
    margin-bottom: 2px;
}

.sidebar nav ul li a {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 12px 16px;
    color: var(--text-secondary);
    text-decoration: none;
    border-radius: var(--radius);
    transition: all 0.3s ease;
    font-size: 14px;
    font-weight: 500;
    position: relative;
}

.sidebar nav ul li a:hover {
    background: var(--bg-body);
    color: var(--text-primary);
}

.sidebar nav ul li a.active {
    background: rgba(229, 9, 20, 0.08);
    color: var(--primary);
    font-weight: 600;
}

.sidebar nav ul li a i {
    width: 20px;
    text-align: center;
    font-size: 16px;
    color: var(--text-muted);
}

.sidebar nav ul li a.active i {
    color: var(--primary);
}

.sidebar nav ul li a .badge {
    margin-left: auto;
    background: var(--primary);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 10px;
    border-radius: 20px;
}

/* ===== BOTÓN CERRAR SESIÓN ===== */
.sidebar .logout-btn {
    margin-top: 20px;
    padding: 13px 16px;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    background: transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 14px;
    width: 100%;
}

.sidebar .logout-btn:hover {
    background: rgba(229, 9, 20, 0.06);
    border-color: var(--primary);
    color: var(--primary);
}

.sidebar .logout-btn i {
    width: 20px;
    text-align: center;
}

/* ===== MAIN CONTENT ===== */
.main-content {
    margin-left: 280px;
    flex: 1;
    padding: 35px 40px;
    min-height: 100vh;
    background: var(--bg-body);
    overflow-y: auto;
    height: 100vh;
}

/* ===== PAGE HEADER ===== */
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    flex-wrap: wrap;
    gap: 15px;
}

.page-header h1 {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
}

.page-header h1 small {
    font-size: 16px;
    color: var(--text-muted);
    font-weight: 400;
    margin-left: 10px;
}

.page-header .actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
}

/* ===== BOTONES ===== */
.btn {
    padding: 10px 22px;
    border: none;
    border-radius: var(--radius);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
    letter-spacing: 0.3px;
}

.btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: #fff;
}
.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(229, 9, 20, 0.3);
}

.btn-success {
    background: linear-gradient(135deg, #2ecc71, #27ae60);
    color: #fff;
}
.btn-success:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(46, 204, 113, 0.3);
}

.btn-danger {
    background: linear-gradient(135deg, #e74c3c, #c0392b);
    color: #fff;
}
.btn-danger:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(231, 76, 60, 0.3);
}

.btn-warning {
    background: linear-gradient(135deg, #f39c12, #e67e22);
    color: #fff;
}
.btn-warning:hover {
    transform: translateY(-2px);
}

.btn-outline {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-color);
}
.btn-outline:hover {
    background: var(--bg-body);
    color: var(--text-primary);
    border-color: #ccc;
}

.btn-sm {
    padding: 6px 14px;
    font-size: 12px;
    border-radius: 8px;
}

/* ===== CARDS ===== */
.card {
    background: var(--bg-card);
    border-radius: var(--radius);
    padding: 28px 30px;
    margin-bottom: 24px;
    border: 1px solid var(--border-color);
    box-shadow: var(--shadow);
    transition: all 0.3s ease;
}

.card:hover {
    box-shadow: var(--shadow-hover);
}

.card .card-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 18px;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--text-secondary);
}

.card .card-title i {
    color: var(--primary);
    font-size: 18px;
}

/* ===== ESTADÍSTICAS ===== */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.stat-card {
    background: var(--bg-card);
    border-radius: var(--radius);
    padding: 24px 22px;
    border: 1px solid var(--border-color);
    text-align: left;
    transition: all 0.3s ease;
    box-shadow: var(--shadow);
    position: relative;
    overflow: hidden;
}

.stat-card:hover {
    box-shadow: var(--shadow-hover);
    transform: translateY(-2px);
}

.stat-card .stat-icon {
    font-size: 28px;
    color: var(--primary);
    margin-bottom: 10px;
}

.stat-card .number {
    font-size: 34px;
    font-weight: 800;
    color: var(--text-primary);
}

.stat-card .label {
    font-size: 14px;
    color: var(--text-muted);
    margin-top: 4px;
}

/* ===== TABLA ===== */
.table-wrap {
    overflow-x: auto;
    margin: -5px;
}

table {
    width: 100%;
    border-collapse: collapse;
}

table thead th {
    padding: 14px 18px;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    border-bottom: 2px solid var(--border-color);
    text-transform: uppercase;
    letter-spacing: 0.8px;
}

table tbody td {
    padding: 14px 18px;
    border-bottom: 1px solid var(--border-color);
    font-size: 14px;
    vertical-align: middle;
    color: var(--text-secondary);
}

table tbody tr {
    transition: all 0.3s ease;
}

table tbody tr:hover {
    background: var(--bg-body);
}

table tbody td strong {
    color: var(--text-primary);
}

table .product-thumb {
    width: 45px;
    height: 65px;
    object-fit: cover;
    border-radius: 6px;
    background: var(--bg-body);
    border: 1px solid var(--border-color);
}

table .actions-cell {
    display: flex;
    gap: 6px;
}

/* ===== FORMULARIOS ===== */
.form-group {
    margin-bottom: 20px;
}

.form-group label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-secondary);
    margin-bottom: 6px;
    letter-spacing: 0.3px;
}

.form-group label .required {
    color: var(--primary);
}

.form-control {
    width: 100%;
    padding: 13px 16px;
    border: 2px solid var(--border-color);
    border-radius: var(--radius);
    background: var(--bg-input);
    color: var(--text-primary);
    font-size: 14px;
    transition: all 0.3s ease;
    outline: none;
    font-family: inherit;
}

.form-control:focus {
    border-color: var(--primary);
    background: #fff;
    box-shadow: 0 0 0 4px var(--primary-glow);
}

.form-control::placeholder {
    color: var(--text-muted);
}

textarea.form-control {
    resize: vertical;
    min-height: 90px;
}

select.form-control {
    appearance: none;
    cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    padding-right: 40px;
}

.form-control option {
    color: var(--text-primary);
}

.form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
}

/* ===== FILE UPLOAD ===== */
.file-upload-area {
    border: 2px dashed var(--border-color);
    border-radius: var(--radius);
    padding: 40px 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    background: var(--bg-input);
}

.file-upload-area:hover {
    border-color: var(--primary);
    background: rgba(229, 9, 20, 0.03);
}

.file-upload-area.dragover {
    border-color: var(--primary);
    background: rgba(229, 9, 20, 0.06);
    box-shadow: 0 0 30px var(--primary-glow);
}

.file-upload-area input[type="file"] {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
}

.file-upload-area .upload-icon {
    font-size: 48px;
    color: var(--text-muted);
    margin-bottom: 12px;
}

.file-upload-area .upload-text {
    color: var(--text-secondary);
    font-size: 14px;
}

.file-upload-area .upload-text strong {
    color: var(--primary);
}

.file-upload-area .upload-hint {
    color: var(--text-muted);
    font-size: 12px;
    margin-top: 6px;
}

.image-preview-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 16px;
}

.image-preview-item {
    position: relative;
    width: 100px;
    height: 140px;
    border-radius: var(--radius);
    overflow: hidden;
    border: 2px solid var(--border-color);
    transition: all 0.3s ease;
    background: var(--bg-body);
}

.image-preview-item:hover {
    border-color: var(--primary);
}

.image-preview-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.image-preview-item .remove-image {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--danger);
    color: #fff;
    border: none;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}

.image-preview-item .remove-image:hover {
    transform: scale(1.1);
}

/* ===== MODAL ===== */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: none;
    justify-content: center;
    align-items: center;
    padding: 20px;
}

.modal-overlay.active {
    display: flex;
}

.modal {
    background: var(--bg-card);
    border-radius: 16px;
    padding: 40px;
    max-width: 780px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid var(--border-color);
    animation: modalFadeIn 0.3s ease;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

@keyframes modalFadeIn {
    from {
        opacity: 0;
        transform: translateY(30px) scale(0.97);
    }
    to {
        opacity: 1;
        transform: translateY(0) scale(1);
    }
}

.modal .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28px;
    padding-bottom: 18px;
    border-bottom: 1px solid var(--border-color);
}

.modal .modal-header h2 {
    font-size: 24px;
    font-weight: 700;
    color: var(--text-primary);
}

.modal .modal-header h2 i {
    color: var(--primary);
    margin-right: 10px;
}

.modal .modal-close {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 30px;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal .modal-close:hover {
    color: var(--text-primary);
    background: var(--bg-body);
    transform: rotate(90deg);
}

.modal .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 22px;
    border-top: 1px solid var(--border-color);
    margin-top: 22px;
}

/* ===== TOAST ===== */
.toast-container {
    position: fixed;
    top: 24px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.toast {
    padding: 16px 22px;
    border-radius: var(--radius);
    color: #fff;
    font-weight: 500;
    font-size: 14px;
    animation: toastSlideIn 0.4s ease;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
    min-width: 280px;
    display: flex;
    align-items: center;
    gap: 12px;
}

.toast-success {
    background: linear-gradient(135deg, #2ecc71, #27ae60);
}
.toast-error {
    background: linear-gradient(135deg, #e74c3c, #c0392b);
}
.toast-warning {
    background: linear-gradient(135deg, #f39c12, #e67e22);
}
.toast-info {
    background: linear-gradient(135deg, #3498db, #2980b9);
}

@keyframes toastSlideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.toast .toast-close {
    margin-left: auto;
    cursor: pointer;
    background: none;
    border: none;
    color: rgba(255,255,255,0.7);
    font-size: 20px;
    transition: all 0.3s;
}
.toast .toast-close:hover {
    color: #fff;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 992px) {
    .sidebar {
        width: 80px;
        padding: 20px 12px;
    }
    .sidebar .brand span,
    .sidebar .user-card .user-info,
    .sidebar nav ul li a span,
    .sidebar nav ul li a .badge,
    .sidebar .logout-btn span {
        display: none;
    }
    .sidebar .brand {
        justify-content: center;
    }
    .sidebar .brand .logo-text {
        display: none;
    }
    .sidebar .user-card {
        justify-content: center;
        padding: 12px;
    }
    .sidebar nav ul li a {
        justify-content: center;
        padding: 13px;
    }
    .sidebar .logout-btn {
        justify-content: center;
    }
    .main-content {
        margin-left: 80px;
        padding: 25px;
    }
}

@media (max-width: 768px) {
    .main-content {
        padding: 20px;
    }
    .page-header h1 {
        font-size: 22px;
    }
    .form-row {
        grid-template-columns: 1fr;
    }
    .stats-grid {
        grid-template-columns: 1fr 1fr;
    }
    .modal {
        padding: 25px;
    }
}

@media (max-width: 480px) {
    .main-content {
        padding: 15px;
    }
    .stats-grid {
        grid-template-columns: 1fr;
    }
    .page-header {
        flex-direction: column;
        align-items: stretch;
    }
    .page-header .actions {
        flex-wrap: wrap;
    }
    .modal {
        padding: 20px;
    }
}
