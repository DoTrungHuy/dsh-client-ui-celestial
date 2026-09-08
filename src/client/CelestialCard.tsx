import { useSyncExternalStore, type ReactElement } from 'react'
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client'

interface CelestialSettings {
  enabled: boolean
}

/** Props for the Plugins settings card. */
export interface CelestialCardProps {
  /** Bound settings scope for `ui-celestial`. */
  scope: SettingsScope<CelestialSettings>
}

/** Card shown under Settings → Plugins when this user plugin is loaded. */
export function CelestialCard({ scope }: CelestialCardProps): ReactElement | null {
  const snapshot = useSyncExternalStore(scope.subscribe, scope.getSnapshot)
  if (snapshot.status === 'unavailable' || snapshot.value === undefined) return null

  const enabled = snapshot.value.enabled !== false
  const writable = snapshot.writable
  const chinese = document.documentElement.lang.toLowerCase().startsWith('zh')

  return (
    <li data-dsh-celestial-card style={{ listStyle: 'none', margin: '0 0 12px', padding: '12px 14px', border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 12, background: 'var(--dsw-alias-bg-layer-1)' }}>
      <strong style={{ display: 'block', fontSize: 14 }}>{chinese ? '天体工作台' : 'Celestial workbench'}</strong>
      <p style={{ margin: '6px 0 10px', color: 'var(--dsw-alias-label-secondary)', fontSize: 12, lineHeight: 1.5 }}>
        {chinese
          ? '本地用户插件：羊皮纸 / 星空配色、背景插画和粒子。关闭后恢复官方默认外观。'
          : 'Local user plugin: parchment / night-sky palette, artwork, and particles. Turn it off to restore the official look.'}
      </p>
      <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
        <input
          type="checkbox"
          checked={enabled}
          disabled={!writable}
          onChange={(event) => { void scope.set('enabled', event.currentTarget.checked) }}
        />
        {chinese ? '启用天体皮肤' : 'Enable celestial skin'}
      </label>
      <p style={{ margin: '8px 0 0', color: 'var(--dsw-alias-label-caption)', fontSize: 11 }}>
        {chinese ? '用户插件 dsh-client-ui-celestial' : 'User plugin dsh-client-ui-celestial'}
      </p>
    </li>
  )
}
