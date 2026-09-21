export default function Login({ onLogin }) {
  return (
    <div className="login-page">
      <div className="login-decoration">
        <div className="login-orb orb-one" />
        <div className="login-orb orb-two" />
        <div className="login-copy">
          <div className="brand-mark large">P</div>
          <span className="eyebrow">PORTAL DATA PDRB</span>
          <h1>Pengumpulan data yang lebih terstruktur.</h1>
          <p>Satu ruang untuk mengelola kebutuhan data PDRB dari berbagai instansi dan periode.</p>
        </div>
      </div>
      <div className="login-form-wrap">
        <form className="login-card" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
          <span className="eyebrow">SELAMAT DATANG</span>
          <h2>Masuk ke sistem</h2>
          <p>Gunakan akun dinas yang telah diberikan oleh administrator.</p>
          <label>Email
            <input type="email" placeholder="nama@dinas.go.id" defaultValue="operator@dinas.go.id" />
          </label>
          <label>Password
            <input type="password" placeholder="••••••••" defaultValue="password" />
          </label>
          <div className="login-options"><label className="checkbox"><input type="checkbox" defaultChecked /> Ingat saya</label><button type="button" className="text-button">Lupa password?</button></div>
          <button className="primary-button full" type="submit">Masuk ke dashboard →</button>
          <small>Akun demo untuk prototype frontend.</small>
        </form>
      </div>
    </div>
  );
}