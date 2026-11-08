import { select, selectAll } from '../lib/dom.js';

/** UX-only prototype. This module never persists passwords or fabricates sessions. */
let mode = 'login';
const feedback = select('#formFeedback');

function clearErrors() {
  selectAll('.error').forEach((element) => {
    element.textContent = '';
  });

  feedback.textContent = '';
  feedback.className = 'feedback';
}

function setMode(nextMode) {
  mode = nextMode;
  clearErrors();

  const registering = mode === 'register';
  select('#nameField').classList.toggle('hidden', !registering);
  select('#loginTab').classList.toggle('active', !registering);
  select('#registerTab').classList.toggle('active', registering);
  select('#loginTab').setAttribute('aria-selected', String(!registering));
  select('#registerTab').setAttribute('aria-selected', String(registering));
  select('#formTitle').innerHTML = registering
    ? 'اینجا جای <span>توئه!</span>'
    : 'خوش اومدی <span>رفیق!</span>';
  select('#formDescription').textContent = registering
    ? 'فرم ثبت‌نام نمایشی wallBoard رو امتحان کن.'
    : 'به صفحه ورود نمایشی wallBoard خوش اومدی.';
  select('#submitBtn').innerHTML = registering
    ? 'ساخت حساب <span aria-hidden="true">←</span>'
    : 'ورود به حساب <span aria-hidden="true">←</span>';
  select('#switchAuth').textContent = registering
    ? 'قبلاً ثبت‌نام کردی؟ وارد شو ↗'
    : 'همین حالا ثبت‌نام کن ↗';
  select('.auth-footer span').textContent = registering ? 'حساب داری؟' : 'حساب نداری؟';
  select('#forgotPassword').classList.toggle('hidden', registering);
  select('#password').setAttribute('autocomplete', registering ? 'new-password' : 'current-password');
  select('#password').value = '';
}

select('#loginTab').addEventListener('click', () => setMode('login'));
select('#registerTab').addEventListener('click', () => setMode('register'));
select('#switchAuth').addEventListener('click', () => {
  setMode(mode === 'login' ? 'register' : 'login');
});

select('#togglePassword').addEventListener('click', () => {
  const input = select('#password');
  const visible = input.type === 'password';
  input.type = visible ? 'text' : 'password';
  select('#togglePassword').textContent = visible ? 'مخفی' : 'نمایش';
  select('#togglePassword').setAttribute('aria-pressed', String(visible));
});

select('#forgotPassword').addEventListener('click', () => {
  feedback.className = 'feedback info';
  feedback.textContent = 'بازیابی رمز عبور بعد از اتصال به بک‌اند فعال می‌شود.';
});

select('#loginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  clearErrors();

  const name = select('#fullName').value.trim();
  const email = select('#email').value.trim();
  const password = select('#password').value;
  let valid = true;

  if (mode === 'register' && name.length < 2) {
    select('#nameError').textContent = 'نام را با حداقل دو کاراکتر وارد کن.';
    valid = false;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    select('#emailError').textContent = 'ایمیل معتبر وارد کن.';
    valid = false;
  }

  if (password.length < 8) {
    select('#passwordError').textContent = 'رمز عبور باید حداقل ۸ کاراکتر باشد.';
    valid = false;
  }

  if (!valid) {
    return;
  }

  try {
    if (select('#rememberMe').checked) {
      window.localStorage.setItem('wallboard-remember-email', email);
    } else {
      window.localStorage.removeItem('wallboard-remember-email');
    }
  } catch {
    // Email convenience storage is optional.
  }

  feedback.className = 'feedback info';
  feedback.textContent = 'اعتبارسنجی فرم موفق بود؛ حساب واقعی ایجاد نشده و ورود انجام نشده است.';
});

try {
  const savedEmail = window.localStorage.getItem('wallboard-remember-email');
  if (savedEmail) {
    select('#email').value = savedEmail;
  }
} catch {
  // Private browsing may prevent local persistence.
}
