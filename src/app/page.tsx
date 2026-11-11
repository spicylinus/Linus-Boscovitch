import { StyleSwitcher } from '@/components/design-system/StyleSwitcher'
import { StyleWrapper } from '@/components/design-system/StyleWrapper'

export default function Home() {
  return (
    <>
      <main
        className="min-h-screen"
        style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}
      >
        {/* Hero */}
        <section
          className="px-6 py-20 text-center"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <p
            className="text-xs uppercase tracking-widest mb-4"
            style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}
          >
            Design System Test
          </p>
          <h1
            className="text-5xl font-bold mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
          >
            Linus-Boscovitch
          </h1>
          <p className="text-lg mb-8" style={{ color: 'var(--color-text-muted)' }}>
            Use the style switcher (bottom-right) to cycle through all 10 design styles.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              className="px-6 py-3 font-semibold text-sm"
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-base)',
                border: '2px solid transparent',
              }}
            >
              Primary Action
            </button>
            <button
              className="px-6 py-3 font-semibold text-sm"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                borderRadius: 'var(--radius)',
                border: '2px solid var(--color-border)',
              }}
            >
              Secondary Action
            </button>
            <button
              className="px-6 py-3 font-semibold text-sm"
              style={{
                background: 'var(--color-accent)',
                color: 'var(--color-text)',
                borderRadius: 'var(--radius)',
              }}
            >
              Accent
            </button>
          </div>
        </section>

        {/* Token Grid */}
        <section className="px-6 py-16 max-w-5xl mx-auto">
          <h2
            className="text-2xl font-bold mb-8"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
          >
            Active Tokens
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: 'Primary', css: 'var(--color-primary)' },
              { label: 'Secondary', css: 'var(--color-secondary)' },
              { label: 'Accent', css: 'var(--color-accent)' },
              { label: 'Background', css: 'var(--color-background)', bordered: true },
              { label: 'Surface', css: 'var(--color-surface)', bordered: true },
              { label: 'Surface Muted', css: 'var(--color-surface-muted)', bordered: true },
              { label: 'Border', css: 'var(--color-border)', bordered: true },
              { label: 'Text', css: 'var(--color-text)', bordered: true },
            ].map(({ label, css, bordered }) => (
              <div
                key={label}
                className="rounded overflow-hidden"
                style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius)' }}
              >
                <div
                  className="h-12"
                  style={{
                    background: css,
                    border: bordered ? '1px solid var(--color-border)' : undefined,
                  }}
                />
                <div className="px-3 py-2" style={{ background: 'var(--color-surface)' }}>
                  <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
                    {label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {css}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Typography */}
        <section
          className="px-6 py-16 max-w-5xl mx-auto"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <h2
            className="text-2xl font-bold mb-8"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
          >
            Typography Scale
          </h2>
          <div className="space-y-4">
            {[
              { size: '3rem', weight: 700, label: 'Display / H1', font: 'var(--font-display)' },
              { size: '2rem', weight: 700, label: 'Heading / H2', font: 'var(--font-display)' },
              { size: '1.25rem', weight: 600, label: 'Subheading / H3', font: 'var(--font-sans)' },
              { size: '1rem', weight: 400, label: 'Body text — the quick brown fox jumps over the lazy dog.', font: 'var(--font-sans)' },
              { size: '0.75rem', weight: 400, label: 'Caption / Mono — 0xdeadbeef', font: 'var(--font-mono)' },
            ].map(({ size, weight, label, font }) => (
              <p
                key={label}
                style={{ fontSize: size, fontWeight: weight, fontFamily: font, color: 'var(--color-text)', lineHeight: 1.2 }}
              >
                {label}
              </p>
            ))}
          </div>
        </section>

        {/* Per-section style demo */}
        <section
          className="px-6 py-16"
          style={{ borderTop: '1px solid var(--color-border)', background: 'var(--color-surface)' }}
        >
          <div className="max-w-5xl mx-auto">
            <h2
              className="text-2xl font-bold mb-2"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
            >
              Per-section Override Demo
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--color-text-muted)' }}>
              These cards use <code style={{ fontFamily: 'var(--font-mono)' }}>&lt;StyleWrapper&gt;</code> to scope individual styles independent of the page theme.
            </p>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <StyleWrapper style="brutalism">
                <div
                  className="p-6"
                  style={{
                    background: 'var(--color-background)',
                    border: '3px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                    Brutalism
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Raw, bold, unapologetic. Zero radius, heavy borders.
                  </p>
                  <button
                    className="mt-4 px-4 py-2 text-sm font-bold"
                    style={{ background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius)', border: '2px solid var(--color-border)' }}
                  >
                    Click
                  </button>
                </div>
              </StyleWrapper>

              <StyleWrapper style="bento">
                <div
                  className="p-6"
                  style={{
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                    Bento
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Soft radii, subtle shadows, Apple-inspired grid layouts.
                  </p>
                  <button
                    className="mt-4 px-4 py-2 text-sm font-bold"
                    style={{ background: 'var(--color-primary)', color: '#fff', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-base)' }}
                  >
                    Click
                  </button>
                </div>
              </StyleWrapper>

              <StyleWrapper style="retro">
                <div
                  className="p-6"
                  style={{
                    background: 'var(--color-background)',
                    border: '2px solid var(--color-border)',
                    borderRadius: 'var(--radius)',
                    boxShadow: 'var(--shadow-lg)',
                  }}
                >
                  <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-display)' }}>
                    Retro
                  </h3>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    Warm tones, playful curves, 70s–90s nostalgia.
                  </p>
                  <button
                    className="mt-4 px-4 py-2 text-sm font-bold"
                    style={{ background: 'var(--color-accent)', color: 'var(--color-text)', borderRadius: 'var(--radius)' }}
                  >
                    Click
                  </button>
                </div>
              </StyleWrapper>
            </div>
          </div>
        </section>
      </main>

      <StyleSwitcher />
    </>
  )
}
