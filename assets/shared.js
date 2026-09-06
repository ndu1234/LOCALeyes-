/* Shared helpers used by both admin.js and portal.js */

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatMoney(n) {
  if (n == null) return '\u2014';
  var num = Number(n);
  return '$' + num.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

function formatDateOnly(dateStr) {
  if (!dateStr) return '\u2014';
  var parts = dateStr.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString();
}

function formatDateRange(start, end) {
  if (!start && !end) return '\u2014';
  return (start ? formatDateOnly(start) : '\u2026') + ' \u2013 ' + (end ? formatDateOnly(end) : '\u2026');
}

function showToast(message, kind) {
  kind = kind || 'success';
  var container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  var toast = document.createElement('div');
  var bg = kind === 'success' ? '#22C55E' : kind === 'error' ? '#F87171' : '#38BDF8';
  toast.style.cssText = 'background:' + bg + ';color:#071019;padding:12px 20px;border-radius:10px;font-size:13px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,0.3);opacity:0;transform:translateX(40px);transition:all 0.3s cubic-bezier(0.16,1,0.3,1);max-width:360px;';
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(function () { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; });
  setTimeout(function () {
    toast.style.opacity = '0'; toast.style.transform = 'translateX(40px)';
    setTimeout(function () { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 300);
  }, 3500);
}

function showConfirm(message) {
  return new Promise(function (resolve) {
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;';
    var box = document.createElement('div');
    box.style.cssText = 'background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r);padding:28px 24px;max-width:420px;width:90%;box-shadow:0 40px 80px rgba(0,0,0,0.5);';
    box.innerHTML = '<p style="font-size:14px;color:var(--text-2);line-height:1.7;margin-bottom:22px;">' + message + '</p><div style="display:flex;gap:10px;justify-content:flex-end;"><button class="btn btn-ghost" id="confirm-cancel" style="padding:10px 18px;font-size:13px;">Cancel</button><button class="btn btn-primary" id="confirm-ok" style="padding:10px 18px;font-size:13px;">Confirm</button></div>';
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    document.getElementById('confirm-cancel').addEventListener('click', function () { document.body.removeChild(overlay); resolve(false); });
    document.getElementById('confirm-ok').addEventListener('click', function () { document.body.removeChild(overlay); resolve(true); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) { document.body.removeChild(overlay); resolve(false); } });
  });
}

function debounce(fn, wait) {
  var timer;
  return function () {
    var ctx = this, args = arguments;
    clearTimeout(timer);
    timer = setTimeout(function () { fn.apply(ctx, args); }, wait);
  };
}
