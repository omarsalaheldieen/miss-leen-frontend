import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      toast.success(`مرحباً ${user.full_name}`);
      navigate('/');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'خطأ في تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Decorative background */}
      <div style={styles.bgDecor1} />
      <div style={styles.bgDecor2} />

      <div style={styles.card}>
        {/* Logo area */}
        <div style={styles.logoWrap}>
          <div style={styles.logoImgWrap}>
            <img
              src={logo}
              alt="Miss Leen Logo"
              style={styles.logoImg}
            />
          </div>
          <div style={styles.logoTagline}>نظام إدارة المصنع</div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>اسم المستخدم</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <input
                type="text"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="أدخل اسم المستخدم"
                style={styles.input}
                autoComplete="username"
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>كلمة المرور</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="أدخل كلمة المرور"
                style={{ ...styles.input, paddingLeft: 40 }}
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPass(p => !p)} style={styles.showPassBtn}>
                {showPass
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} style={{ ...styles.btn, ...(loading ? styles.btnDisabled : {}) }}>
            {loading
              ? <span style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'center' }}>
                  <span style={{ width:18,height:18,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'#fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite' }}/>
                  جارٍ الدخول...
                </span>
              : 'تسجيل الدخول'
            }
          </button>
        </form>

        <div style={styles.footer}>
          <div style={styles.footerDivider}/>
          <span style={styles.footerText}>ميس لين © {new Date().getFullYear()}</span>
          <div style={styles.footerDivider}/>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        input:focus { outline: none; border-color: #CC1010 !important; box-shadow: 0 0 0 3px rgba(204,16,16,0.12) !important; }
        button[type=submit]:hover:not(:disabled) { background: #A00C0C !important; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(204,16,16,0.35) !important; }
        button[type=submit]:active:not(:disabled) { transform: translateY(0); }

        @media (max-width: 480px) {
          .login-card {
            padding: 32px 20px 24px !important;
            border-radius: 16px !important;
            margin: 12px !important;
          }
          .login-logo-img {
            max-width: 160px !important;
            max-height: 80px !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    background: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
  },
  bgDecor1: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 400,
    height: 400,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(204,16,16,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgDecor2: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(204,16,16,0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    padding: '48px 48px 36px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 4px 40px rgba(0,0,0,0.12)',
    border: '1px solid #F0F0F0',
    position: 'relative',
    zIndex: 1,
    animation: 'fadeIn 0.4s ease',
  },
  logoWrap: {
    textAlign: 'center',
    marginBottom: 36,
  },
  logoImgWrap: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoImg: {
    maxWidth: 200,
    maxHeight: 100,
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
  },
  logoTagline: {
    color: '#767676',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '0.04em',
    marginTop: 4,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 7,
  },
  label: {
    fontSize: 14,
    fontWeight: 600,
    color: '#1A1A1A',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    right: 14,
    color: '#B0B0B0',
    display: 'flex',
    alignItems: 'center',
    pointerEvents: 'none',
    zIndex: 1,
  },
  input: {
    width: '100%',
    padding: '12px 46px 12px 14px',
    fontSize: 15,
    fontFamily: 'Cairo, sans-serif',
    fontWeight: 500,
    border: '1.5px solid #E0E0E0',
    borderRadius: 10,
    background: '#FAFAFA',
    color: '#1A1A1A',
    direction: 'rtl',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  },
  showPassBtn: {
    position: 'absolute',
    left: 14,
    background: 'none',
    border: 'none',
    color: '#B0B0B0',
    display: 'flex',
    alignItems: 'center',
    padding: 0,
    cursor: 'pointer',
  },
  btn: {
    marginTop: 8,
    padding: '14px 24px',
    background: '#CC1010',
    color: '#fff',
    border: 'none',
    borderRadius: 10,
    fontSize: 16,
    fontFamily: 'Cairo, sans-serif',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 14px rgba(204,16,16,0.25)',
  },
  btnDisabled: {
    opacity: 0.7,
    cursor: 'not-allowed',
    transform: 'none',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 32,
  },
  footerDivider: {
    flex: 1,
    height: 1,
    background: '#E8E8E8',
  },
  footerText: {
    fontSize: 12,
    color: '#B0B0B0',
    whiteSpace: 'nowrap',
  },
};
