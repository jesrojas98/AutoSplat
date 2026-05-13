import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { formatPriceNumber } from '@/utils/formatters'
import { vehiclesService, type Vehicle } from '@/services/vehicles.service'
import { favoritesService } from '@/services/favorites.service'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth.store'

const TRANSMISSION_LABEL: Record<string, string> = { manual: 'Manual', automatic: 'Automático', cvt: 'CVT' }
const FUEL_LABEL: Record<string, string> = { gasoline: 'Bencina', diesel: 'Diésel', electric: 'Eléctrico', hybrid: 'Híbrido' }

export function VehicleDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const navigate = useNavigate()

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [saved, setSaved] = useState(false)
  const [savingFav, setSavingFav] = useState(false)
  const [message, setMessage] = useState('')
  const [sendingMsg, setSendingMsg] = useState(false)
  const [msgSent, setMsgSent] = useState(false)

  useEffect(() => {
    if (!id) return
    vehiclesService.getOne(id)
      .then((v) => { setVehicle(v); setLoading(false) })
      .catch(() => setLoading(false))
    if (user) favoritesService.isSaved(id).then((r) => setSaved(r.saved))
  }, [id, user])

  async function toggleFavorite() {
    if (!user) { navigate('/login'); return }
    setSavingFav(true)
    const res = await favoritesService.toggle(id!)
    setSaved(res.saved)
    setSavingFav(false)
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (!message.trim()) return
    setSendingMsg(true)
    await api.post('/messages', { receiver_id: vehicle!.seller_id, vehicle_id: id, content: message })
    setMsgSent(true)
    setSendingMsg(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <span className="material-symbols-outlined text-[var(--color-primary)] animate-spin" style={{ fontSize: 40 }}>progress_activity</span>
    </div>
  )

  if (!vehicle) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-[var(--spacing-gutter)] text-center">
      <p className="label-caps text-[var(--color-primary)] mb-4">404</p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700 }} className="mb-6">Vehículo no encontrado</h1>
      <Link to="/catalog" className="glow-primary px-8 py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all">
        VER CATÁLOGO
      </Link>
    </div>
  )

  const images = vehicle.vehicle_images
    ?.filter((i) => i.image_type !== 'reconstruction')
    .sort((a, b) => a.sort_order - b.sort_order) ?? []

  const specs = [
    vehicle.transmission && { label: 'TRANSMISIÓN', value: TRANSMISSION_LABEL[vehicle.transmission] ?? vehicle.transmission, icon: 'settings' },
    vehicle.fuel_type && { label: 'COMBUSTIBLE', value: FUEL_LABEL[vehicle.fuel_type] ?? vehicle.fuel_type, icon: 'oil_barrel' },
    vehicle.body_type && { label: 'CARROCERÍA', value: vehicle.body_type, icon: 'directions_car' },
    vehicle.color && { label: 'COLOR', value: vehicle.color, icon: 'palette' },
    vehicle.doors && { label: 'PUERTAS', value: String(vehicle.doors), icon: 'sensor_door' },
    { label: 'KILOMETRAJE', value: `${vehicle.mileage.toLocaleString('es-CL')} km`, icon: 'speed' },
  ].filter(Boolean) as { label: string; value: string; icon: string }[]

  return (
    <div className="px-[var(--spacing-gutter)] py-10 max-w-[var(--spacing-max-width)] mx-auto">
      <nav className="flex items-center gap-2 label-caps text-[var(--color-on-surface-variant)] text-xs mb-8">
        <Link to="/" className="hover:text-[var(--color-primary)] transition-colors">INICIO</Link>
        <span>/</span>
        <Link to="/catalog" className="hover:text-[var(--color-primary)] transition-colors">CATÁLOGO</Link>
        <span>/</span>
        <span className="text-[var(--color-on-surface)]">{vehicle.brand} {vehicle.model}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* Galería */}
        <div className="flex flex-col gap-4">
          <div className="aspect-[16/10] rounded-xl overflow-hidden relative bg-[var(--color-surface-container-high)]">
            {images[activeImg] ? (
              <img src={images[activeImg].image_url} alt={`${vehicle.brand} ${vehicle.model}`} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[var(--color-outline)]" style={{ fontSize: 64 }}>directions_car</span>
              </div>
            )}
            {vehicle.has_3d_model && (
              <div className="absolute top-4 left-4 flex items-center gap-2 glass-card px-3 py-2 rounded-lg">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-base">view_in_ar</span>
                <span className="label-caps text-[var(--color-primary)] text-[10px]">VISTA 3D DISPONIBLE</span>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImg(i)}
                  className={`flex-shrink-0 w-24 aspect-[4/3] rounded-lg overflow-hidden border-2 transition-colors ${i === activeImg ? 'border-[var(--color-primary)]' : 'border-[var(--color-outline-variant)]/30 hover:border-[var(--color-primary)]/50'}`}>
                  <img src={img.thumbnail_url ?? img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {vehicle.has_3d_model && (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-outline-variant)]/30">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] animate-pulse" />
                  <span className="label-caps text-[var(--color-primary)] text-[10px]">VISTA 3D EN VIVO</span>
                </div>
                <span className="mono-spec text-[var(--color-on-surface-variant)] text-xs">Gaussian Splatting</span>
              </div>
              <div className="h-64 flex flex-col items-center justify-center gap-3 bg-[var(--color-surface-container-lowest)]">
                <span className="material-symbols-outlined text-[var(--color-primary)]" style={{ fontSize: 48, fontVariationSettings: "'FILL' 1" }}>blur_on</span>
                <p className="label-caps text-[var(--color-on-surface-variant)] text-xs">Visor 3D — próximamente</p>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="label-caps text-[var(--color-on-surface-variant)] mb-1">{vehicle.year} · {vehicle.brand}</p>
            <h1 style={{ fontFamily: 'var(--font-headline)', fontSize: 36, fontWeight: 700, lineHeight: 1.2 }} className="mb-3">{vehicle.model}</h1>
            <p className="flex items-baseline gap-2">
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 700 }} className="text-[var(--color-on-surface)]">
                {formatPriceNumber(vehicle.price)}
              </span>
              <span className="label-caps text-[var(--color-on-surface-variant)] text-xs">CLP</span>
            </p>
          </div>

          <div className="flex items-center gap-2 text-[var(--color-on-surface-variant)]">
            <span className="material-symbols-outlined text-base">location_on</span>
            <span className="text-sm">{vehicle.location}{vehicle.region ? `, ${vehicle.region}` : ''}</span>
          </div>

          {/* Contactar vendedor */}
          {vehicle.seller_id !== user?.id && (
            <div className="glass-card rounded-xl p-5">
              <h3 className="label-caps text-[var(--color-on-surface-variant)] mb-3">CONTACTAR AL VENDEDOR</h3>
              {msgSent ? (
                <div className="flex items-center gap-2 text-[var(--color-primary)]">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  <p className="text-sm">¡Mensaje enviado! El vendedor te responderá pronto.</p>
                </div>
              ) : (
                <form onSubmit={sendMessage} className="flex flex-col gap-3">
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hola, me interesa este vehículo..." rows={3} required
                    className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/30 rounded-lg px-3 py-2 text-sm text-[var(--color-on-surface)] outline-none focus:border-[var(--color-primary)]/50 placeholder:text-[var(--color-outline)] resize-none" />
                  <button type="submit" disabled={sendingMsg}
                    className="glow-primary w-full py-3 bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)] label-caps font-bold rounded-lg hover:bg-[var(--color-primary)] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                    <span className="material-symbols-outlined text-base">{sendingMsg ? 'progress_activity' : 'send'}</span>
                    {sendingMsg ? 'ENVIANDO...' : 'ENVIAR MENSAJE'}
                  </button>
                </form>
              )}
            </div>
          )}

          <button onClick={toggleFavorite} disabled={savingFav}
            className="w-full py-3 border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface)] label-caps rounded-lg hover:bg-[var(--color-surface-container)] transition-all flex items-center justify-center gap-2 disabled:opacity-60">
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
            {saved ? 'GUARDADO EN FAVORITOS' : 'GUARDAR EN FAVORITOS'}
          </button>

          {specs.length > 0 && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="label-caps text-[var(--color-on-surface-variant)] mb-4">ESPECIFICACIONES</h3>
              <div className="grid grid-cols-2 gap-4">
                {specs.map(({ label, value, icon }) => (
                  <div key={label} className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[var(--color-primary)] text-base mt-0.5">{icon}</span>
                    <div>
                      <p className="label-caps text-[var(--color-on-surface-variant)] text-[10px]">{label}</p>
                      <p className="mono-spec text-[var(--color-on-surface)] text-sm">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {vehicle.description && (
            <div className="glass-card rounded-xl p-6">
              <h3 className="label-caps text-[var(--color-on-surface-variant)] mb-3">DESCRIPCIÓN</h3>
              <p className="text-[var(--color-on-surface-variant)] text-sm leading-relaxed">{vehicle.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
